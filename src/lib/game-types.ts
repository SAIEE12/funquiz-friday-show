export type Letter = "A" | "B" | "C" | "D";
export const LETTERS: Letter[] = ["A", "B", "C", "D"];

export const PRIZES = ["₹1", "₹1.5", "₹2", "₹5", "₹7", "₹10", "₹15", "₹20", "₹25", "₹30", "₹45", "₹50", "₹75", "₹90", "₹100"];
/** Safe milestones (0-based question index): winnings drop to these on a wrong answer */
export const SAFE_LEVELS = [4, 9];

export type Team = { name: string; members: string[] };
export type Settings = {
  playerName: string;
  team1: Team;
  team2: Team;
  pollDurationSec: number;
  questionTimerSec: number;
};

/** Question as seen by player/audience — NO answer field */
export type PublicQuestion = {
  id: number;
  type: "text" | "image" | "audio";
  prize: string;
  question: string;
  media: string | null;
  options: Record<Letter, string>;
};

export type GameStatus = "idle" | "question" | "locked" | "revealed" | "won" | "lost" | "quit";

export type GameState = {
  status: GameStatus;
  index: number;
  total?: number | undefined;
  question?: PublicQuestion | null | undefined;
  selected?: Letter | null | undefined;
  removed?: Letter[] | undefined;
  revealedAnswer?: Letter | null | undefined;
  timerEndsAt?: string | null | undefined;
  timerRemaining?: number | null | undefined; // seconds, when paused
  lifelines?: { fifty?: boolean | undefined; poll?: boolean | undefined; dosth?: boolean };
  poll?: { open: boolean; round: number; index?: number; endsAt?: string | null } | null;
  dosth?: { team: string; member: string } | null;
  winnings?: string | undefined;
  message?: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  playerName: "Hot Seat Hero",
  team1: { name: "Team 1", members: [] },
  team2: { name: "Team 2", members: [] },
  pollDurationSec: 30,
  questionTimerSec: 45,
};

export const JOKES = {
  fifty: "Two options have been removed due to performance issues.",
  dosth: "Choose someone who actually knows the answer.",
  poll: "HR has spoken… probably.",
  wrong: "That went better than a Friday evening production deployment. 😂",
  correct: [
    "Correct! Appraisal cycle looking bright! ✨",
    "Sahi Jawab! Your manager just approved your leave. 🎉",
    "Correct! Even the Wi-Fi is impressed.",
    "Bilkul sahi! That's a promotion-worthy answer.",
  ],
  lock: "Answer locked. No rollbacks in production!",
  timeUp: "Time's up! Just like the sprint deadline. ⏰",
  quit: "Smart move. Know when to log off.",
  won: "Crorepati of the cubicle! Treat for the whole floor. 🏆",
};
