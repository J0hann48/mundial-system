import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { flagUrl, TEAMS } from './flags'

function ventanaAbierta(cfg) {
  if (!cfg) return false
  const now = Date.now()
  const w1 = cfg.special_open1_until && now < new Date(cfg.special_open1_until).getTime()
  const w2 = cfg.special_open2_from && cfg.special_open2_until &&
    now >= new Date(cfg.special_open2_from).getTime() &&
    now < new Date(cfg.special_open2_until).getTime()
  return Boolean(w1 || w2)
}

export default function SpecialPicks({ uid }) {
  const [cfg, setCfg] = useState(null)
  const [pick, setPick] = useState({ champion_team: '', top_scorer: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [{ data: c }, { data: sp }] = await Promise.all([
      supabase.from('app_config').select('*').eq('id', 1).single(),
      supabase.from('special_picks').select('*').eq('user_id', uid).maybeSingle(),
    ])
    setCfg(c)
    if (sp) setPick({ champion_team: sp.champion_team || '', top_scorer: sp.top_scorer || '' })
    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  async function save() {
    setStatus('saving')
    const { error } = await supabase.from('special_picks').upsert(
      {
        user_id: uid,
        champion_team: pick.champion_team || null,
        top_scorer: pick.top_scorer || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    setStatus(error ? 'error' : 'saved')
    if (!error) setTimeout(() => setStatus(null), 1500)
  }

  if (loading) return <div className="card center"><p className="muted">Cargando…</p></div>

  const editable = ventanaAbierta(cfg)
  const champHit = cfg?.official_champion && pick.champion_team &&
    pick.champion_team.trim().toLowerCase() === cfg.official_champion.trim().toLowerCase()
  const scorerHit = cfg?.official_top_scorer && pick.top_scorer &&
    pick.top_scorer.trim().toLowerCase() === cfg.official_top_scorer.trim().toLowerCase()

  return (
    <div className="card">
      <h2>Campeón y goleador</h2>
      <p className="muted">
        {editable
          ? 'Elige tu campeón del Mundial y el goleador del torneo. Podrás cambiarlos hasta que cierre la ventana de edición.'
          : 'La edición está cerrada. Estas son tus selecciones registradas.'}
      </p>

      <label className="lbl">Campeón del Mundial</label>
      <div className="champ-row">
        {pick.champion_team && flagUrl(pick.champion_team) &&
          <img className="flag" src={flagUrl(pick.champion_team)} alt=""
            onError={(e) => { e.currentTarget.style.display = 'none' }} />}
        <select className="input" disabled={!editable}
          value={pick.champion_team}
          onChange={e => setPick(p => ({ ...p, champion_team: e.target.value }))}>
          <option value="">— Elige una selección —</option>
          {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {cfg?.official_champion &&
          <span className={champHit ? 'tag pts' : 'tag'}>{champHit ? `+${cfg.champion_points}` : '✗'}</span>}
      </div>

      <label className="lbl">Goleador del torneo</label>
      <div className="champ-row">
        <input className="input" disabled={!editable}
          placeholder="Nombre del jugador"
          value={pick.top_scorer}
          onChange={e => setPick(p => ({ ...p, top_scorer: e.target.value }))} />
        {cfg?.official_top_scorer &&
          <span className={scorerHit ? 'tag pts' : 'tag'}>{scorerHit ? `+${cfg.top_scorer_points}` : '✗'}</span>}
      </div>

      {editable && (
        <button className="btn" style={{ marginTop: 18 }} onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? 'Guardando…' : status === 'saved' ? '✓ Guardado' : status === 'error' ? 'Error, reintentar' : 'Guardar selecciones'}
        </button>
      )}
    </div>
  )
}
