import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { LETTERS, PRIZES, SAFE_LEVELS, type GameState, type Letter } from "@/lib/game-types";
import { cn } from "@/lib/utils";

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="text-center leading-none">
      <div className={cn("font-display font-extrabold text-gold drop-shadow-[0_2px_12px_var(--gold-glow)]", small ? "text-2xl" : "text-5xl md:text-7xl")}>
        Meelo Evaru Winner
      </div>
      <div className={cn("mt-1 tracking-[0.3em] uppercase text-muted-foreground", small ? "text-[10px]" : "text-sm")}>
        Fun Friday Edition
      </div>
    </div>
  );
}

export function PrizeLadder({ index, status }: { index: number; status: GameState["status"] }) {
  return (
    <ol className="flex flex-col-reverse gap-1">
      {PRIZES.map((p, i) => {
        const current = i === index && status !== "idle";
        const done = i < index || (i === index && (status === "revealed" || status === "won"));
        const safe = SAFE_LEVELS.includes(i);
        return (
          <li
            key={p}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-1 text-sm transition-all duration-500",
              current && "bg-gold text-gold-foreground font-bold scale-105 shadow-[0_0_20px_var(--gold-glow)]",
              !current && done && "text-gold",
              !current && !done && (safe ? "text-foreground font-semibold" : "text-muted-foreground"),
            )}
          >
            <span className="w-6 opacity-70">{i + 1}</span>
            <span>{p}</span>
            <span className="w-4 text-xs">{safe ? "◆" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function TimerRing({ seconds, total }: { seconds: number | null; total: number }) {
  if (seconds === null) return null;
  const pct = Math.max(0, Math.min(1, seconds / total));
  const r = 34;
  const c = 2 * Math.PI * r;
  const danger = seconds <= 10;
  return (
    <div className={cn("relative size-20", danger && seconds > 0 && "animate-pulse")}>
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} className="fill-none stroke-muted" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} strokeWidth="6" strokeLinecap="round"
          className={cn("fill-none transition-all duration-300", danger ? "stroke-destructive" : "stroke-gold")}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-display text-2xl font-bold">{seconds}</div>
    </div>
  );
}

export function OptionTile({
  letter, text, state, onClick, disabled, hint,
}: {
  letter: Letter; text: string; hint?: string;
  state: "idle" | "removed" | "selected" | "locked" | "correct" | "wrong";
  onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === "removed"}
      className={cn(
        "option-hex group relative flex min-h-16 w-full items-center gap-3 px-8 py-3 text-left text-lg transition-all duration-300",
        state === "idle" && "bg-option text-foreground hover:bg-option-hover enabled:hover:scale-[1.02]",
        state === "selected" && "bg-option-hover text-foreground ring-2 ring-gold",
        state === "locked" && "bg-locked text-locked-foreground animate-[pulse_1.2s_ease-in-out_infinite]",
        state === "correct" && "bg-success text-success-foreground animate-[correct-flash_0.4s_ease-in-out_4]",
        state === "wrong" && "bg-destructive text-destructive-foreground animate-[shake_0.5s]",
        state === "removed" && "bg-option/30 text-transparent",
      )}
    >
      <span className={cn("font-display font-bold", state === "idle" || state === "selected" ? "text-gold" : "")}>{letter}:</span>
      <span className="flex-1">{state === "removed" ? "" : text}</span>
      {hint && state !== "removed" && <span className="text-sm font-semibold opacity-80">{hint}</span>}
    </button>
  );
}

export function tileState(l: Letter, s: GameState, localSel?: Letter | null): Parameters<typeof OptionTile>[0]["state"] {
  if (s.removed?.includes(l)) return "removed";
  if (s.revealedAnswer) {
    if (l === s.revealedAnswer) return "correct";
    if (l === s.selected) return "wrong";
    return "idle";
  }
  if (s.status === "locked" && s.selected === l) return "locked";
  if (localSel === l) return "selected";
  return "idle";
}

export function PollBars({ votes, removed }: { votes: { choice: Letter }[]; removed?: Letter[] | undefined }) {
  const total = votes.length;
  const counts = LETTERS.map((l) => votes.filter((v) => v.choice === l).length);
  const max = Math.max(...counts);
  return (
    <div>
      <div className="flex h-40 items-end justify-around gap-3">
        {LETTERS.map((l, i) => {
          const pct = total ? Math.round(((counts[i] ?? 0) / total) * 100) : 0;
          const top = total > 0 && counts[i] === max;
          return (
            <div key={l} className={cn("flex flex-1 flex-col items-center gap-1", removed?.includes(l) && "opacity-30")}>
              <span className="text-sm font-bold">{pct}%</span>
              <div className="flex h-28 w-full items-end rounded bg-muted/40">
                <div
                  className={cn("w-full rounded transition-all duration-700", top ? "bg-gold" : "bg-option-hover")}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="font-display font-bold text-gold">{l}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">{total} vote{total === 1 ? "" : "s"}</p>
    </div>
  );
}

export function useConfetti(trigger: boolean, big = false) {
  const fired = useRef(false);
  useEffect(() => {
    if (!trigger) { fired.current = false; return; }
    if (fired.current) return;
    fired.current = true;
    const colors = ["#f5c542", "#ffffff", "#ff8a3d", "#3dd68c"];
    confetti({ particleCount: big ? 250 : 120, spread: 90, origin: { y: 0.6 }, colors });
    if (big) {
      setTimeout(() => confetti({ particleCount: 150, angle: 60, spread: 70, origin: { x: 0 }, colors }), 300);
      setTimeout(() => confetti({ particleCount: 150, angle: 120, spread: 70, origin: { x: 1 }, colors }), 500);
    }
  }, [trigger, big]);
}

export function QuestionMedia({ type, media }: { type: string; media: string | null }) {
  if (!media) return null;
  if (type === "image") return <img src={media} alt="Question" className="mx-auto max-h-64 rounded-lg border-2 border-gold/40 object-contain" />;
  if (type === "audio") return <audio src={media} controls className="mx-auto w-full max-w-md" />;
  return null;
}
