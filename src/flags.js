// Mapa de nombre de selección -> código para flagcdn.com
// (Inglaterra y Escocia usan los códigos de subdivisión del Reino Unido)
const CODES = {
  'México': 'mx',
  'Sudáfrica': 'za',
  'República de Corea': 'kr',
  'República Checa': 'cz',
  'Canadá': 'ca',
  'Bosnia y Herzegovina': 'ba',
  'Estados Unidos': 'us',
  'Paraguay': 'py',
  'Catar': 'qa',
  'Suiza': 'ch',
  'Brasil': 'br',
  'Marruecos': 'ma',
  'Haití': 'ht',
  'Escocia': 'gb-sct',
  'Australia': 'au',
  'Turquía': 'tr',
  'Alemania': 'de',
  'Curazao': 'cw',
  'Países Bajos': 'nl',
  'Japón': 'jp',
  'Costa de Marfil': 'ci',
  'Ecuador': 'ec',
  'Suecia': 'se',
  'Túnez': 'tn',
  'España': 'es',
  'Cabo Verde': 'cv',
  'Bélgica': 'be',
  'Egipto': 'eg',
  'Arabia Saudí': 'sa',
  'Uruguay': 'uy',
  'RI de Irán': 'ir',
  'Irán': 'ir',
  'Nueva Zelanda': 'nz',
  'Francia': 'fr',
  'Senegal': 'sn',
  'Irak': 'iq',
  'Noruega': 'no',
  'Argentina': 'ar',
  'Argelia': 'dz',
  'Austria': 'at',
  'Jordania': 'jo',
  'Portugal': 'pt',
  'RD Congo': 'cd',
  'Inglaterra': 'gb-eng',
  'Croacia': 'hr',
  'Ghana': 'gh',
  'Panamá': 'pa',
  'Uzbekistán': 'uz',
  'Colombia': 'co',
}

export function flagUrl(team) {
  const code = CODES[team]
  return code ? `https://flagcdn.com/w40/${code}.png` : null
}

export const TEAMS = Object.keys(CODES)
  .filter(t => t !== 'RI de Irán')
  .sort((a, b) => a.localeCompare(b, 'es'))