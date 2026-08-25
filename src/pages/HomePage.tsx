import { useEffect, useState, useCallback, useRef } from 'react';
import { Crown, Users, Ticket, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';
import { TicketCard } from '../components/TicketCard';
import { AutoScrollCarousel } from '../components/AutoScrollCarousel';
import { WinningTicketCard } from '../components/WinningTicketCard';

type Prediction = Database['public']['Tables']['predictions']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];
type News = Database['public']['Tables']['news']['Row'];

interface PredictionWithMatches extends Prediction {
  matches: Match[];
}

interface HomePageProps {
  onPageChange?: (page: string) => void;
}

const TIPSTER_TABS = ['Pari 1', 'Pari 2', 'Pari 3', 'Pari 4'] as const;
type TipsterTab = typeof TIPSTER_TABS[number];

function getTipsterIndex(prediction: PredictionWithMatches): number {
  const count = prediction.matches.length;
  if (count <= 1) return 0;
  if (count === 2) return 1;
  if (count === 3) return 2;
  return 3;
}

export function HomePage({ onPageChange }: HomePageProps = {}) {
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [winningTickets, setWinningTickets] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicCount, setPublicCount] = useState(0);
  const [vipCount, setVipCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [infoCount, setInfoCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TipsterTab>('Pari 1');
  const [formDots, setFormDots] = useState<Prediction[]>([]);
  const { profile } = useAuth();
  const autoSelected = useRef(false);

  const FORM_MAX = 7;

  useEffect(() => {
    loadPublicPredictions();
    loadPredictionCounts();
    loadWinningTickets();
    loadForm();
  }, []);

  const loadPredictionCounts = async () => {
    const { count: pubCount } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)
      .eq('status', 'pending');

    const { count: vCount } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', false)
      .eq('status', 'pending');

    setPublicCount(pubCount || 0);
    setVipCount(vCount || 0);

    const { count: tCount } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'prediction')
      .eq('status', 'pending');
    setTicketCount(tCount || 0);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: iCount } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true })
      .in('category', ['infos', 'article'])
      .eq('is_public', true)
      .gt('created_at', twentyFourHoursAgo);
    setInfoCount(iCount || 0);
  };

  const loadPublicPredictions = async () => {
    try {
      const { data: predData, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (predError) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      const preds = predData || [];
      if (preds.length === 0) {
        setPredictions([]);
        setLoading(false);
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
      if (!autoSelected.current && predictionsWithMatches.length > 0) {
        autoSelected.current = true;
        const pending = predictionsWithMatches.filter(p => p.status === 'pending');
        for (let i = 0; i < TIPSTER_TABS.length; i++) {
          if (pending.some(p => getTipsterIndex(p) === i)) {
            setActiveTab(TIPSTER_TABS[i]);
            break;
          }
        }
      }
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadForm = async () => {
    try {
      const { count } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true })
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
        .in('status', ['won', 'lost'])
        .order('validated_at', { ascending: false, nullsFirst: false })
        .limit(dotsToShow);

      const sorted = [...(data || [])].reverse();
      setFormDots(sorted);
    } catch {
      setFormDots([]);
    }
  };

  const loadWinningTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('category', 'prediction')
        .eq('status', 'won')
        .order('status_changed_at', { ascending: false, nullsFirst: false })
        .limit(7);

      if (error) return;
      setWinningTickets(data || []);
    } catch {
      setWinningTickets([]);
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

      loadPublicPredictions();
    } catch (error) {
      console.error('Error validating prediction:', error);
    }
  }, [profile, predictions]);

  const togglePublicStatus = useCallback(async (predictionId: string) => {
    if (!profile?.is_admin) return;
    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) return;

    await supabase.from('predictions').update({ is_public: !prediction.is_public }).eq('id', predictionId);
    loadPublicPredictions();
  }, [profile, predictions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  const pendingPredictions = predictions.filter(p => p.status === 'pending');
  const validatedPredictions = predictions.filter(p => p.status !== 'pending');

  const tabCounts = TIPSTER_TABS.map((_, i) =>
    pendingPredictions.filter(p => getTipsterIndex(p) === i).length
  );

  const activeTabIndex = TIPSTER_TABS.indexOf(activeTab);
  const tabPredictions = pendingPredictions.filter(p => getTipsterIndex(p) === activeTabIndex);

  return (
    <div className="min-h-screen bg-black py-4 px-3">
      <div className="max-w-7xl mx-auto">
        {/* Stats line - single row */}
        <div className="mb-3 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <h1 className="text-sm font-bold text-white whitespace-nowrap">En cours</h1>
          <div className="flex items-center gap-0.5 whitespace-nowrap">
            <button
              onClick={() => onPageChange?.('home')}
              className="flex items-center gap-1 bg-gray-900/80 border border-gray-700 rounded-full px-2.5 py-1 hover:border-emerald-600 transition-colors cursor-pointer"
            >
              <Users size={13} className="text-emerald-500" />
              <span className="text-xs font-semibold text-white">{publicCount}</span>
              <span className="text-[11px] text-gray-400">public</span>
            </button>
            <button
              onClick={() => onPageChange?.('vip')}
              className="flex items-center gap-1 bg-gray-900/80 border border-yellow-600/40 rounded-full px-2.5 py-1 hover:border-yellow-500 transition-colors cursor-pointer"
            >
              <Crown size={13} className="text-yellow-500" />
              <span className="text-xs font-semibold text-white">{vipCount}</span>
              <span className="text-[11px] text-gray-400">VIP</span>
            </button>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/news?category=prediction');
                onPageChange?.('news');
              }}
              className="flex items-center gap-1 bg-gray-900/80 border border-emerald-600/40 rounded-full px-2.5 py-1 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <Ticket size={13} className="text-emerald-400" />
              <span className="text-xs font-semibold text-white">{ticketCount}</span>
              <span className="text-[11px] text-gray-400">Ticket VIP</span>
            </button>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/news?category=infos');
                onPageChange?.('news');
              }}
              className="flex items-center gap-1 bg-gray-900/80 border border-yellow-600/40 rounded-full px-2.5 py-1 hover:border-yellow-500 transition-colors cursor-pointer"
            >
              <Info size={13} className="text-yellow-400" />
              <span className="text-xs font-semibold text-white">{infoCount}</span>
              <span className="text-[11px] text-gray-400">Infos</span>
            </button>
          </div>
        </div>

        {/* Tipster tabs */}
        <div className="flex items-center gap-2 mb-4">
          {TIPSTER_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-black/30 text-white' : 'bg-gray-800 text-gray-500'
              }`}>
                {tabCounts[i]}
              </span>
              {tabCounts[i] > 0 && (
                <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Form indicator - 7 dots max */}
        {formDots.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 -mt-2">
            <span className="text-[10px] text-gray-500 uppercase font-semibold whitespace-nowrap">Forme</span>
            <div className="flex items-center gap-1">
              {formDots.map((p, idx) => (
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
              ))}
            </div>
          </div>
        )}

        {/* Predictions for active tab */}
        {tabPredictions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {tabPredictions.map((prediction) => (
              <TicketCard
                key={prediction.id}
                prediction={prediction}
                isAdmin={false}
                onValidate={validatePrediction}
                onTogglePublic={togglePublicStatus}
              />
            ))}
          </div>
        ) : (
          <div className="bg-black rounded-lg p-8 text-center border border-gray-800 mb-8">
            <p className="text-gray-400">Aucun pari en cours dans {activeTab}</p>
          </div>
        )}

        {/* Derniers Tickets - auto-scroll carousel of winning premium tickets */}
        {winningTickets.length > 0 && (
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-base font-bold text-white uppercase">Derniers Tickets</h2>
              <span className="text-[11px] text-gray-500">Tickets gagnants Premium</span>
            </div>
            <AutoScrollCarousel ariaLabel="Derniers tickets gagnants" onItemClick={() => onPageChange?.('vip')}>
              {winningTickets.map((news) => (
                <WinningTicketCard key={news.id} news={news} />
              ))}
            </AutoScrollCarousel>
          </div>
        )}

        {/* Derniers Resultats - grouped by type, 7 each */}
        {(() => {
          const typeLabels = ['Simples', 'Doubles', 'Triples', 'Quadruples'];
          const groups = [0, 1, 2, 3].map(ti =>
            validatedPredictions
              .filter(p => getTipsterIndex(p) === ti)
              .slice(0, 7)
          );
          const hasAny = groups.some(g => g.length > 0);
          if (!hasAny) return null;
          return (
            <div className="mb-8">
              <h2 className="text-base font-bold text-white uppercase mb-3">Derniers Resultats</h2>
              {groups.map((group, gi) =>
                group.length > 0 ? (
                  <div key={gi} className="mb-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase">{typeLabels[gi]}</span>
                      <span className="text-[11px] text-gray-500">{group.length} ticket{group.length > 1 ? 's' : ''}</span>
                    </div>
                    <AutoScrollCarousel ariaLabel={`Derniers resultats ${typeLabels[gi]}`} onItemClick={() => onPageChange?.('stats')}>
                      {group.map((prediction) => (
                        <TicketCard
                          key={prediction.id}
                          prediction={prediction}
                          isAdmin={false}
                          onValidate={validatePrediction}
                          onTogglePublic={togglePublicStatus}
                        />
                      ))}
                    </AutoScrollCarousel>
                  </div>
                ) : null
              )}
            </div>
          );
        })()}

        <section className="mt-10 mb-6 border-t border-gray-800 pt-6">
          <h2 className="text-base font-semibold text-gray-300 mb-2">Pronostics sportifs gratuits et VIP</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Suivez nos pronostics sportifs en temps reel avec un historique transparent et verifiable.
            Football, tennis, basketball, hockey : chaque pari est suivi de A a Z avec mise, cote et resultat.
            Nos pronos du jour sont publies quotidiennement pour la communaute. Rejoignez l'espace VIP pour acceder
            a nos meilleures analyses et combined gagnants. Suivi de bankroll complet et statistiques detaillees.
          </p>
        </section>
      </div>
      <Footer />
    </div>
  );
}
