CREATE TABLE public.game (
  id int PRIMARY KEY DEFAULT 1,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game TO anon, authenticated;
GRANT ALL ON public.game TO service_role;
ALTER TABLE public.game ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read game" ON public.game FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.game_private (
  id int PRIMARY KEY DEFAULT 1,
  host_pin text NOT NULL DEFAULT '1234'
);
GRANT ALL ON public.game_private TO service_role;
ALTER TABLE public.game_private ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round int NOT NULL,
  voter_name text NOT NULL,
  choice text NOT NULL CHECK (choice IN ('A','B','C','D')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round, voter_name)
);
GRANT SELECT ON public.poll_votes TO anon, authenticated;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read votes" ON public.poll_votes FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.game (id, settings, state) VALUES (1,
 '{"playerName":"Hot Seat Hero","team1":{"name":"Team Chai","members":["Member 1","Member 2"]},"team2":{"name":"Team Coffee","members":["Member 3","Member 4"]},"pollDurationSec":30,"questionTimerSec":45}'::jsonb,
 '{"status":"idle","index":0}'::jsonb);
INSERT INTO public.game_private (id) VALUES (1);

ALTER PUBLICATION supabase_realtime ADD TABLE public.game;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;