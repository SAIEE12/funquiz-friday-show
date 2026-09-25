import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PinGate } from "@/components/PinGate";
import { Logo, PollBars, PrizeLadder, QuestionMedia, TimerRing } from "@/components/show";
import { PollQR } from "@/components/StageExtras";
import { hostAction } from "@/lib/game.functions";
import { useCountdown, useGame, useVotes } from "@/lib/use-game";
import { LETTERS } from "@/lib/game-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host Control Panel – Meelo Evaru Winner" },
      { name: "description", content: "Control questions, timers, lifelines and answer reveals." },
      { property: "og:title", content: "Host Control Panel – Meelo Evaru Winner" },
      { property: "og:description", content: "Run the Fun Friday quiz show." },
    ],
  }),
  component: () => <PinGate>{(pin, logout) => <Host pin={pin} logout={logout} />}</PinGate>,
});

type Action = "verify" | "answer" | "start" | "next" | "reveal" | "timerStart" | "timerPause" | "timerReset" | "openPoll" | "closePoll" | "fifty" | "quit" | "reset";

function Host({ pin, logout }: { pin: string; logout: () => void }) {
  const { state, settings } = useGame();
  const act = useServerFn(hostAction);
  const [answer, setAnswer] = useState<string | null>(null);
  const seconds = useCountdown(state.timerEndsAt, state.timerRemaining);
  const pollActive = state.poll?.index === state.index && !!state.lifelines?.poll;
  const votes = useVotes(pollActive ? state.poll?.round : undefined);
  const pollLeft = useCountdown(state.poll?.open ? state.poll.endsAt : null, null);

  const run = async (action: Action) => {
    try { return await act({ data: { pin, action } }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); return null; }
  };

  useEffect(() => {
    run("answer").then((r) => setAnswer(r?.answer ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, state.status]);

  const q = state.question;
  const s = state.status;
  const btn = "rounded-lg px-4 py-3 font-semibold transition disabled:opacity-30";
  const over = s === "lost" || s === "won" || s === "quit";

  return (
    <main className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-[1fr_320px]">
      <section className="space-y-5">
        <header className="flex items-center justify-between">
          <Link to="/"><Logo small /></Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/play" target="_blank" className="underline">Open Hot Seat ↗</Link>
            <button onClick={logout} className="text-muted-foreground underline">Lock</button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
          <span className="rounded-full bg-accent px-3 py-1 text-sm uppercase">{s}</span>
          <span>Player: <b>{settings.playerName}</b></span>
          <span>Winnings: <b className="text-gold">{state.winnings ?? "₹0"}</b></span>
          <div className="ml-auto"><TimerRing seconds={seconds} total={settings.questionTimerSec} /></div>
        </div>

        {/* Main controls */}
        <div className="flex flex-wrap gap-2">
          <button className={cn(btn, "bg-gold text-gold-foreground")} onClick={() => { if (s === "idle" || over || confirm("Restart game from Q1?")) run("start"); }}>
            {s === "idle" ? "▶ Start game" : "↺ Restart"}
          </button>
          <button className={cn(btn, "bg-success text-success-foreground")} disabled={s !== "locked"} onClick={() => run("reveal")}>🎯 Reveal answer</button>
          <button className={cn(btn, "bg-option-hover")} disabled={s !== "revealed"} onClick={() => run("next")}>⏭ Next question</button>
          <button className={cn(btn, "bg-secondary")} disabled={s !== "question"} onClick={() => run("quit")}>🏳 Player quits</button>
          <button className={cn(btn, "bg-destructive text-destructive-foreground")} onClick={() => confirm("Reset to welcome screen?") && run("reset")}>Reset</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="self-center text-sm text-muted-foreground">Timer:</span>
          <button className={cn(btn, "bg-secondary")} onClick={() => run("timerStart")} disabled={!!state.timerEndsAt || s !== "question"}>Start/Resume</button>
          <button className={cn(btn, "bg-secondary")} onClick={() => run("timerPause")} disabled={!state.timerEndsAt}>Pause</button>
          <button className={cn(btn, "bg-secondary")} onClick={() => run("timerReset")} disabled={s !== "question"}>Reset</button>
          <span className="ml-4 self-center text-sm text-muted-foreground">Lifelines:</span>
          <button className={cn(btn, "bg-secondary")} disabled={s !== "question" || !!state.lifelines?.fifty} onClick={() => run("fifty")}>✂️ 50-50</button>
          <button className={cn(btn, "bg-secondary")} disabled={s !== "question" || !!state.lifelines?.poll} onClick={() => run("openPoll")}>👥 Open poll</button>
          <button className={cn(btn, "bg-secondary")} disabled={!state.poll?.open} onClick={() => run("closePoll")}>Close poll</button>
        </div>

        {q && (
          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="text-sm text-gold">Q{state.index + 1} / {state.total ?? 15} · {q.prize} · {q.type}</div>
            <h2 className="font-display text-2xl font-bold">{q.question}</h2>
            <QuestionMedia type={q.type} media={q.media} />
            <div className="grid gap-2 md:grid-cols-2">
              {LETTERS.map((l) => (
                <div
                  key={l}
                  className={cn(
                    "rounded-lg border px-4 py-3",
                    state.removed?.includes(l) && "opacity-30 line-through",
                    answer === l && "border-success bg-success/15",
                    state.selected === l && "ring-2 ring-locked",
                  )}
                >
                  <b className="text-gold">{l}:</b> {q.options[l]}
                  {answer === l && <span className="ml-2 text-xs text-success">✔ correct</span>}
                  {state.selected === l && <span className="ml-2 text-xs text-locked">🔒 locked</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">🤫 Only you can see the correct answer here.</p>
          </div>
        )}

        {state.dosth && (
          <div className="rounded-2xl border bg-card p-4">📞 Dial-a-Dosth: <b>{state.dosth.member}</b> ({state.dosth.team})</div>
        )}
      </section>

      <aside className="space-y-4">
        <PollQR size={110} />
        {pollActive && (
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-2 flex justify-between font-semibold">
              <span>👥 Poll {state.poll?.open ? "live" : "closed"}</span>
              {pollLeft !== null && state.poll?.open && <span className="text-gold">{pollLeft}s</span>}
            </div>
            <PollBars votes={votes} removed={state.removed} />
            <div className="mt-3 max-h-32 overflow-auto text-xs text-muted-foreground">
              {votes.map((v) => `${v.voter_name} → ${v.choice}`).join(" · ")}
            </div>
          </div>
        )}
        <div className="rounded-2xl border bg-card p-4">
          <PrizeLadder index={state.index} status={s} />
        </div>
      </aside>
    </main>
  );
}
