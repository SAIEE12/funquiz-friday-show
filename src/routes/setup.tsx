import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PinGate } from "@/components/PinGate";
import { Logo } from "@/components/show";
import { saveSettings } from "@/lib/game.functions";
import { useGame } from "@/lib/use-game";
import type { Settings } from "@/lib/game-types";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Admin Setup – Meelo Evaru Winner" },
      { name: "description", content: "Configure the hot-seat player, Dial-a-Dosth teams and poll timers." },
      { property: "og:title", content: "Admin Setup – Meelo Evaru Winner" },
      { property: "og:description", content: "Configure the Fun Friday quiz show." },
    ],
  }),
  component: () => <PinGate>{(pin, logout) => <SetupForm pin={pin} logout={logout} />}</PinGate>,
});

const toText = (a: string[]) => a.join("\n");
const toList = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function SetupForm({ pin, logout }: { pin: string; logout: () => void }) {
  const { settings, loaded } = useGame();
  const save = useServerFn(saveSettings);
  const [f, setF] = useState<Settings | null>(null);
  const [m1, setM1] = useState("");
  const [m2, setM2] = useState("");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    if (loaded && !f) {
      setF(settings);
      setM1(toText(settings.team1.members));
      setM2(toText(settings.team2.members));
    }
  }, [loaded, settings, f]);

  if (!f) return <p className="p-10 text-center">Loading…</p>;

  const input = "w-full rounded-lg border bg-background px-3 py-2";
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link to="/"><Logo small /></Link>
        <button onClick={logout} className="text-sm text-muted-foreground underline">Lock</button>
      </div>
      <h1 className="font-display text-3xl font-bold">Admin Setup</h1>
      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await save({
              data: {
                pin,
                ...(newPin ? { newPin } : {}),
                settings: { ...f, team1: { ...f.team1, members: toList(m1) }, team2: { ...f.team2, members: toList(m2) } },
              },
            });
            if (newPin) sessionStorage.setItem("mew-host-pin", newPin);
            toast.success("Saved! Changes are live on every screen.");
            if (newPin) location.reload();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save");
          }
        }}
      >
        <section className="space-y-2 rounded-2xl border bg-card p-5">
          <label className="font-semibold">Hot-seat player name</label>
          <input className={input} value={f.playerName} onChange={(e) => setF({ ...f, playerName: e.target.value })} required />
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {([["team1", m1, setM1], ["team2", m2, setM2]] as const).map(([key, members, setMembers], i) => (
            <section key={key} className="space-y-2 rounded-2xl border bg-card p-5">
              <label className="font-semibold">📞 Team {i + 1} name</label>
              <input className={input} value={f[key].name} onChange={(e) => setF({ ...f, [key]: { ...f[key], name: e.target.value } })} required />
              <label className="block pt-2 text-sm font-semibold">Members (one per line)</label>
              <textarea className={input + " h-40"} value={members} onChange={(e) => setMembers(e.target.value)} placeholder={"Priya\nRahul\nAnjali"} />
            </section>
          ))}
        </div>

        <section className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="font-semibold">Question timer (seconds)</label>
            <input type="number" min={10} max={600} className={input} value={f.questionTimerSec} onChange={(e) => setF({ ...f, questionTimerSec: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <label className="font-semibold">👥 Audience poll duration (seconds)</label>
            <input type="number" min={10} max={300} className={input} value={f.pollDurationSec} onChange={(e) => setF({ ...f, pollDurationSec: Number(e.target.value) })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="font-semibold">Change host PIN (optional)</label>
            <input className={input} value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Leave empty to keep current PIN" minLength={3} />
          </div>
        </section>

        <button className="w-full rounded-xl bg-gold py-4 font-display text-xl font-bold text-gold-foreground">Save settings</button>
      </form>
      <p className="text-sm text-muted-foreground">
        Questions live in <code>data/questions.json</code>; images and audio go in <code>public/questions/</code>.
      </p>
    </main>
  );
}
