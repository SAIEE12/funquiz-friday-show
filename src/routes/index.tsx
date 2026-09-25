import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/show";
import { useGame } from "@/lib/use-game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meelo Evaru Winner – Fun Friday Edition" },
      { name: "description", content: "The office quiz show: 15 questions, 3 lifelines, one hot seat, zero appraisals affected." },
      { property: "og:title", content: "Meelo Evaru Winner – Fun Friday Edition" },
      { property: "og:description", content: "The office quiz show for Fun Friday. Take the hot seat!" },
    ],
  }),
  component: Home,
});

const tiles = [
  { to: "/play", title: "Hot Seat", desc: "Big screen for the player", emoji: "🪑" },
  { to: "/host", title: "Host Panel", desc: "Run the show", emoji: "🎤" },
  { to: "/setup", title: "Admin Setup", desc: "Player, teams, timers", emoji: "⚙️" },
  { to: "/poll", title: "Audience Poll", desc: "Vote from your phone", emoji: "📱" },
] as const;

function Home() {
  const { settings } = useGame();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-12 overflow-hidden p-6">
      <div className="stage-lights pointer-events-none absolute inset-0" />
      <div className="animate-pop">
        <Logo />
      </div>
      <p className="max-w-xl text-center text-lg text-muted-foreground">
        Tonight in the hot seat: <span className="font-bold text-gold">{settings.playerName}</span>. 15 questions.
        ₹100 on the line. Your appraisal is <em>not</em> affected. Probably.
      </p>
      <div className="grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rounded-2xl border bg-card/70 p-5 text-center transition hover:-translate-y-1 hover:border-gold hover:shadow-[0_0_30px_var(--gold-glow)]"
          >
            <div className="text-4xl">{t.emoji}</div>
            <div className="mt-2 font-display text-xl font-bold">{t.title}</div>
            <div className="text-sm text-muted-foreground">{t.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
