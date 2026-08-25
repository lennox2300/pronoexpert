import { useEffect, useState, useCallback, useRef } from 'react';
import { Crown, Lock, ChevronDown, ChevronRight } from 'lucide-react';
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

const TIPSTER_TABS = ['Pari 1', 'Pari 2', 'Pari 3', 'Pari 4'] as const;
type TipsterTab = typeof TIPSTER_TABS[number];

const FORM_MAX = 7;

function getTipsterIndex(prediction: PredictionWithMatches): number {
  const count = prediction.matches.length;
  if (count <= 1) return 0;
  if (count === 2) return 1;
  if (count === 3) return 2;
  return 3;
}

function groupByMonth(predictions: PredictionWithMatches[]) {
  const groups: { [key: string]: PredictionWithMatches[] } = {};
  predictions.forEach(pred => {
    const date = new Date(pred.validated_at || pred.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(pred);
  });
  return groups;
}

function formatMonthYear(monthKey: string) {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function VIPPredictionsPage({ onPageChange }: { onPageChange?: (p: string) => void }) {
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [formDots, setFormDots] = useState<Prediction[]>([]);
  const [validatedHistory, setValidatedHistory] = useState<PredictionWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModeEnabled, setPaymentModeEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<TipsterTab>('Pari 1');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const { profile } = useAuth();
  const autoSelected = useRef(false);

  const hasAccess = profile?.is_vip || profile?.is_admin;

  useEffect(() => {
    supabase
      .from('monetisation_config')
      .select('payment_mode_enabled')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()
      .then(({ data }) => { if (data?.payment_mode_enabled) setPaymentModeEnabled(true); });
    if (hasAccess) {
      loadVIPPredictions();
      loadForm();
      loadHistory();
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
        .order('created_at', { ascending: false });

      if (predError) throw predError;

      const predictionsWithMatches: PredictionWithMatches[] = [];
      for (const pred of predData || []) {
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .eq('prediction_id', pred.id)
          .order('match_date');

        predictionsWithMatches.push({ ...pred, matches: matchData || [] });
      }

      setPredictions(predictionsWithMatches);
      if (!autoSelected.current && predictionsWithMatches.length > 0) {
        autoSelected.current = true;
        for (let i = 0; i < TIPSTER_TABS.length; i++) {
          if (predictionsWithMatches.some(p => getTipsterIndex(p) === i)) {
            setActiveTab(TIPSTER_TABS[i]);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error loading VIP predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadForm = async () => {
    try {
      const { count } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', false)
        .in('status', ['won', 'lost']);

      const total = count || 0;
      const dotsToShow = total === 0 ? 0 : (total % FORM_MAX === 0 ? FORM_MAX : total % FORM_MAX);

      if (dotsToShow === 0) {
        setFormDots([]);
        return;
      }

      const { data } = await supabase
        .from('predictions')
        .select('*')
        .eq('is_public', false)
        .in('status', ['won', 'lost'])
        .order('validated_at', { ascending: false, nullsFirst: false })
        .limit(dotsToShow);

      const sorted = [...(data || [])].reverse();
      setFormDots(sorted);
    } catch {
      setFormDots([]);
    }
  };

  const loadHistory = async () => {
    try {
      const { data: predData, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('is_public', false)
        .neq('status', 'pending')
        .order('validated_at', { ascending: false, nullsFirst: false });

      if (error) return;

      const withMatches: PredictionWithMatches[] = [];
      for (const pred of predData || []) {
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .eq('prediction_id', pred.id)
          .order('match_date');
        withMatches.push({ ...pred, matches: matchData || [] });
      }

      setValidatedHistory(withMatches);

      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setExpandedMonths(new Set([currentMonthKey]));
    } catch {
      setValidatedHistory([]);
    }
  };

  const validatePrediction = useCallback(async (predictionId: string, won: boolean) => {
    if (!profile?.is_admin) return;
    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) return;

    const profit = won
      ? Number(prediction.stake) * Number(prediction.total_odds) - Number(prediction.stake)
      : -Number(prediction.stake);

    try {
      await supabase.from('predictions').update({
        status: won ? 'won' : 'lost',
        profit,
        validated_at: new Date().toISOString(),
      }).eq('id', predictionId);

      const { data: bankrollData } = await supabase.from('bankroll').select('*').single();
      if (bankrollData) {
        await supabase.from('bankroll').update({
          balance: bankrollData.balance + profit,
          total_profit: won ? bankrollData.total_profit + profit : bankrollData.total_profit,
          total_loss: won ? bankrollData.total_loss : bankrollData.total_loss + Math.abs(profit),
          won_count: won ? bankrollData.won_count + 1 : bankrollData.won_count,
          lost_count: won ? bankrollData.lost_count : bankrollData.lost_count + 1,
          updated_at: new Date().toISOString(),
        }).eq('id', bankrollData.id);
      }

      loadVIPPredictions();
      loadForm();
      loadHistory();
    } catch (error) {
      console.error('Error validating prediction:', error);
    }
  }, [profile, predictions]);

  const togglePublicStatus = useCallback(async (predictionId: string) => {
    if (!profile?.is_admin) return;
    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) return;

    await supabase.from('predictions').update({ is_public: !prediction.is_public }).eq('id', predictionId);
    loadVIPPredictions();
  }, [profile, predictions]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-yellow-900/20 to-emerald-900/20 rounded-xl p-8 border-2 border-yellow-600 text-center">
            <Lock className="mx-auto text-yellow-600 mb-4" size={56} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Zone VIP Exclusive</h1>
            <p className="text-base sm:text-lg text-gray-300 mb-6">Cette section est reserveee aux membres VIP</p>
            <div className="bg-black/50 rounded-lg p-6 mb-6 border border-emerald-700">
              <h3 className="text-xl font-bold text-yellow-600 mb-3">Avantages VIP</h3>
              <ul className="space-y-2 text-left text-gray-300">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">✓</span>
                  <span>Acces a toutes les predictions exclusives</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">✓</span>
                  <span>Analyses detaillees des matchs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">✓</span>
                  <span>Support prioritaire</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => {
                const target = paymentModeEnabled ? 'abonnement' : 'joinvip';
                onPageChange?.(target);
                window.history.pushState({}, '', `/${target}`);
              }}
              className="inline-block px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-lg transition-all"
            >
              Devenir Membre VIP
            </button>
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

  const tabCounts = TIPSTER_TABS.map((_, i) =>
    predictions.filter(p => getTipsterIndex(p) === i).length
  );

  const activeTabIndex = TIPSTER_TABS.indexOf(activeTab);
  const tabPredictions = predictions.filter(p => getTipsterIndex(p) === activeTabIndex);

  const grouped = groupByMonth(validatedHistory);
  const sortedMonthKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-black pt-12 pb-4 px-3">
      <div className="max-w-7xl mx-auto">
        {/* Title - responsive */}
        <div className="flex items-center gap-2 mb-3">
          <Crown className="text-yellow-600 flex-shrink-0" size={20} />
          <h1 className="text-base sm:text-2xl font-bold text-white uppercase">VIP</h1>
        </div>

        {/* Form indicator - 7 dots max */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[10px] text-gray-500 uppercase font-semibold whitespace-nowrap">Forme</span>
          <div className="flex items-center gap-1">
            {formDots.length > 0 ? (
              formDots.map((p, idx) => (
                <span
                  key={p.id}
                  title={p.status === 'won' ? 'Gagné' : 'Perdu'}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-[fadeIn_0.3s_ease-out_both] ${
                    p.status === 'won'
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      : 'bg-red-500 shadow-sm shadow-red-500/50'
                  }`}
                />
              ))
            ) : (
              <span className="text-[10px] text-gray-600">Aucun resultat encore</span>
            )}
          </div>
        </div>

        {/* Tipster tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {TIPSTER_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/30'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-black/20 text-black' : 'bg-gray-800 text-gray-500'
              }`}>
                {tabCounts[i]}
              </span>
              {tabCounts[i] > 0 && (
                <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse-dot flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Predictions for active tab */}
        {tabPredictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {tabPredictions.map((prediction) => (
              <TicketCard
                key={prediction.id}
                prediction={prediction}
                isAdmin={profile?.is_admin}
                onValidate={validatePrediction}
                onTogglePublic={togglePublicStatus}
              />
            ))}
          </div>
        ) : (
          <div className="bg-black rounded-lg p-8 text-center border-2 border-yellow-600 mb-8">
            <Crown className="mx-auto text-yellow-600 mb-4" size={48} />
            <p className="text-gray-400">Aucun pari VIP en cours dans {activeTab}</p>
          </div>
        )}

        {/* Historique - collapsible by month */}
        {sortedMonthKeys.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-white mb-3 uppercase">Historique</h2>
            {sortedMonthKeys.map((monthKey) => {
              const monthPredictions = grouped[monthKey];
              const won = monthPredictions.filter(p => p.status === 'won').length;
              const lost = monthPredictions.filter(p => p.status === 'lost').length;
              const total = monthPredictions.length;
              const isExpanded = expandedMonths.has(monthKey);

              return (
                <div key={monthKey} className="mb-3">
                  <button
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-br from-gray-900 to-black border border-yellow-600/50 rounded-lg hover:border-yellow-500 transition-colors"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {isExpanded
                        ? <ChevronDown className="text-yellow-500 flex-shrink-0" size={18} />
                        : <ChevronRight className="text-yellow-500 flex-shrink-0" size={18} />}
                      <h3 className="text-sm font-bold text-yellow-500 uppercase capitalize truncate">
                        {formatMonthYear(monthKey)}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">({total} tickets)</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-emerald-500">{won}G</span>
                      <span className="text-xs font-semibold text-red-500">{lost}P</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="space-y-3 mt-3">
                      {monthPredictions.map((prediction) => (
                        <TicketCard
                          key={prediction.id}
                          prediction={prediction}
                          isAdmin={false}
                          onValidate={undefined}
                          onTogglePublic={undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
