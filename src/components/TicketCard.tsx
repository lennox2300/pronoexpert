import { Check, X, Eye, EyeOff } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { useBranding } from '../hooks/useBranding';

function renderSiteName(siteName: string) {
  const parts = siteName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return <span className="text-white">{siteName}</span>;
  }
  const lastWord = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(' ');
  return <><span className="text-white">{rest}</span> <span className="text-brand">{lastWord}</span></>;
}
import {
  LEAGUES,
  getNbaTeam,
  getNbaLogoUrl,
  isNbaCompetition,
  getFootballLeagueByCompetition,
  getFootballLogoUrl,
  getFootballShortName,
  getEuroLeagueTeam,
  getEuroLeagueLogoUrl,
} from '../lib/leaguesData';

type Prediction = Database['public']['Tables']['predictions']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface PredictionWithMatches extends Prediction {
  matches: Match[];
}

interface TicketCardProps {
  prediction: PredictionWithMatches;
  isAdmin?: boolean;
  onValidate?: (id: string, won: boolean) => void;
  onTogglePublic?: (id: string) => void;
}

function getLeagueFlag(competitionName: string, sport: string): string | null {
  if (!competitionName || sport !== 'football') return null;
  const name = competitionName.toLowerCase();
  const league = LEAGUES.find((item) =>
    item.name.toLowerCase() === name ||
    item.id === name ||
    name.includes(item.id) ||
    item.name.toLowerCase().includes(name)
  );
  return league?.flag || null;
}

function TeamLogo({ src, alt, size = 28 }: { src: string; alt: string; size?: number }) {
  return (
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-page p-1">
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    </span>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

function statusColor(result: Match['result']): string {
  if (result === 'won') return 'text-wingreen';
  if (result === 'lost') return 'text-losedred';
  return 'text-texttert';
}

interface MatchRowProps {
  match: Match;
  isLast: boolean;
  isSimple: boolean;
  stake: number;
}

function MatchRow({ match, isLast, isSimple, stake }: MatchRowProps) {
  const isNba = isNbaCompetition(match.competition || '');
  const isEuroLeague = match.competition?.toLowerCase() === 'euroleague';
  const footballLeague = !isNba && !isEuroLeague && match.sport === 'football'
    ? getFootballLeagueByCompetition(match.competition || '')
    : undefined;
  const flag = getLeagueFlag(match.competition || '', match.sport);
  const hasScore = Boolean(match.score?.trim());
  const hasResult = match.result === 'won' || match.result === 'lost';

  let team1LogoSrc: string | null = null;
  let team2LogoSrc: string | null = null;
  let team1Label = match.team1;
  let team2Label = match.team2;

  if (isNba) {
    const team1 = getNbaTeam(match.team1);
    const team2 = getNbaTeam(match.team2);
    if (team1) { team1LogoSrc = getNbaLogoUrl(team1.nbaCode); team1Label = team1.shortName; }
    if (team2) { team2LogoSrc = getNbaLogoUrl(team2.nbaCode); team2Label = team2.shortName; }
  } else if (isEuroLeague) {
    const team1 = getEuroLeagueTeam(match.team1);
    const team2 = getEuroLeagueTeam(match.team2);
    if (team1) { team1LogoSrc = getEuroLeagueLogoUrl(team1.file); team1Label = team1.shortName; }
    if (team2) { team2LogoSrc = getEuroLeagueLogoUrl(team2.file); team2Label = team2.shortName; }
  } else if (footballLeague) {
    team1Label = getFootballShortName(match.competition, match.team1);
    team2Label = getFootballShortName(match.competition, match.team2);
    team1LogoSrc = getFootballLogoUrl(footballLeague.folder, match.team1);
    team2LogoSrc = getFootballLogoUrl(footballLeague.folder, match.team2);
  } else {
    team1LogoSrc = match.team1_logo_url || null;
    team2LogoSrc = match.team2_logo_url || null;
  }

  const resultClass = statusColor(match.result);
  const gain = Number(match.odds) * stake;
  const simpleGain = match.result === 'won' ? gain - stake : -stake;

  return (
    <div className={!isLast ? 'border-b border-border pb-3 mb-3' : ''}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-textsec">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-page text-[9px]">
          {match.competition_logo_url ? (
            <img src={match.competition_logo_url} alt="" className="h-3.5 w-3.5 object-contain" />
          ) : isNba ? (
            <img src="https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" alt="NBA" className="h-3.5 w-3.5 object-contain" />
          ) : flag ? flag : '·'}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-textsec">{match.competition || 'Autre'}</span>
        <span className="ml-auto font-mono-nums text-textsec">{formatDate(match.match_date)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
          <span className="min-w-0 truncate text-sm font-medium text-white">{team1Label}</span>
          {team1LogoSrc ? <TeamLogo src={team1LogoSrc} alt={team1Label} /> : flag && <span className="text-sm">{flag}</span>}
        </div>
        <span className="text-xs text-texttert">vs</span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {team2LogoSrc ? <TeamLogo src={team2LogoSrc} alt={team2Label} /> : flag && <span className="text-sm">{flag}</span>}
          <span className="min-w-0 truncate text-sm font-medium text-white">{team2Label}</span>
        </div>
        <span className="font-mono-nums text-sm font-semibold text-brand">{Number(match.odds).toFixed(2)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className={hasResult ? resultClass : 'text-textsec'}>{match.bet_type}</span>
        <span className={`font-mono-nums ${resultClass}`}>{hasScore ? match.score : '—'}</span>
      </div>

      {isSimple && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] text-textsec">
          <span>Mise <strong className="font-mono-nums font-medium text-white">{stake.toFixed(2)} €</strong></span>
          <span className={match.result === 'won' ? 'text-wingreen' : match.result === 'lost' ? 'text-losedred' : 'text-brand'}>
            {match.result === 'won' ? '+' : ''}{simpleGain.toFixed(2)} €
          </span>
        </div>
      )}
    </div>
  );
}

export function TicketCard({ prediction, isAdmin, onValidate, onTogglePublic }: TicketCardProps) {
  const isPending = prediction.status === 'pending';
  const isWon = prediction.status === 'won';
  const isSimple = prediction.type === 'simple';
  const stake = Number(prediction.stake);
  const gain = stake * Number(prediction.total_odds);
  const { site_name } = useBranding();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-semibold tracking-tight">{renderSiteName(site_name)}</div>
        <div className="flex items-center gap-2 text-[10px] text-textsec">
          <span>{isSimple ? 'Paris simples' : 'Pari combiné'}</span>
          {isPending ? <span className="text-brand" title="En cours">·</span> : isWon ? <Check size={14} strokeWidth={1.8} className="text-wingreen" /> : <X size={14} strokeWidth={1.8} className="text-losedred" />}
        </div>
      </div>

      <div className="px-4 py-4">
        {prediction.matches.map((match, index) => (
          <MatchRow key={match.id} match={match} isLast={index === prediction.matches.length - 1} isSimple={isSimple} stake={stake} />
        ))}
      </div>

      {!isSimple && (
        <div className="mx-4 mb-4 flex items-center justify-center divide-x divide-border rounded-lg bg-page px-2 py-3">
          <div className="flex flex-1 flex-col items-center gap-1 px-2 text-[10px] text-textsec"><span>Cote totale</span><strong className="font-mono-nums text-sm font-semibold text-brand">{Number(prediction.total_odds).toFixed(2)}</strong></div>
          <div className="flex flex-1 flex-col items-center gap-1 px-2 text-[10px] text-textsec"><span>Mise</span><strong className="font-mono-nums text-sm font-semibold text-white">{stake.toFixed(2)} €</strong></div>
          <div className="flex flex-1 flex-col items-center gap-1 px-2 text-[10px] text-textsec"><span>Gains</span><strong className={`font-mono-nums text-sm font-semibold ${isPending ? 'text-brand' : isWon ? 'text-wingreen' : 'text-losedred'}`}>{isPending ? gain.toFixed(2) : isWon ? `+${(gain - stake).toFixed(2)}` : `-${stake.toFixed(2)}`} €</strong></div>
        </div>
      )}

      {isAdmin && isPending && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          <button onClick={() => onValidate?.(prediction.id, true)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-wingreen transition-colors hover:bg-wingreen/10"><Check size={13} />Gagné</button>
          <button onClick={() => onValidate?.(prediction.id, false)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-losedred transition-colors hover:bg-losedred/10"><X size={13} />Perdu</button>
          <button onClick={() => onTogglePublic?.(prediction.id)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-textsec transition-colors hover:bg-page"><span>{prediction.is_public ? <Eye size={13} /> : <EyeOff size={13} />}</span>{prediction.is_public ? 'Public' : 'VIP'}</button>
        </div>
      )}
    </div>
  );
}
