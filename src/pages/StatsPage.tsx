import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Trophy, History, Trash2, ChevronDown, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';
import { TicketCard } from '../components/TicketCard';

type Prediction = Database['public']['Tables']['predictions']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface PredictionWithMatches extends Prediction {
  matches: Match[];
}

interface BankrollData {
  balance: number;
  total_profit: number;
  total_loss: number;
  won_count: number;
  lost_count: number;
}

interface SportStat {
  sport: string;
  icon: string;
  label: string;
  won: number;
  lost: number;
  profit: number;
  stake: number;
  recentResults: ('won' | 'lost')[];
}

const SPORT_ICONS: Record<string, string> = {
  football: '⚽',
  tennis: '🎾',
  basketball: '🏀',
  hockey: '🏒',
  rugby: '🏉',
  sports_us: '🏈',
  boxing: '🥊',
  golf: '⛳',
  volleyball: '🏐',
  handball: '🤾',
  baseball: '⚾',
  cycling: '🚴',
  mma: '🥋',
  multisport: '🏅',
};

const SPORT_LABELS: Record<string, string> = {
  football: 'Football',
  tennis: 'Tennis',
  basketball: 'Basketball',
  hockey: 'Hockey',
  rugby: 'Rugby',
  sports_us: 'Sports US',
  boxing: 'Boxe',
  golf: 'Golf',
  volleyball: 'Volley',
  handball: 'Handball',
  baseball: 'Baseball',
  cycling: 'Cyclisme',
  mma: 'MMA',
  multisport: 'Multisport',
};

function FormDots({ results }: { results: ('won' | 'lost')[] }) {
  const last6 = [...results].slice(-6);
  while (last6.length < 6) last6.unshift(null as unknown as 'won' | 'lost');
  return (
    <div className="flex items-center gap-[3px]">
      {last6.map((r, i) => {
        if (!r) return <div key={i} className="w-3 h-3 rounded-full bg-gray-800 border border-gray-700/60" />;
        return (
          <div
            key={i}
            className={`w-3 h-3 rounded-full shadow-sm ${r === 'won' ? 'bg-emerald-500 shadow-emerald-900/60' : 'bg-red-500 shadow-red-900/60'}`}
          />
        );
      })}
    </div>
  );
}

function SportStatsSection({ predictions }: { predictions: PredictionWithMatches[] }) {
  const validated = predictions.filter((p) => p.status !== 'pending');
  if (validated.length === 0) return null;

  const statsMap: Record<string, SportStat> = {};

  for (const pred of [...validated].reverse()) {
    const uniqueSports = [...new Set(pred.matches.map((m) => m.sport))];
    // Combiné avec plusieurs sports différents → catégorie Multisport
    const isMultiSport = uniqueSports.length > 1;
    const sportsToCredit = isMultiSport ? ['multisport'] : uniqueSports;

    for (const sport of sportsToCredit) {
      if (!statsMap[sport]) {
        statsMap[sport] = {
          sport,
          icon: SPORT_ICONS[sport] || '🏅',
          label: SPORT_LABELS[sport] || sport,
          won: 0,
          lost: 0,
          profit: 0,
          stake: 0,
          recentResults: [],
        };
      }
      const s = statsMap[sport];
      // Un ticket perdu = boule rouge pour tout le sport (résultat du ticket, pas du match individuel)
      if (pred.status === 'won') { s.won++; s.profit += Number(pred.profit) || 0; }
      else { s.lost++; s.profit += Number(pred.profit) || 0; }
      s.stake += Number(pred.stake);
      s.recentResults.push(pred.status as 'won' | 'lost');
    }
  }

  const sportStats = Object.values(statsMap).sort((a, b) => (b.won + b.lost) - (a.won + a.lost));
  if (sportStats.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-white uppercase mb-3 flex items-center gap-2">
        <Trophy size={15} className="text-yellow-500" />
        Forme par sport
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {sportStats.map((s) => {
          const total = s.won + s.lost;
          const winRate = total > 0 ? Math.round((s.won / total) * 100) : 0;
          const last5won = s.recentResults.slice(-5).filter((r) => r === 'won').length;
          const borderColor = last5won >= 4
            ? 'border-emerald-600/70'
            : last5won >= 2
            ? 'border-yellow-600/50'
            : total === 0
            ? 'border-gray-800'
            : 'border-red-600/50';

          return (
            <div
              key={s.sport}
              className={`bg-gradient-to-b from-gray-900 to-black border ${borderColor} rounded-xl p-2.5 flex flex-col gap-1.5`}
            >
              {/* Row 1: icon + profit + % — all on one line */}
              <div className="flex items-center gap-1.5 w-full">
                {s.sport === 'multisport'
                  ? <span className="text-[9px] font-bold text-gray-300 leading-none flex-shrink-0">Multisport</span>
                  : <span className="text-xl leading-none flex-shrink-0">{s.icon}</span>}
                <span className={`text-[11px] font-bold leading-none flex-shrink-0 ${s.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.profit >= 0 ? '+' : ''}{s.profit.toFixed(0)}€
                </span>
                <span className="text-[11px] font-bold text-yellow-500 leading-none ml-auto flex-shrink-0">{winRate}%</span>
              </div>

              {/* Row 2: form dots */}
              <FormDots results={s.recentResults} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatsPage() {
  const { profile } = useAuth();
  const [bankroll, setBankroll] = useState<BankrollData | null>(null);
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bankrollResult, predResult] = await Promise.all([
        supabase.from('bankroll').select('*').single(),
        supabase
          .from('predictions')
          .select('*')
          .neq('status', 'pending')
          .order('validated_at', { ascending: false }),
      ]);

      if (bankrollResult.error) throw bankrollResult.error;
      if (predResult.error) throw predResult.error;

      setBankroll(bankrollResult.data);

      const preds = predResult.data || [];
      if (preds.length === 0) {
        setPredictions([]);
        return;
      }

      const predIds = preds.map(p => p.id);
      const { data: allMatches } = await supabase
        .from('matches')
        .select('*')
        .in('prediction_id', predIds)
        .order('match_date');

      const matchesByPred = new Map<string, Match[]>();
      for (const m of allMatches || []) {
        const arr = matchesByPred.get(m.prediction_id) || [];
        arr.push(m);
        matchesByPred.set(m.prediction_id, arr);
      }

      const predictionsWithMatches: PredictionWithMatches[] = preds.map(pred => ({
        ...pred,
        matches: matchesByPred.get(pred.id) || [],
      }));

      setPredictions(predictionsWithMatches);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePrediction = async (predictionId: string) => {
    if (!profile?.is_admin) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pari ?')) return;

    try {
      await supabase.from('matches').delete().eq('prediction_id', predictionId);
      await supabase.from('predictions').delete().eq('id', predictionId);

      const { data: remainingPredictions } = await supabase
        .from('predictions')
        .select('*')
        .in('status', ['won', 'lost']);

      let newBalance = 5000;
      let newTotalLoss = 0;
      let newWonCount = 0;
      let newLostCount = 0;

      if (remainingPredictions) {
        for (const pred of remainingPredictions) {
          const predProfit = Number(pred.profit) || 0;
          newBalance += predProfit;
          if (pred.status === 'won') {
            newWonCount++;
          } else if (pred.status === 'lost') {
            newLostCount++;
            newTotalLoss += Math.abs(predProfit);
          }
        }
      }

      const newTotalProfit = newBalance - 5000;

      const { data: bankrollData } = await supabase
        .from('bankroll')
        .select('id')
        .single();

      if (bankrollData) {
        await supabase
          .from('bankroll')
          .update({
            balance: newBalance,
            total_profit: newTotalProfit,
            total_loss: newTotalLoss,
            won_count: newWonCount,
            lost_count: newLostCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bankrollData.id);
      }

      loadData();
    } catch (error) {
      console.error('Error deleting prediction:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const startEditBalance = () => {
    setBalanceInput(Number(bankroll?.balance).toFixed(2));
    setEditingBalance(true);
  };

  const saveBalance = async () => {
    const newBalance = parseFloat(balanceInput);
    if (isNaN(newBalance)) return;

    const newTotalProfit = newBalance - 5000;

    const { data: bankrollData } = await supabase
      .from('bankroll')
      .select('id')
      .single();

    if (bankrollData) {
      await supabase
        .from('bankroll')
        .update({
          balance: newBalance,
          total_profit: newTotalProfit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankrollData.id);
    }

    setBankroll(prev => prev ? { ...prev, balance: newBalance, total_profit: newTotalProfit } : prev);
    setEditingBalance(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!bankroll) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Aucune donnée disponible</div>
      </div>
    );
  }

  const totalBets = Number(bankroll.won_count) + Number(bankroll.lost_count);
  const winRate = totalBets > 0 ? ((Number(bankroll.won_count) / totalBets) * 100).toFixed(1) : '0.0';
  const profit = Number(bankroll.balance) - 5000;

  const groupByMonth = (predictions: PredictionWithMatches[]) => {
    const groups: { [key: string]: PredictionWithMatches[] } = {};
    predictions.forEach(pred => {
      const date = new Date(pred.validated_at || pred.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(pred);
    });
    return groups;
  };

  const calculateMonthStats = (monthPredictions: PredictionWithMatches[]) => {
    let totalProfit = 0;
    let won = 0;
    let lost = 0;

    for (const pred of monthPredictions) {
      const predProfit = Number(pred.profit) || 0;
      totalProfit += predProfit;
      if (pred.status === 'won') {
        won++;
      } else if (pred.status === 'lost') {
        lost++;
      }
    }

    return { totalProfit, won, lost };
  };

  const formatMonthYear = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const groupedPredictions = groupByMonth(predictions);
  const sortedMonthKeys = Object.keys(groupedPredictions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-black py-4 px-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <History className="text-emerald-600" size={28} />
          <h1 className="text-2xl font-bold text-white">HISTORIQUE</h1>
        </div>

        <div className="mb-4 bg-black rounded-lg p-4 border border-emerald-700">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="text-yellow-600" size={24} />
            <h2 className="text-sm text-gray-400 font-semibold uppercase">Solde Bankroll</h2>
          </div>
          {editingBalance ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="text-4xl font-bold text-white bg-transparent border-b-2 border-emerald-600 focus:outline-none w-48"
                autoFocus
              />
              <span className="text-2xl font-bold text-white">€</span>
              <button
                onClick={saveBalance}
                className="ml-2 p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                title="Enregistrer"
              >
                <Check size={20} className="text-white" />
              </button>
              <button
                onClick={() => setEditingBalance(false)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Annuler"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-white">{Number(bankroll.balance).toFixed(2)}€</span>
              {profile?.is_admin && (
                <button
                  onClick={startEditBalance}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Modifier le solde"
                >
                  <Pencil size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-2.5 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Profit</div>
              {profit >= 0 ? <TrendingUp className="text-emerald-500" size={14} /> : <TrendingDown className="text-red-500" size={14} />}
            </div>
            <div className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)}€
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-2.5 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Chance</div>
              <Target className="text-yellow-600" size={14} />
            </div>
            <div className="text-lg font-bold text-yellow-600">{winRate}%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-2.5 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Paris Total</div>
              <Trophy className="text-white" size={14} />
            </div>
            <div className="text-lg font-bold text-white">{totalBets}</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-2.5 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Gagnés</div>
              <Trophy className="text-emerald-500" size={14} />
            </div>
            <div className="text-lg font-bold text-emerald-500">{bankroll.won_count}</div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-2.5 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Perdus</div>
              <Target className="text-red-500" size={14} />
            </div>
            <div className="text-lg font-bold text-red-500">{bankroll.lost_count}</div>
          </div>
        </div>

        <SportStatsSection predictions={predictions} />

        <div>
          <h2 className="text-lg font-bold text-white mb-3 uppercase">Historique</h2>
          {sortedMonthKeys.map((monthKey) => {
            const monthPredictions = groupedPredictions[monthKey];
            const monthStats = calculateMonthStats(monthPredictions);
            const isExpanded = expandedMonths.has(monthKey);

            const toggleMonth = () => {
              setExpandedMonths(prev => {
                const next = new Set(prev);
                if (next.has(monthKey)) {
                  next.delete(monthKey);
                } else {
                  next.add(monthKey);
                }
                return next;
              });
            };

            return (
            <div key={monthKey} className="mb-4">
              <button
                onClick={toggleMonth}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg hover:border-emerald-600 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {isExpanded ? <ChevronDown className="text-emerald-500" size={18} /> : <ChevronRight className="text-emerald-500" size={18} />}
                  <h3 className="text-md font-bold text-emerald-500 uppercase capitalize">
                    {formatMonthYear(monthKey)}
                  </h3>
                  <span className="text-xs text-gray-400">({monthStats.won} G - {monthStats.lost} P)</span>
                </div>
                <div className={`text-sm font-bold px-3 py-1 rounded ${
                  monthStats.totalProfit >= 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                }`}>
                  {monthStats.totalProfit >= 0 ? '+' : ''}{monthStats.totalProfit.toFixed(2)}€
                </div>
              </button>
              {isExpanded && (
              <div className="space-y-3 mt-3">
                {groupedPredictions[monthKey].map((prediction) => (
                  <div key={prediction.id} className="relative">
                    <TicketCard
                      prediction={prediction}
                      isAdmin={profile?.is_admin}
                      onValidate={undefined}
                      onTogglePublic={undefined}
                    />
                    {profile?.is_admin && (
                      <button
                        onClick={() => deletePrediction(prediction.id)}
                        className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded transition-colors z-10"
                        title="Supprimer"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>
            );
          })}

          {predictions.length === 0 && (
            <div className="bg-black rounded-lg p-8 text-center border border-gray-800">
              <p className="text-gray-400">Aucun pari validé dans l'historique</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
