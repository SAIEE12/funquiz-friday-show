import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { JOKES, type GameState } from "@/lib/game-types";

export function PollQR({ size = 120 }: { size?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(`${window.location.origin}/poll`), []);
  if (!url) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card/70 p-3">
      <div className="rounded-lg bg-foreground p-2">
        <QRCodeSVG value={url} size={size} />
      </div>
      <div className="text-sm">
        <div className="font-bold">📱 Audience Poll</div>
        <div className="break-all text-muted-foreground">{url}</div>
      </div>
    </div>
  );
}

/** Big animated banner for lifeline / result moments */
export function StageBanner({ state, dosthText }: { state: GameState; dosthText?: string }) {
  let text: string | null = null;
  let title = "";
  if (state.status === "lost") { title = "Galat Jawab!"; text = JOKES.wrong; }
  else if (state.status === "won") { title = "₹100 WINNER!"; text = JOKES.won; }
  else if (state.status === "quit") { title = `Walks away with ${state.winnings}`; text = JOKES.quit; }
  else if (state.status === "revealed") { title = "Sahi Jawab!"; text = JOKES.correct[state.index % JOKES.correct.length] ?? ""; }
  else if (state.status === "locked") { title = "Lock kiya jaye!"; text = JOKES.lock; }
  else if (state.message === "fifty") { title = "✂️ 50-50"; text = JOKES.fifty; }
  else if (state.message === "poll") { title = "👥 Audience Poll"; text = JOKES.poll; }
  else if (state.message === "dosth") { title = "📞 Dial-a-Dosth"; text = dosthText ?? JOKES.dosth; }
  if (!text) return null;
  return (
    <div key={title + text} className="animate-pop rounded-2xl border border-gold/50 bg-card/80 px-6 py-3 text-center">
      <div className="font-display text-2xl font-bold text-gold">{title}</div>
      <div className="text-muted-foreground">{text}</div>
    </div>
  );
}
