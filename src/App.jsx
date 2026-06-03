import { useState, useEffect, useCallback, useMemo } from 'react'
import SpecialPicks from './SpecialPicks'
import { supabase } from './supabaseClient'
import { flagUrl } from './flags'

const CUTOFF_MIN = 30

// Orden y etiqueta de las fases
const PHASES = [
  ['grupos', 'Fase de grupos'],
  ['dieciseisavos', 'Dieciseisavos'],
  ['octavos', 'Octavos de final'],
  ['cuartos', 'Cuartos de final'],
  ['semifinal', 'Semifinal'],
  ['tercer_puesto', 'Tercer puesto'],
  ['final', 'Gran final'],
]
const PHASE_LABEL = Object.fromEntries(PHASES)
const PHASE_ORDER = Object.fromEntries(PHASES.map(([k], i) => [k, i]))

function fmtDate(iso) {
  return new Date(iso).toLocaleString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}
function isClosed(iso) {
  return Date.now() >= new Date(iso).getTime() - CUTOFF_MIN * 60_000
}

function Flag({ team }) {
  const url = flagUrl(team)
  if (!url) return null
  return (
    <img className="flag" src={url} alt="" loading="lazy"
      onError={(e) => { e.currentTarget.style.display = 'none' }} />
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) return <Splash text="Cargando…" />
  if (!session) return <Login />
  return <Home session={session} />
}

/* ---------------- Login ---------------- */
function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function send() {
    setErr(''); setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setErr(error.message)
    else setSent(true)
  }

  return (
    <Shell>
      <div className="card center">
        <h1 className="wordmark">POLLA<span>MUNDIALISTA</span></h1>
        {sent ? (
          <p className="muted">Te enviamos un enlace a <b>{email}</b>. Ábrelo en este mismo dispositivo para entrar.</p>
        ) : (
          <>
            <p className="muted">Ingresa con tu correo. Te llega un enlace de acceso.</p>
            <input
              className="input" type="email" placeholder="tu@correo.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn" disabled={busy || !email} onClick={send}>
              {busy ? 'Enviando…' : 'Enviar enlace'}
            </button>
            {err && <p className="error">{err}</p>}
          </>
        )}
      </div>
    </Shell>
  )
}

/* ---------------- Home ---------------- */
function Home({ session }) {
  const uid = session.user.id
  const [profile, setProfile] = useState(null)
  const [poolName, setPoolName] = useState('')
  const [tab, setTab] = useState('pronosticos')

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles')
      .select('id,name,pool_id,paid,is_admin').eq('id', uid).single()
    setProfile(data || null)
    if (data?.pool_id) {
      const { data: p } = await supabase.from('pools')
        .select('name').eq('id', data.pool_id).single()
      setPoolName(p?.name || '')
    }
  }, [uid])

  useEffect(() => { loadProfile() }, [loadProfile])

  if (!profile) return <Splash text="Cargando tu perfil…" />
  if (!profile.name) return <NamePrompt onSaved={loadProfile} />

  return (
    <Shell>
      <header className="topbar">
        <div>
          <h1 className="wordmark sm">POLLA<span>MUNDIALISTA</span></h1>
          <p className="pool">{poolName || 'Sin familia asignada'} · {profile.name}</p>
        </div>
        <button className="link" onClick={() => supabase.auth.signOut()}>Salir</button>
      </header>

      {!profile.pool_id && !profile.is_admin ? (
        <div className="card center">
          <p className="muted">Tu cuenta está creada pero el administrador aún no te asignó a una familia. Cuando lo haga, podrás registrar tus pronósticos.</p>
        </div>
      ) : (
        <>
          <nav className="tabs">
            {profile.pool_id && (
              <button className={tab === 'pronosticos' ? 'tab on' : 'tab'} onClick={() => setTab('pronosticos')}>Pronósticos</button>
            )}
            {profile.pool_id && (
              <button className={tab === 'tabla' ? 'tab on' : 'tab'} onClick={() => setTab('tabla')}>Tabla</button>
            )}
            {profile.is_admin && (
              <button className={tab === 'admin' ? 'tab on' : 'tab'} onClick={() => setTab('admin')}>Resultados</button>
            )}
            {profile.pool_id && (
              <button className={tab === 'selecciones' ? 'tab on' : 'tab'} onClick={() => setTab('selecciones')}>Campeón</button>
            )}
          </nav>

          {tab === 'pronosticos' && profile.pool_id && <Predictions uid={uid} />}
          {tab === 'tabla' && profile.pool_id && <Leaderboard poolId={profile.pool_id} uid={uid} />}
          {tab === 'selecciones' && profile.pool_id && <SpecialPicks uid={uid} />}
          {tab === 'admin' && profile.is_admin && <AdminResults />}
        </>
      )}
    </Shell>
  )
}

function NamePrompt({ onSaved }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    await supabase.rpc('set_my_name', { p_name: name.trim() })
    setBusy(false)
    onSaved()
  }
  return (
    <Shell>
      <div className="card center">
        <h2>¿Cómo te mostramos en la tabla?</h2>
        <input className="input" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" disabled={busy || !name.trim()} onClick={save}>Guardar</button>
      </div>
    </Shell>
  )
}

/* ---------------- Pronósticos ---------------- */
function Predictions({ uid }) {
  const [matches, setMatches] = useState([])
  const [preds, setPreds] = useState({})
  const [points, setPoints] = useState({})
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState(new Set())

  const load = useCallback(async () => {
    const [{ data: m }, { data: p }, { data: pp }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_at'),
      supabase.from('predictions').select('match_id,pred_home,pred_away').eq('user_id', uid),
      supabase.from('prediction_points').select('match_id,points').eq('user_id', uid),
    ])
    setMatches(m || [])
    setPreds(Object.fromEntries((p || []).map(r => [r.match_id, r])))
    setSavedIds(new Set((p || []).map(r => r.match_id)))
    setPoints(Object.fromEntries((pp || []).map(r => [r.match_id, r.points])))
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  function setVal(matchId, side, value) {
    const v = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)
    setPreds(prev => ({ ...prev, [matchId]: { ...prev[matchId], [side]: v } }))
  }

  async function save(matchId) {
    const cur = preds[matchId]
    if (cur?.pred_home === '' || cur?.pred_away === '' || cur == null) return
    setStatus(s => ({ ...s, [matchId]: 'saving' }))
    const { error } = await supabase.from('predictions').upsert(
      { user_id: uid, match_id: matchId, pred_home: cur.pred_home, pred_away: cur.pred_away },
      { onConflict: 'user_id,match_id' }
    )
    setStatus(s => ({ ...s, [matchId]: error ? 'error' : 'saved' }))
    if (!error) {
      setSavedIds(prev => new Set(prev).add(matchId))
      setTimeout(() => setStatus(s => ({ ...s, [matchId]: undefined })), 1500)
    }
  }

  const grouped = useMemo(() => {
    const g = {}
    for (const m of matches) (g[m.phase] ||= []).push(m)
    return Object.entries(g).sort((a, b) => (PHASE_ORDER[a[0]] ?? 99) - (PHASE_ORDER[b[0]] ?? 99))
  }, [matches])

  if (loading) return <Splash text="Cargando partidos…" />
  if (!matches.length) return <div className="card center"><p className="muted">Aún no hay partidos cargados.</p></div>
  const total = matches.length
  const llenos = matches.filter(m => savedIds.has(m.id)).length
  return (
    <div className="stack">
      <div className="progress">
        <div className="progress-text">Has llenado <b>{llenos}</b> de <b>{total}</b> partidos</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${total ? (llenos / total) * 100 : 0}%` }} />
      </div>
    </div>
      {grouped.map(([phase, list]) => (
        <section key={phase}>
          <h3 className="phase">{PHASE_LABEL[phase] || phase}</h3>
          {list.map(m => {
            const closed = isClosed(m.kickoff_at)
            const played = m.home_goals != null && m.away_goals != null
            const pr = preds[m.id] || {}
            const st = status[m.id]
            return (
              <div className="match" key={m.id}>
                <div className="match-meta">
                  <span>{m.grp ? `Grupo ${m.grp} · ` : ''}{fmtDate(m.kickoff_at)}</span>
                  {closed && !played && <span className="tag">Cerrado</span>}
                  {played && <span className="tag pts">{points[m.id] ?? 0} pts · {m.home_goals}-{m.away_goals}</span>}
                </div>
                <div className="match-row">
                  <span className="team"><Flag team={m.home_team} /><span>{m.home_team}</span></span>
                  <input className="score" inputMode="numeric" disabled={closed}
                    value={pr.pred_home ?? ''} onChange={e => setVal(m.id, 'pred_home', e.target.value)} />
                  <span className="vs">–</span>
                  <input className="score" inputMode="numeric" disabled={closed}
                    value={pr.pred_away ?? ''} onChange={e => setVal(m.id, 'pred_away', e.target.value)} />
                  <span className="team right"><span>{m.away_team}</span><Flag team={m.away_team} /></span>
                </div>
                {!closed && (
                  <button className="btn slim" onClick={() => save(m.id)} disabled={st === 'saving'}>
                    {st === 'saving' ? 'Guardando…' : st === 'saved' ? '✓ Guardado' : st === 'error' ? 'Error, reintentar' : 'Guardar'}
                  </button>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}

/* ---------------- Tabla ---------------- */
function Leaderboard({ poolId, uid }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('get_leaderboard', { p_pool_id: poolId }).then(({ data }) => {
      setRows(data || [])
      setLoading(false)
    })
  }, [poolId])

  if (loading) return <Splash text="Calculando posiciones…" />
  if (!rows.length) return <div className="card center"><p className="muted">Todavía no hay puntos. Aparecerán cuando se carguen resultados.</p></div>

  return (
    <table className="board">
      <thead>
        <tr><th>#</th><th>Participante</th><th>Pts</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.user_id} className={r.user_id === uid ? 'me' : ''}>
            <td className="pos">{r.posicion}</td>
            <td>{r.nombre || '—'}</td>
            <td className="ptscell">{r.puntos}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ---------------- Admin: ingresar resultados ---------------- */
function AdminResults() {
  const [matches, setMatches] = useState([])
  const [vals, setVals] = useState({})
  const [status, setStatus] = useState({})
  const [onlyPending, setOnlyPending] = useState(true)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('matches').select('*').order('kickoff_at')
    setMatches(data || [])
    setVals(Object.fromEntries((data || []).map(m => [m.id, { h: m.home_goals ?? '', a: m.away_goals ?? '' }])))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function setVal(id, side, value) {
    const v = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)
    setVals(prev => ({ ...prev, [id]: { ...prev[id], [side]: v } }))
  }

  async function save(id, clear = false) {
    const v = vals[id] || {}
    const home = clear ? null : v.h
    const away = clear ? null : v.a
    if (!clear && (home === '' || away === '')) return
    setStatus(s => ({ ...s, [id]: 'saving' }))
    const { error } = await supabase.rpc('set_result', { p_match_id: id, p_home: home, p_away: away })
    setStatus(s => ({ ...s, [id]: error ? 'error' : 'saved' }))
    if (!error) {
      setMatches(ms => ms.map(m => m.id === id ? { ...m, home_goals: home, away_goals: away } : m))
      if (clear) setVals(prev => ({ ...prev, [id]: { h: '', a: '' } }))
      setTimeout(() => setStatus(s => ({ ...s, [id]: undefined })), 1500)
    }
  }

  const list = useMemo(() => {
    return matches.filter(m => {
      if (!onlyPending) return true
      const started = Date.now() >= new Date(m.kickoff_at).getTime()
      const noResult = m.home_goals == null
      return started && noResult
    })
  }, [matches, onlyPending])

  if (loading) return <Splash text="Cargando partidos…" />

  return (
    <div className="stack">
      <label className="toggle">
        <input type="checkbox" checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} />
        Solo partidos jugados sin resultado
      </label>

      {!list.length && <div className="card center"><p className="muted">Nada pendiente por ahora.</p></div>}

      {list.map(m => {
        const v = vals[m.id] || {}
        const st = status[m.id]
        const hasResult = m.home_goals != null
        return (
          <div className="match" key={m.id}>
            <div className="match-meta">
              <span>{m.grp ? `Grupo ${m.grp} · ` : ''}{PHASE_LABEL[m.phase] || m.phase} · {fmtDate(m.kickoff_at)}</span>
              {hasResult && <span className="tag pts">Cargado</span>}
            </div>
            <div className="match-row">
              <span className="team"><Flag team={m.home_team} /><span>{m.home_team}</span></span>
              <input className="score" inputMode="numeric"
                value={v.h ?? ''} onChange={e => setVal(m.id, 'h', e.target.value)} />
              <span className="vs">–</span>
              <input className="score" inputMode="numeric"
                value={v.a ?? ''} onChange={e => setVal(m.id, 'a', e.target.value)} />
              <span className="team right"><span>{m.away_team}</span><Flag team={m.away_team} /></span>
            </div>
            <div className="admin-actions">
              <button className="btn slim" onClick={() => save(m.id)} disabled={st === 'saving'}>
                {st === 'saving' ? 'Guardando…' : st === 'saved' ? '✓ Guardado' : st === 'error' ? 'Error' : 'Guardar resultado'}
              </button>
              {hasResult && (
                <button className="link" onClick={() => save(m.id, true)}>Borrar</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- UI base ---------------- */
function Shell({ children }) {
  return <div className="wrap">{children}</div>
}
function Splash({ text }) {
  return <Shell><div className="card center"><p className="muted">{text}</p></div></Shell>
}
