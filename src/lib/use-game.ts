import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, type GameState, type Letter, type Settings } from "./game-types";

export function useGame() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<GameState>({ status: "idle", index: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.from("game").select("settings,state").eq("id", 1).single().then(({ data }) => {
      if (!alive || !data) return;
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings as object) });
      setState(data.state as unknown as GameState);
      setLoaded(true);
    });
    const ch = supabase
      .channel("game-row")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game" }, (p) => {
        const row = p.new as { settings: Settings; state: GameState };
        setSettings({ ...DEFAULT_SETTINGS, ...row.settings });
        setState(row.state);
      })
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return { settings, state, loaded };
}

export function useVotes(round: number | undefined) {
  const [votes, setVotes] = useState<{ voter_name: string; choice: Letter }[]>([]);
  useEffect(() => {
    if (!round) return setVotes([]);
    let alive = true;
    supabase.from("poll_votes").select("voter_name,choice").eq("round", round).then(({ data }) => {
      if (alive && data) setVotes(data as never);
    });
    const ch = supabase
      .channel(`votes-${round}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "poll_votes", filter: `round=eq.${round}` }, (p) => {
        const v = p.new as { voter_name: string; choice: Letter };
        setVotes((prev) => [...prev, v]);
      })
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [round]);
  return votes;
}

export function useCountdown(endsAt: string | null | undefined, paused: number | null | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [endsAt]);
  if (endsAt) return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
  return paused ?? null;
}
