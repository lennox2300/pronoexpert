import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Trophy, History, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';

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

const SPORT_ICONS: Record<string, string> = {
  football: '⚽',
  tennis: '🎾',
  basketball: '🏀',
  hockey: '🏒',
  rugby: '🏉',
  sports_us: '🏈',
};

export function StatsPage() {
  const { profile } = useAuth();
  const [bankroll, setBankroll] = useState<BankrollData | null>(null);
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [loading, setLoading] = useState(true);

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

      const predictionsWithMatches: PredictionWithMatches[] = [];
      for (const pred of predResult.data || []) {
        try {
          const { data: matchData } = await supabase
            .from('matches')
            .select('*')
            .eq('prediction_id', pred.id)
            .order('match_date');

          predictionsWithMatches.push({
            ...pred,
            matches: matchData || [],
          });
        } catch (error) {
          console.error('Error loading matches:', error);
          predictionsWithMatches.push({
            ...pred,
            matches: [],
          });
        }
      }

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
      let newTotalProfit = 0;
      let newTotalLoss = 0;
      let newWonCount = 0;
      let newLostCount = 0;

      if (remainingPredictions) {
        for (const pred of remainingPredictions) {
          if (pred.status === 'won') {
            newWonCount++;
            const profit = Number(pred.profit) || 0;
            newBalance += profit;
            newTotalProfit += profit;
          } else if (pred.status === 'lost') {
            newLostCount++;
            const loss = Math.abs(Number(pred.profit) || 0);
            const balanceAfterLoss = newBalance - loss;
            newBalance = balanceAfterLoss;
            if (balanceAfterLoss < 5000) {
              newTotalLoss += loss;
            }
          }
        }
      }

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
  const netProfit = Number(bankroll.balance) - 5000;

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

  const calculateMonthStats = (monthPredictions: PredictionWithMatches[], allPredictions: PredictionWithMatches[]) => {
    let totalProfit = 0;
    let won = 0;
    let lost = 0;

    const allSorted = [...allPredictions].sort((a, b) => {
      const dateA = new Date(a.validated_at || a.created_at).getTime();
      const dateB = new Date(b.validated_at || b.created_at).getTime();
      return dateA - dateB;
    });

    const monthSorted = [...monthPredictions].sort((a, b) => {
      const dateA = new Date(a.validated_at || a.created_at).getTime();
      const dateB = new Date(b.validated_at || b.created_at).getTime();
      return dateA - dateB;
    });

    let runningBalance = 5000;
    for (const pred of allSorted) {
      const isInCurrentMonth = monthPredictions.some(mp => mp.id === pred.id);
      const profit = Number(pred.profit) || 0;

      if (pred.status === 'won') {
        if (isInCurrentMonth) {
          won++;
          totalProfit += profit;
        }
        runningBalance += profit;
      } else if (pred.status === 'lost') {
        if (isInCurrentMonth) {
          lost++;
        }
        const balanceAfterLoss = runningBalance + profit;
        if (isInCurrentMonth && balanceAfterLoss < 5000) {
          totalProfit += profit;
        }
        runningBalance = balanceAfterLoss;
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
          <div className="text-4xl font-bold text-white">{Number(bankroll.balance).toFixed(2)}€</div>
        </div>

        {netProfit < 0 ? (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-2.5 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Profit</div>
                <TrendingUp className="text-emerald-500" size={14} />
              </div>
              <div className="text-lg font-bold text-emerald-500">
                +{Number(bankroll.total_profit).toFixed(2)}€
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-2.5 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Perte</div>
                <TrendingDown className="text-red-500" size={14} />
              </div>
              <div className="text-lg font-bold text-red-500">
                {netProfit.toFixed(2)}€
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
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-2.5 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Profit</div>
                <TrendingUp className="text-emerald-500" size={14} />
              </div>
              <div className="text-lg font-bold text-emerald-500">
                +{Number(bankroll.total_profit).toFixed(2)}€
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
        )}

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

        <div className="bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg p-3 shadow-lg mb-6">
          <div className="text-[10px] text-gray-400 uppercase mb-1 tracking-wide">Résultat Net</div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}€
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-3 uppercase">Historique</h2>
          {sortedMonthKeys.map((monthKey) => {
            const monthPredictions = groupedPredictions[monthKey];
            const monthStats = calculateMonthStats(monthPredictions, predictions);

            return (
            <div key={monthKey} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-bold text-emerald-500 uppercase capitalize">
                  {formatMonthYear(monthKey)}
                </h3>
                <div className={`text-sm font-bold px-3 py-1 rounded ${
                  monthStats.totalProfit >= 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                }`}>
                  {monthStats.totalProfit >= 0 ? '+' : ''}{monthStats.totalProfit.toFixed(2)}€
                </div>
              </div>
              <div className="space-y-3">
                {groupedPredictions[monthKey].map((prediction) => {
              const isWon = prediction.status === 'won';
              return (
                <div
                  key={prediction.id}
                  className={`bg-black rounded-lg p-3 border ${
                    isWon ? 'border-emerald-600' : 'border-red-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        isWon ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {isWon ? 'GAGNÉ' : 'PERDU'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {prediction.type === 'simple' ? 'Simple' : 'Combiné'}
                      </span>
                      {!prediction.is_public && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-600 text-black font-bold">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-400">
                        {prediction.validated_at
                          ? new Date(prediction.validated_at).toLocaleDateString('fr-FR')
                          : new Date(prediction.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      {profile?.is_admin && (
                        <button
                          onClick={() => deletePrediction(prediction.id)}
                          className="p-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-2">
                    {prediction.matches.map((match) => (
                      <div key={match.id} className="bg-gray-900 rounded p-2 border border-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <span className="text-lg">{SPORT_ICONS[match.sport]}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-semibold truncate">
                                {match.team1} vs {match.team2}
                              </div>
                              <div className="text-xs text-gray-400">{match.bet_type}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(match.match_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })} à {new Date(match.match_date).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="text-yellow-600 font-bold ml-2">Cote {Number(match.odds).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <div className="flex space-x-4 text-xs">
                      <div>
                        <span className="text-gray-400">Cote: </span>
                        <span className="text-yellow-600 font-bold">{Number(prediction.total_odds).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Mise: </span>
                        <span className="text-white font-bold">{Number(prediction.stake).toFixed(2)}€</span>
                      </div>
                    </div>
                    {prediction.profit !== null && (
                      <div className="text-right">
                        <div className={`font-bold text-lg ${
                          Number(prediction.profit) >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {Number(prediction.profit) >= 0 ? '+' : ''}{Number(prediction.profit).toFixed(2)}€
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
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
