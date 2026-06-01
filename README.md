# Polla Mundialista — Frontend

App en Vite + React conectada a tu Supabase. Login por enlace mágico,
pronósticos por fase y tabla de posiciones por familia.

## 1. Instalar y correr

```bash
npm install
cp .env.example .env     # y pega tus llaves (ver abajo)
npm run dev
```

Abre http://localhost:5173

## 2. Conectar con Supabase

En **Supabase > Project Settings > API** copia:
- `Project URL`  -> `VITE_SUPABASE_URL`
- `anon public`  -> `VITE_SUPABASE_ANON_KEY`

Pégalas en tu archivo `.env`.

### Configurar el login por email
En **Supabase > Authentication > URL Configuration** agrega tu URL a
*Redirect URLs*:
- `http://localhost:5173` (desarrollo)
- la URL de producción cuando despliegues (ej. `https://tu-app.vercel.app`)

> Por defecto Supabase envía los correos con su servidor de pruebas
> (limitado). Para una polla de 20–100 personas conviene configurar un
> SMTP propio en *Authentication > Emails*, o usar el login por OTP/teléfono.

## 3. Probar de punta a punta

1. Corre `sample_fixture.sql` en el SQL Editor (partidos de prueba).
2. Entra a la app con tu correo -> pon tu nombre.
3. Como aún no tienes familia, verás el aviso de "sin familia asignada".
   Asígnate desde el SQL Editor:
   ```sql
   update profiles set pool_id = 1, paid = true
   where id = '<tu-uuid>';  -- el uuid sale en Authentication > Users
   ```
4. Recarga: ya puedes registrar pronósticos y ver la tabla.

## 4. Desplegar (Vercel)

```bash
npm run build
```
Sube el repo a Vercel (framework: Vite). Agrega las dos variables de
entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel de
Vercel, y añade la URL final a los *Redirect URLs* de Supabase.

## Operación durante el torneo

- **Cargar fixture real:** importa un CSV a la tabla `matches`
  (columnas: phase, grp, home_team, away_team, kickoff_at). Borra antes
  los de prueba con `delete from matches;`.
- **Ingresar resultados (90'):** edita la fila del partido y completa
  `home_goals` / `away_goals`. Puntaje y tabla se recalculan solos.
- **Eliminatorias:** agrega esos partidos a medida que se definen los cruces.
