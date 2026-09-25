import questionsData from "../../data/questions.json";
import type { GameState, Letter, PublicQuestion, Settings } from "./game-types";

type FullQuestion = PublicQuestion & { answer: Letter };
export const QUESTIONS = questionsData as unknown as FullQuestion[];

export function publicQuestion(i: number): PublicQuestion | null {
  const q = QUESTIONS[i];
  if (!q) return null;
  const { answer: _a, ...rest } = q;
  return rest;
}

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function loadGame() {
  const db = await admin();
  const { data, error } = await db.from("game").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return { settings: data.settings as unknown as Settings, state: data.state as unknown as GameState };
}

export async function saveState(state: GameState) {
  const db = await admin();
  const { error } = await db
    .from("game")
    .update({ state: state as never, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

export async function checkPin(pin: string) {
  const db = await admin();
  const { data } = await db.from("game_private").select("host_pin").eq("id", 1).single();
  if (!data || data.host_pin !== pin) throw new Error("Wrong host PIN");
}
