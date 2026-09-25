import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Logo } from "@/components/show";
import { submitVote } from "@/lib/game.functions";
import { useCountdown, useGame } from "@/lib/use-game";
import { LETTERS, type Letter } from "@/lib/game-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/poll")({
  head: () => ({
    meta: [
      { title: "Audience Poll – HR Edition" },
      { name: "description", content: "Help the hot-seat player: vote A, B, C or D from your phone." },
      { property: "og:title", content: "Audience Poll – HR Edition" },
      { property: "og:description", content: "Vote live in Meelo Evaru Winner." },
    ],
  }),
  component: Poll,
});

function Poll() {
  const { state } = useGame();
  const vote = useServerFn(submitVote);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [votedRound, setVotedRound] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const left = useCountdown(state.poll?.open ? state.poll.endsAt : null, null);

  useEffect(() => {
    const n = localStorage.getItem("mew-voter");
    if (n) { setName(n); setJoined(true); }
  }, []);

  const round = state.poll?.round ?? 0;
  const open = !!state.poll?.open && (left === null || left > 0);
  const q = state.question;

  if (!joined) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <Logo small />
        <h1 className="text-center font-display text-3xl font-bold">👥 Audience Poll<br /><span className="text-gold">HR Edition</span></h1>
        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) { localStorage.setItem("mew-voter", name.trim()); setJoined(true); } }}
        >
          <input className="w-full rounded-xl border bg-card px-4 py-4 text-lg" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          <button className="w-full rounded-xl bg-gold py-4 font-bold text-gold-foreground">Join the audience</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      <Logo small />
      <p className="text-center text-sm text-muted-foreground">Voting as <b className="text-foreground">{name}</b></p>
      {!open ? (
        <div className="mt-10 rounded-2xl border bg-card p-8 text-center">
          <div className="text-5xl">☕</div>
          <p className="mt-3 font-display text-xl">{votedRound === round && round > 0 ? "Vote received! HR has spoken… probably." : "Waiting for the host to open the poll…"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Keep this page open. It updates live.</p>
        </div>
      ) : votedRound === round ? (
        <div className="mt-10 rounded-2xl border bg-card p-8 text-center animate-pop">
          <div className="text-5xl">✅</div>
          <p className="mt-3 font-display text-xl">Vote locked! No take-backs, like a merged PR.</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-card p-4 text-center">
            {left !== null && <div className="font-display text-3xl text-gold">{left}s</div>}
            <p className="text-lg font-semibold">{q?.question}</p>
          </div>
          <div className="grid gap-3">
            {LETTERS.map((l: Letter) => {
              const removed = state.removed?.includes(l);
              return (
                <button
                  key={l}
                  disabled={removed}
                  onClick={async () => {
                    setError(null);
                    const r = await vote({ data: { name, choice: l } });
                    if (r.ok || r.error?.includes("already")) setVotedRound(round);
                    if (!r.ok) setError(r.error ?? "Error");
                  }}
                  className={cn("rounded-2xl bg-option px-5 py-5 text-left text-lg active:scale-95", removed && "opacity-20")}
                >
                  <b className="mr-2 text-gold">{l}</b> {removed ? "—" : q?.options[l]}
                </button>
              );
            })}
          </div>
        </>
      )}
      {error && <p className="text-center text-destructive">{error}</p>}
    </main>
  );
}
