-- ============================================================
-- FIXTURE DE PRUEBA — pégalo en Supabase > SQL Editor > Run
-- Sirve para ver la app funcionando. Bórralo antes de cargar el
-- fixture real con:   delete from matches;
-- ============================================================

-- Partidos abiertos (futuros): podrás registrar pronósticos
insert into matches (phase, grp, home_team, away_team, kickoff_at) values
  ('grupos', 'A', 'México',    'Corea del Sur', now() + interval '2 days'),
  ('grupos', 'A', 'Canadá',    'Marruecos',     now() + interval '2 days 3 hours'),
  ('grupos', 'B', 'Argentina', 'Nigeria',       now() + interval '3 days'),
  ('grupos', 'B', 'Croacia',   'Japón',         now() + interval '3 days 3 hours');

-- Partido CERRADO (empieza en 10 min): la app lo mostrará bloqueado
insert into matches (phase, grp, home_team, away_team, kickoff_at) values
  ('grupos', 'C', 'Brasil', 'Camerún', now() + interval '10 minutes');

-- Partidos YA JUGADOS (con resultado): para probar el puntaje y la tabla
insert into matches (phase, grp, home_team, away_team, kickoff_at, home_goals, away_goals) values
  ('grupos', 'D', 'España',  'Uruguay', now() - interval '1 day', 2, 1),
  ('grupos', 'D', 'Francia', 'Senegal', now() - interval '1 day 3 hours', 0, 0);

-- Tip: para probar la tabla, registra pronósticos tuyos con la app
-- ANTES de jugar (o inserta a mano) y compara:
--   2-1 a España/Uruguay  -> 5 pts (marcador exacto)
--   2-0                   -> 4 pts (acierta ganador + goles local)
--   3-1                   -> 4 pts (acierta ganador + goles visitante)
--   1-0                   -> 3 pts (solo el ganador)
--   2-3                   -> 1 pt  (falla ganador pero acierta goles local = 2)
