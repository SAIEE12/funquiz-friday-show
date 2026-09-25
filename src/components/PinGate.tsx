import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { hostAction } from "@/lib/game.functions";
import { usePin } from "@/lib/use-pin";
import { Logo } from "./show";

export function PinGate({ children }: { children: (pin: string, logout: () => void) => ReactNode }) {
  const { pin, setPin } = usePin();
  const [value, setValue] = useState("");
  const act = useServerFn(hostAction);

  if (pin) return <>{children(pin, () => setPin(null))}</>;

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <form
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8 text-center"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await act({ data: { pin: value, action: "verify" } });
            setPin(value);
          } catch {
            toast.error("Wrong PIN. Even the intern knows it's not 0000.");
          }
        }}
      >
        <Logo small />
        <p className="text-muted-foreground">Host / Admin PIN</p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border bg-background px-4 py-3 text-center text-2xl tracking-widest"
          autoFocus
        />
        <button className="w-full rounded-lg bg-gold py-3 font-bold text-gold-foreground">Enter</button>
        <p className="text-xs text-muted-foreground">Default PIN is 1234 — change it in Setup.</p>
      </form>
    </div>
  );
}
