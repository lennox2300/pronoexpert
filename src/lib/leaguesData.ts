const GH_BASE = 'https://cdn.jsdelivr.net/gh/luukhopman/football-logos@master/logos';
const ESPN_BASE = 'https://a.espncdn.com/i/teamlogos';

export interface League {
  id: string;
  name: string;
  flag: string;
  country: string;
}

export interface NBATeam {
  name: string;
  shortName: string;
  nbaCode: string;
}

export interface FootballTeam {
  /** Exact filename in the GitHub repo (without .png) */
  file: string;
  /** Short display name on the ticket */
  shortName: string;
}

export interface FootballLeague {
  folder: string;
  teams: FootballTeam[];
}

export const LEAGUES: League[] = [
  { id: 'ligue1', name: 'Ligue 1', flag: '🇫🇷', country: 'France' },
  { id: 'ligue2', name: 'Ligue 2', flag: '🇫🇷', country: 'France' },
  { id: 'pl', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', country: 'Angleterre' },
  { id: 'laliga', name: 'La Liga', flag: '🇪🇸', country: 'Espagne' },
  { id: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪', country: 'Allemagne' },
  { id: 'seriea', name: 'Serie A', flag: '🇮🇹', country: 'Italie' },
  { id: 'ucl', name: 'Champions League', flag: '🇪🇺', country: 'Europe' },
  { id: 'uel', name: 'Europa League', flag: '🇪🇺', country: 'Europe' },
  { id: 'nba', name: 'NBA', flag: '🇺🇸', country: 'USA' },
  { id: 'euroleague', name: 'EuroLeague', flag: '🇪🇺', country: 'Europe' },
  { id: 'atp', name: 'ATP Tennis', flag: '🎾', country: 'Monde' },
  { id: 'other', name: 'Autre', flag: '', country: 'Autre' },
];

// ─── NBA ─────────────────────────────────────────────────────────────────────

export const NBA_TEAMS: NBATeam[] = [
  { name: 'Hawks', shortName: 'ATL', nbaCode: 'atl' },
  { name: 'Nets', shortName: 'BKN', nbaCode: 'bkn' },
  { name: 'Celtics', shortName: 'BOS', nbaCode: 'bos' },
  { name: 'Hornets', shortName: 'CHA', nbaCode: 'cha' },
  { name: 'Bulls', shortName: 'CHI', nbaCode: 'chi' },
  { name: 'Cavaliers', shortName: 'CLE', nbaCode: 'cle' },
  { name: 'Mavericks', shortName: 'DAL', nbaCode: 'dal' },
  { name: 'Nuggets', shortName: 'DEN', nbaCode: 'den' },
  { name: 'Pistons', shortName: 'DET', nbaCode: 'det' },
  { name: 'Warriors', shortName: 'GSW', nbaCode: 'gsw' },
  { name: 'Rockets', shortName: 'HOU', nbaCode: 'hou' },
  { name: 'Pacers', shortName: 'IND', nbaCode: 'ind' },
  { name: 'Clippers', shortName: 'LAC', nbaCode: 'lac' },
  { name: 'Lakers', shortName: 'LAL', nbaCode: 'lal' },
  { name: 'Grizzlies', shortName: 'MEM', nbaCode: 'mem' },
  { name: 'Heat', shortName: 'MIA', nbaCode: 'mia' },
  { name: 'Bucks', shortName: 'MIL', nbaCode: 'mil' },
  { name: 'Timberwolves', shortName: 'MIN', nbaCode: 'min' },
  { name: 'Pelicans', shortName: 'NOP', nbaCode: 'nop' },
  { name: 'Knicks', shortName: 'NYK', nbaCode: 'nyk' },
  { name: 'Thunder', shortName: 'OKC', nbaCode: 'okc' },
  { name: 'Magic', shortName: 'ORL', nbaCode: 'orl' },
  { name: '76ers', shortName: 'PHI', nbaCode: 'phi' },
  { name: 'Suns', shortName: 'PHX', nbaCode: 'phx' },
  { name: 'Trail Blazers', shortName: 'POR', nbaCode: 'por' },
  { name: 'Kings', shortName: 'SAC', nbaCode: 'sac' },
  { name: 'Spurs', shortName: 'SAS', nbaCode: 'sas' },
  { name: 'Raptors', shortName: 'TOR', nbaCode: 'tor' },
  { name: 'Jazz', shortName: 'UTA', nbaCode: 'uta' },
  { name: 'Wizards', shortName: 'WAS', nbaCode: 'was' },
];

export function getNbaLogoUrl(nbaCode: string): string {
  return `${ESPN_BASE}/nba/500/${nbaCode}.png`;
}

// ─── FOOTBALL ─────────────────────────────────────────────────────────────────

export const FOOTBALL_LEAGUES: Record<string, FootballLeague> = {
  ligue1: {
    folder: 'France - Ligue 1',
    teams: [
      { file: 'AJ Auxerre', shortName: 'Auxerre' },
      { file: 'Angers SCO', shortName: 'Angers' },
      { file: 'AS Monaco', shortName: 'Monaco' },
      { file: 'FC Lorient', shortName: 'Lorient' },
      { file: 'FC Metz', shortName: 'Metz' },
      { file: 'FC Nantes', shortName: 'Nantes' },
      { file: 'FC Toulouse', shortName: 'Toulouse' },
      { file: 'Le Havre AC', shortName: 'Le Havre' },
      { file: 'LOSC Lille', shortName: 'Lille' },
      { file: 'OGC Nice', shortName: 'Nice' },
      { file: 'Olympique Lyon', shortName: 'Lyon' },
      { file: 'Olympique Marseille', shortName: 'OM' },
      { file: 'Paris FC', shortName: 'Paris FC' },
      { file: 'Paris Saint-Germain', shortName: 'PSG' },
      { file: 'RC Lens', shortName: 'Lens' },
      { file: 'RC Strasbourg Alsace', shortName: 'Strasbourg' },
      { file: 'Stade Brestois 29', shortName: 'Brest' },
      { file: 'Stade Rennais FC', shortName: 'Rennes' },
    ],
  },
  pl: {
    folder: 'England - Premier League',
    teams: [
      { file: 'AFC Bournemouth', shortName: 'Bournemouth' },
      { file: 'Arsenal FC', shortName: 'Arsenal' },
      { file: 'Aston Villa', shortName: 'A. Villa' },
      { file: 'Brentford FC', shortName: 'Brentford' },
      { file: 'Brighton & Hove Albion', shortName: 'Brighton' },
      { file: 'Burnley FC', shortName: 'Burnley' },
      { file: 'Chelsea FC', shortName: 'Chelsea' },
      { file: 'Crystal Palace', shortName: 'C. Palace' },
      { file: 'Everton FC', shortName: 'Everton' },
      { file: 'Fulham FC', shortName: 'Fulham' },
      { file: 'Leeds United', shortName: 'Leeds' },
      { file: 'Liverpool FC', shortName: 'Liverpool' },
      { file: 'Manchester City', shortName: 'M. City' },
      { file: 'Manchester United', shortName: 'M. United' },
      { file: 'Newcastle United', shortName: 'Newcastle' },
      { file: 'Nottingham Forest', shortName: "Nott'm F." },
      { file: 'Sunderland AFC', shortName: 'Sunderland' },
      { file: 'Tottenham Hotspur', shortName: 'Tottenham' },
      { file: 'West Ham United', shortName: 'W. Ham' },
      { file: 'Wolverhampton Wanderers', shortName: 'Wolves' },
    ],
  },
  laliga: {
    folder: 'Spain - LaLiga',
    teams: [
      { file: 'Athletic Bilbao', shortName: 'Bilbao' },
      { file: 'Atlético de Madrid', shortName: 'Atlético' },
      { file: 'CA Osasuna', shortName: 'Osasuna' },
      { file: 'Celta de Vigo', shortName: 'Celta' },
      { file: 'Deportivo Alavés', shortName: 'Alavés' },
      { file: 'FC Barcelona', shortName: 'Barça' },
      { file: 'Getafe CF', shortName: 'Getafe' },
      { file: 'Girona FC', shortName: 'Girona' },
      { file: 'RCD Mallorca', shortName: 'Mallorca' },
      { file: 'Rayo Vallecano', shortName: 'Rayo' },
      { file: 'Real Betis Balompié', shortName: 'Betis' },
      { file: 'Real Madrid', shortName: 'R. Madrid' },
      { file: 'Real Sociedad', shortName: 'R. Sociedad' },
      { file: 'Sevilla FC', shortName: 'Sevilla' },
      { file: 'Valencia CF', shortName: 'Valencia' },
      { file: 'Villarreal CF', shortName: 'Villarreal' },
    ],
  },
  bundesliga: {
    folder: 'Germany - Bundesliga',
    teams: [
      { file: '1.FC Heidenheim 1846', shortName: 'Heidenheim' },
      { file: '1.FC Köln', shortName: 'Köln' },
      { file: '1.FC Union Berlin', shortName: 'Union Berlin' },
      { file: '1.FSV Mainz 05', shortName: 'Mainz' },
      { file: 'Bayer 04 Leverkusen', shortName: 'Leverkusen' },
      { file: 'Bayern Munich', shortName: 'Bayern' },
      { file: 'Borussia Dortmund', shortName: 'Dortmund' },
      { file: 'Borussia Mönchengladbach', shortName: 'Gladbach' },
      { file: 'Eintracht Frankfurt', shortName: 'Frankfurt' },
      { file: 'FC Augsburg', shortName: 'Augsburg' },
      { file: 'FC St. Pauli', shortName: 'St. Pauli' },
      { file: 'Hamburger SV', shortName: 'Hamburg' },
      { file: 'RB Leipzig', shortName: 'Leipzig' },
      { file: 'SC Freiburg', shortName: 'Freiburg' },
      { file: 'SV Werder Bremen', shortName: 'Bremen' },
      { file: 'TSG 1899 Hoffenheim', shortName: 'Hoffenheim' },
      { file: 'VfB Stuttgart', shortName: 'Stuttgart' },
      { file: 'VfL Wolfsburg', shortName: 'Wolfsburg' },
    ],
  },
  seriea: {
    folder: 'Italy - Serie A',
    teams: [
      { file: 'AC Milan', shortName: 'Milan' },
      { file: 'ACF Fiorentina', shortName: 'Fiorentina' },
      { file: 'AS Roma', shortName: 'Roma' },
      { file: 'Atalanta BC', shortName: 'Atalanta' },
      { file: 'Bologna FC 1909', shortName: 'Bologna' },
      { file: 'Cagliari Calcio', shortName: 'Cagliari' },
      { file: 'Como 1907', shortName: 'Como' },
      { file: 'Genoa CFC', shortName: 'Genoa' },
      { file: 'Hellas Verona', shortName: 'Verona' },
      { file: 'Inter Milan', shortName: 'Inter' },
      { file: 'Juventus FC', shortName: 'Juventus' },
      { file: 'Parma Calcio 1913', shortName: 'Parma' },
      { file: 'SS Lazio', shortName: 'Lazio' },
      { file: 'SSC Napoli', shortName: 'Napoli' },
      { file: 'Torino FC', shortName: 'Torino' },
      { file: 'Udinese Calcio', shortName: 'Udinese' },
    ],
  },
};

/** Returns all teams from all football leagues (for UCL/UEL generic picker) */
export function getAllFootballTeams(): (FootballTeam & { leagueId: string })[] {
  return Object.entries(FOOTBALL_LEAGUES).flatMap(([leagueId, league]) =>
    league.teams.map(t => ({ ...t, leagueId }))
  );
}

// ─── EUROLEAGUE ──────────────────────────────────────────────────────────────

const EL_BASE = 'https://cdn.jsdelivr.net/gh/ivansenic/real-euroleague-standings@main/assets/team-logos';

export interface EuroLeagueTeam {
  name: string;
  shortName: string;
  /** File name without extension, e.g. "04-BAR" */
  file: string;
}

export const EUROLEAGUE_TEAMS: EuroLeagueTeam[] = [
  { name: 'ALBA Berlin', shortName: 'ALBA Berlin', file: '06-BER' },
  { name: 'Anadolu Efes Istanbul', shortName: 'A. Efes', file: '15-IST' },
  { name: 'AS Monaco', shortName: 'Monaco', file: '24-MCO' },
  { name: 'Crvena Zvezda Belgrade', shortName: 'Crvena Z.', file: '34-RED' },
  { name: 'Dubai Basketball', shortName: 'Dubai', file: '12-DUB' },
  { name: 'EA7 Emporio Armani Milan', shortName: 'EA7 Milan', file: '25-MIL' },
  { name: 'FC Barcelona', shortName: 'Barça', file: '04-BAR' },
  { name: 'FC Bayern Munich', shortName: 'Bayern', file: '26-MUN' },
  { name: 'Fenerbahçe Beko', shortName: 'Fenerbahçe', file: '39-ULK' },
  { name: 'Maccabi Tel Aviv', shortName: 'Maccabi', file: '35-TEL' },
  { name: 'Olympiacos BC', shortName: 'Olympiacos', file: '29-OLY' },
  { name: 'Panathinaikos BC', shortName: 'Panathin.', file: '31-PAN' },
  { name: 'Paris Basketball', shortName: 'Paris Bball', file: '33-PRS' },
  { name: 'Partizan Belgrade', shortName: 'Partizan', file: '32-PAR' },
  { name: 'Real Madrid Baloncesto', shortName: 'R. Madrid', file: '22-MAD' },
  { name: 'Valencia Basket', shortName: 'Valencia', file: '42-VNC' },
  { name: 'Virtus Bologna', shortName: 'Virtus', file: '41-VIR' },
  { name: 'Zalgiris Kaunas', shortName: 'Zalgiris', file: '45-ZAL' },
];

export function getEuroLeagueTeam(name: string): EuroLeagueTeam | undefined {
  return EUROLEAGUE_TEAMS.find(t => t.name.toLowerCase() === name.toLowerCase());
}

export function getEuroLeagueLogoUrl(file: string): string {
  return `${EL_BASE}/${file}.webp`;
}



export function getLeague(id: string): League | undefined {
  return LEAGUES.find(l => l.id === id);
}

export function getNbaTeam(nameOrCode: string): NBATeam | undefined {
  const val = nameOrCode.toLowerCase();
  return NBA_TEAMS.find(
    t => t.shortName.toLowerCase() === val || t.name.toLowerCase() === val
  );
}

export function isNbaCompetition(competition: string): boolean {
  return competition?.toLowerCase() === 'nba';
}

export function getFootballLeagueByCompetition(competition: string): FootballLeague | undefined {
  const league = LEAGUES.find(
    l => l.name.toLowerCase() === competition?.toLowerCase()
  );
  if (!league) return undefined;
  return FOOTBALL_LEAGUES[league.id];
}

export function getFootballTeam(leagueId: string, teamFile: string): FootballTeam | undefined {
  return FOOTBALL_LEAGUES[leagueId]?.teams.find(
    t => t.file.toLowerCase() === teamFile.toLowerCase()
  );
}

export function getFootballLogoUrl(folder: string, teamFile: string): string {
  return `${GH_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent(teamFile)}.png`;
}

/** Returns the short display name for a football team stored by its file name */
export function getFootballShortName(competition: string, teamFile: string): string {
  const league = getFootballLeagueByCompetition(competition);
  if (!league) return teamFile;
  const team = league.teams.find(t => t.file === teamFile);
  return team?.shortName ?? teamFile;
}
