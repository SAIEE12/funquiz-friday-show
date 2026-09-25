import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LETTERS, PRIZES, SAFE_LEVELS, type GameState, type Letter } from "./game-types";

const letter = z.enum(["A", "B", "C", "D"]);

function timerFrom(sec: number) {
  return new Date(Date.now() + sec * 1000).toISOString();
}

function freshQuestion(state: GameState, index: number, timerSec: number, pq: GameState["question"], total: number): GameState {
  return {
    ...state,
    status: "question",
    index,
    total,
    question: pq,
    selected: null,
    removed: [],
    revealedAnswer: null,
    timerEndsAt: timerFrom(timerSec),
    timerRemaining: null,
    poll: state.poll ? { ...state.poll, open: false } : null,
    dosth: null,
    message: null,
  };
}

async function applyFifty(state: GameState) {
  const { QUESTIONS } = await import("./game.server");
  const q = QUESTIONS[state.index];
  if (!q || state.lifelines?.fifty || state.status !== "question") return state;
  const wrong = LETTERS.filter((l) => l !== q.answer).sort(() => Math.random() - 0.5).slice(0, 2);
  return { ...state, removed: wrong, lifelines: { ...state.lifelines, fifty: true }, message: "fifty" };
}

async function openPoll(state: GameState, durationSec: number): Promise<GameState> {
  if (state.lifelines?.poll || state.status !== "question") return state;
  const round = (state.poll?.round ?? 0) + 1;
  return {
    ...state,
    poll: { open: true, round, index: state.index, endsAt: timerFrom(durationSec) },
    lifelines: { ...state.lifelines, poll: true },
    message: "poll",
  };
}

export const hostAction = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        pin: z.string().max(50),
        action: z.enum([
          "verify", "answer", "start", "next", "reveal", "timerStart", "timerPause",
          "timerReset", "openPoll", "closePoll", "fifty", "quit", "reset",
        ]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { checkPin, loadGame, saveState, publicQuestion, QUESTIONS } = await import("./game.server");
    await checkPin(data.pin);
    const { settings, state } = await loadGame();
    const total = QUESTIONS.length;
    let next: GameState = state;

    switch (data.action) {
      case "verify":
        return { ok: true as const, answer: null };
      case "answer": {
        const q = QUESTIONS[state.index];
        return { ok: true as const, answer: state.status === "idle" ? null : (q?.answer ?? null) };
      }
      case "start":
        next = freshQuestion(
          { status: "idle", index: 0, lifelines: {}, poll: { open: false, round: state.poll?.round ?? 0 }, winnings: "₹0" },
          0, settings.questionTimerSec, publicQuestion(0), total,
        );
        break;
      case "next":
        if (state.status !== "revealed" || state.index + 1 >= total) break;
        next = freshQuestion(state, state.index + 1, settings.questionTimerSec, publicQuestion(state.index + 1), total);
        break;
      case "reveal": {
        const q = QUESTIONS[state.index];
        if (!q || !state.selected || state.status !== "locked") break;
        const correct = state.selected === q.answer;
        const safe = [...SAFE_LEVELS].reverse().find((s) => s < state.index);
        next = {
          ...state,
          revealedAnswer: q.answer,
          timerEndsAt: null,
          timerRemaining: null,
          poll: state.poll ? { ...state.poll, open: false } : null,
          status: correct ? (state.index + 1 >= total ? "won" : "revealed") : "lost",
          winnings: correct ? PRIZES[state.index] : safe !== undefined ? PRIZES[safe] : "₹0",
          message: null,
        };
        break;
      }
      case "timerStart": {
        const sec = state.timerRemaining ?? settings.questionTimerSec;
        next = { ...state, timerEndsAt: timerFrom(sec), timerRemaining: null };
        break;
      }
      case "timerPause": {
        if (!state.timerEndsAt) break;
        const rem = Math.max(0, Math.round((new Date(state.timerEndsAt).getTime() - Date.now()) / 1000));
        next = { ...state, timerEndsAt: null, timerRemaining: rem };
        break;
      }
      case "timerReset":
        next = { ...state, timerEndsAt: timerFrom(settings.questionTimerSec), timerRemaining: null };
        break;
      case "openPoll":
        next = await openPoll(state, settings.pollDurationSec);
        break;
      case "closePoll":
        next = { ...state, poll: state.poll ? { ...state.poll, open: false } : null };
        break;
      case "fifty":
        next = await applyFifty(state);
        break;
      case "quit":
        if (state.status !== "question") break;
        next = { ...state, status: "quit", timerEndsAt: null, winnings: state.index > 0 ? PRIZES[state.index - 1] : "₹0" };
        break;
      case "reset":
        next = { status: "idle", index: 0, lifelines: {}, poll: { open: false, round: state.poll?.round ?? 0 }, question: null };
        break;
    }
    await saveState(next);
    return { ok: true as const, answer: null };
  });

export const playerAction = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        action: z.enum(["lock", "fifty", "poll", "dosth"]),
        letter: letter.optional(),
        team: z.string().max(100).optional(),
        member: z.string().max(100).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { loadGame, saveState } = await import("./game.server");
    const { settings, state } = await loadGame();
    let next = state;
    if (data.action === "lock") {
      if (state.status !== "question" || !data.letter || state.removed?.includes(data.letter as Letter)) return { ok: false };
      next = { ...state, status: "locked", selected: data.letter, timerEndsAt: null, message: null };
    } else if (data.action === "fifty") {
      next = await applyFifty(state);
    } else if (data.action === "poll") {
      next = await openPoll(state, settings.pollDurationSec);
    } else if (data.action === "dosth") {
      if (state.lifelines?.dosth || state.status !== "question" || !data.team || !data.member) return { ok: false };
      next = { ...state, dosth: { team: data.team, member: data.member }, lifelines: { ...state.lifelines, dosth: true }, message: "dosth" };
    }
    await saveState(next);
    return { ok: true };
  });

export const submitVote = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().trim().min(1).max(40), choice: letter }).parse(d))
  .handler(async ({ data }) => {
    const { loadGame, admin } = await import("./game.server");
    const { state } = await loadGame();
    if (!state.poll?.open) return { ok: false, error: "The poll is closed right now." };
    if (state.poll.endsAt && new Date(state.poll.endsAt).getTime() < Date.now()) return { ok: false, error: "Voting time is over." };
    if (state.removed?.includes(data.choice)) return { ok: false, error: "That option was removed." };
    const db = await admin();
    const { error } = await db.from("poll_votes").insert({ round: state.poll.round, voter_name: data.name, choice: data.choice });
    if (error) return { ok: false, error: error.code === "23505" ? "You already voted! One vote per HR person 😄" : "Could not save vote." };
    return { ok: true, error: null };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        pin: z.string().max(50),
        newPin: z.string().min(3).max(50).optional(),
        settings: z.object({
          playerName: z.string().trim().min(1).max(60),
          team1: z.object({ name: z.string().trim().min(1).max(60), members: z.array(z.string().trim().min(1).max(60)).max(30) }),
          team2: z.object({ name: z.string().trim().min(1).max(60), members: z.array(z.string().trim().min(1).max(60)).max(30) }),
          pollDurationSec: z.number().int().min(10).max(300),
          questionTimerSec: z.number().int().min(10).max(600),
        }),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { checkPin, admin } = await import("./game.server");
    await checkPin(data.pin);
    const db = await admin();
    const { error } = await db.from("game").update({ settings: data.settings as never }).eq("id", 1);
    if (error) throw new Error(error.message);
    if (data.newPin) await db.from("game_private").update({ host_pin: data.newPin }).eq("id", 1);
    return { ok: true };
  });
