import { useEffect, useState } from 'react';
import { Crown, Lock, Check, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';

type Prediction = Database['public']['Tables']['predictions']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface PredictionWithMatches extends Prediction {
  matches: Match[];
}

const SPORT_ICONS: Record<string, string> = {
  football: '⚽',
  tennis: '🎾',
  basketball: '🏀',
  hockey: '🏒',
  rugby: '🏉',
  sports_us: '🏈',
};

export function VIPPredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const hasAccess = profile?.is_vip || profile?.is_admin;

  useEffect(() => {
    if (hasAccess) {
      loadVIPPredictions();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const loadVIPPredictions = async () => {
    try {
      const { data: predData, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('is_public', false)
        .eq('status', 'pending')
        .order('created_at', { ascending: false});

      if (predError) throw predError;

      const predictionsWithMatches: PredictionWithMatches[] = [];
      for (const pred of predData || []) {
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .eq('prediction_id', pred.id)
          .order('match_date');

        predictionsWithMatches.push({
          ...pred,
          matches: matchData || [],
        });
      }

      setPredictions(predictionsWithMatches);
    } catch (error) {
      console.error('Error loading VIP predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePrediction = async (predictionId: string, won: boolean) => {
    if (!profile?.is_admin) return;

    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) return;

    const profit = won
      ? Number(prediction.stake) * Number(prediction.total_odds) - Number(prediction.stake)
      : -Number(prediction.stake);

    try {
      const { error: predError } = await supabase
        .from('predictions')
        .update({
          status: won ? 'won' : 'lost',
          profit,
          validated_at: new Date().toISOString(),
        })
        .eq('id', predictionId);

      if (predError) throw predError;

      const { data: bankrollData, error: bankrollFetchError } = await supabase
        .from('bankroll')
        .select('*')
        .single();

      if (bankrollFetchError) throw bankrollFetchError;

      const newBalance = bankrollData.balance + profit;
      const newTotalProfit = won
        ? bankrollData.total_profit + profit
        : bankrollData.total_profit;
      const newTotalLoss = won
        ? bankrollData.total_loss
        : bankrollData.total_loss + Math.abs(profit);
      const newWonCount = won ? bankrollData.won_count + 1 : bankrollData.won_count;
      const newLostCount = won ? bankrollData.lost_count : bankrollData.lost_count + 1;

      const { error: bankrollUpdateError } = await supabase
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

      if (bankrollUpdateError) throw bankrollUpdateError;

      loadVIPPredictions();
    } catch (error) {
      console.error('Error validating prediction:', error);
    }
  };

  const togglePublicStatus = async (predictionId: string) => {
    if (!profile?.is_admin) return;

    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) return;

    try {
      const { error } = await supabase
        .from('predictions')
        .update({ is_public: !prediction.is_public })
        .eq('id', predictionId);

      if (error) throw error;
      loadVIPPredictions();
    } catch (error) {
      console.error('Error toggling public status:', error);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-yellow-900/20 to-emerald-900/20 rounded-xl p-8 border-2 border-yellow-600 text-center">
            <Lock className="mx-auto text-yellow-600 mb-4" size={56} />
            <h1 className="text-3xl font-bold text-white mb-3">
              Zone VIP Exclusive
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Cette section est réservée aux membres VIP
            </p>
            <div className="bg-black/50 rounded-lg p-6 mb-6 border border-emerald-700">
              <h3 className="text-xl font-bold text-yellow-600 mb-3">Avantages VIP</h3>
              <ul className="space-y-2 text-left text-gray-300">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">✓</span>
                  <span>Accès à toutes les prédictions exclusives</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">✓</span>
                  <span>Analyses détaillées des matchs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">✓</span>
                  <span>Support prioritaire</span>
                </li>
              </ul>
            </div>
            <a
              href="https://t.me/oraclebetsports"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-lg transition-all"
            >
              Devenir Membre VIP
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-4 px-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <Crown className="text-yellow-600" size={28} />
          <h1 className="text-2xl font-bold text-white uppercase">Paris VIP</h1>
        </div>

        {predictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                className="bg-black rounded-lg p-3 border-2 border-yellow-600"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-600 text-black text-xs px-2 py-1 rounded font-bold">
                      VIP
                    </span>
                    <span className="text-xs text-gray-400">
                      {prediction.type === 'simple' ? 'Simple' : 'Combiné'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(prediction.created_at).toLocaleDateString('fr-FR')}
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
                            <div className="text-xs text-emerald-500 font-medium">{match.bet_type}</div>
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
                      <span className="text-gray-400">Cote totale: </span>
                      <span className="text-yellow-600 font-bold">{Number(prediction.total_odds).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Mise: </span>
                      <span className="text-white font-bold">{Number(prediction.stake).toFixed(2)}€</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Gain: </span>
                      <span className="text-emerald-500 font-bold">
                        {(Number(prediction.stake) * Number(prediction.total_odds)).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>

                {profile?.is_admin && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-800">
                    <button
                      onClick={() => validatePrediction(prediction.id, true)}
                      className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      <Check size={14} />
                      <span>Gagné</span>
                    </button>
                    <button
                      onClick={() => validatePrediction(prediction.id, false)}
                      className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      <X size={14} />
                      <span>Perdu</span>
                    </button>
                    <button
                      onClick={() => togglePublicStatus(prediction.id)}
                      className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                      {prediction.is_public ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{prediction.is_public ? 'Public' : 'VIP'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-black rounded-lg p-8 text-center border-2 border-yellow-600">
            <Crown className="mx-auto text-yellow-600 mb-4" size={48} />
            <p className="text-gray-400">Aucun pari VIP en cours</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
