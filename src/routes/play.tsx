import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Logo, OptionTile, PollBars, PrizeLadder, QuestionMedia, TimerRing, tileState, useConfetti } from "@/components/show";
import { PollQR, StageBanner } from "@/components/StageExtras";
import { playerAction } from "@/lib/game.functions";
import { useCountdown, useGame, useVotes } from "@/lib/use-game";
import { JOKES, LETTERS, type Letter } from "@/lib/game-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Hot Seat – Meelo Evaru Winner" },
      { name: "description", content: "The hot-seat game screen for Meelo Evaru Winner Fun Friday Edition." },
      { property: "og:title", content: "Hot Seat – Meelo Evaru Winner" },
      { property: "og:description", content: "Who will win ₹100 this Fun Friday?" },
    ],
  }),
  component: HotSeat,
});

function HotSeat() {
  const { state, settings } = useGame();
  const act = useServerFn(playerAction);
  const [sel, setSel] = useState<Letter | null>(null);
  const [dosthOpen, setDosthOpen] = useState(false);
  const [team, setTeam] = useState<"team1" | "team2" | null>(null);
  const seconds = useCountdown(state.timerEndsAt, state.timerRemaining);
  const pollActive = state.poll?.index === state.index && !!state.lifelines?.poll;
  const votes = useVotes(pollActive ? state.poll?.round : undefined);

  useEffect(() => setSel(null), [state.index, state.status]);
  useConfetti(state.status === "revealed");
  useConfetti(state.status === "won", true);

  const q = state.question;
  const canAct = state.status === "question";
  const run = async (data: { action: "lock" | "fifty" | "poll" | "dosth"; letter?: Letter; team?: string; member?: string }) => {
    try { await act({ data }); } catch { toast.error("Network hiccup. Blame the Wi-Fi."); }
  };

  if (state.status === "idle" || !q) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-10 overflow-hidden p-6">
        <div className="stage-lights pointer-events-none absolute inset-0" />
        <Logo />
        <p className="font-display text-3xl">Welcome to the hot seat, <span className="text-gold">{settings.playerName}</span>!</p>
        <p className="text-muted-foreground">Waiting for the host to start the game…</p>
        <PollQR size={140} />
      </main>
    );
  }

  const lifeBtn = "flex flex-col items-center gap-1 rounded-full border-2 border-gold/60 bg-card px-4 py-3 text-sm font-semibold transition hover:bg-accent disabled:opacity-30 disabled:line-through";

  return (
    <main className="grid min-h-screen gap-6 p-4 lg:grid-cols-[1fr_260px] lg:p-8">
      <section className="flex flex-col gap-5">
        <header className="flex items-center justify-between gap-4">
          <Link to="/"><Logo small /></Link>
          <div className="flex gap-3">
            <button className={lifeBtn} disabled={!canAct || !!state.lifelines?.dosth} onClick={() => setDosthOpen(true)}>📞<span>Dial-a-Dosth</span></button>
            <button className={lifeBtn} disabled={!canAct || !!state.lifelines?.poll} onClick={() => run({ action: "poll" })}>👥<span>Audience Poll</span></button>
            <button className={lifeBtn} disabled={!canAct || !!state.lifelines?.fifty} onClick={() => run({ action: "fifty" })}>✂️<span>50-50</span></button>
          </div>
          <TimerRing seconds={seconds} total={settings.questionTimerSec} />
        </header>

        <div className="flex min-h-20 items-center justify-center">
          {seconds === 0 && canAct ? (
            <div className="animate-pop font-display text-2xl text-destructive">{JOKES.timeUp}</div>
          ) : (
            <StageBanner state={state} dosthText={state.dosth ? `Calling ${state.dosth.member} from ${state.dosth.team}… ${JOKES.dosth}` : undefined} />
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div key={q.id} className="option-hex animate-pop flex min-h-28 flex-col justify-center gap-3 bg-option px-12 py-6 text-center">
            <div className="text-sm text-gold">Question {state.index + 1} · for {q.prize}</div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">{q.question}</h1>
          </div>
          {pollActive && (
            <div className="w-full rounded-2xl border bg-card p-4 lg:w-72">
              <div className="mb-2 text-center font-semibold">👥 HR says… {state.poll?.open ? "(live)" : "(closed)"}</div>
              <PollBars votes={votes} removed={state.removed} />
            </div>
          )}
        </div>

        <QuestionMedia type={q.type} media={q.media} />

        <div className="grid gap-3 md:grid-cols-2">
          {LETTERS.map((l) => (
            <OptionTile
              key={l}
              letter={l}
              text={q.options[l]}
              state={tileState(l, state, sel)}
              disabled={!canAct}
              onClick={() => setSel(l)}
            />
          ))}
        </div>

        <div className="flex justify-center">
          {canAct && (
            <button
              disabled={!sel}
              onClick={() => sel && run({ action: "lock", letter: sel })}
              className="rounded-full bg-gold px-10 py-4 font-display text-xl font-bold text-gold-foreground shadow-[0_0_30px_var(--gold-glow)] transition hover:scale-105 disabled:opacity-40"
            >
              🔒 Lock answer {sel ? `${sel}` : ""}
            </button>
          )}
          {state.status === "locked" && <p className="text-muted-foreground">Waiting for the host to reveal… 🥁</p>}
          {(state.status === "lost" || state.status === "won" || state.status === "quit") && (
            <p className="font-display text-3xl">Take-home prize: <span className="text-gold">{state.winnings}</span></p>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-4">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Hot seat</div>
          <div className="font-display text-xl font-bold">{settings.playerName}</div>
        </div>
        <PrizeLadder index={state.index} status={state.status} />
        <PollQR size={80} />
      </aside>

      {dosthOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur" onClick={() => setDosthOpen(false)}>
          <div className="animate-pop w-full max-w-lg rounded-2xl border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold">📞 Dial-a-Dosth</h2>
            <p className="mb-4 text-muted-foreground">{JOKES.dosth}</p>
            {!team ? (
              <div className="grid grid-cols-2 gap-3">
                {(["team1", "team2"] as const).map((t) => (
                  <button key={t} onClick={() => setTeam(t)} className="rounded-xl bg-option p-6 font-display text-xl hover:bg-option-hover">
                    {settings[t].name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <button className="text-sm text-muted-foreground underline" onClick={() => setTeam(null)}>← {settings[team].name}</button>
                <div className="grid grid-cols-2 gap-2">
                  {settings[team].members.length === 0 && <p className="col-span-2 text-muted-foreground">No members yet — add them in Setup.</p>}
                  {settings[team].members.map((m) => (
                    <button
                      key={m}
                      className={cn("rounded-lg bg-option px-3 py-3 hover:bg-option-hover")}
                      onClick={async () => {
                        await run({ action: "dosth", team: settings[team].name, member: m });
                        setDosthOpen(false);
                        setTeam(null);
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
