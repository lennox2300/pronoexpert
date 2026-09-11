import { useEffect, useState, useCallback, useRef } from 'react';
import { Crown, Users, Ticket, Info, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';
import { TicketCard } from '../components/TicketCard';
import { AutoScrollCarousel } from '../components/AutoScrollCarousel';
type Prediction = Database['public']['Tables']['predictions']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface PredictionWithMatches extends Prediction {
  matches: Match[];
}

interface HomePageProps {
  onPageChange?: (page: string) => void;
}

const TIPSTER_TABS = ['Simple', 'Double', 'Triple', 'Quadri'] as const;
type TipsterTab = typeof TIPSTER_TABS[number];

function ResultAccordion({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-br from-[#1a1a1a] to-black border border-[#2a2a2a] rounded-lg hover:border-[#333] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown className={`text-[#22c55e] flex-shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} size={18} />
          <span className="text-sm font-bold text-[#22c55e] uppercase truncate">{title}</span>
        </div>
        <span className="text-xs text-[#aaa] whitespace-nowrap">({count})</span>
      </button>
      {open && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function getTipsterIndex(prediction: PredictionWithMatches): number {
  const count = prediction.matches.length;
  if (count <= 1) return 0;
  if (count === 2) return 1;
  if (count === 3) return 2;
  return 3;
}

export function HomePage({ onPageChange }: HomePageProps = {}) {
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicCount, setPublicCount] = useState(0);
  const [vipCount, setVipCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [infoCount, setInfoCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TipsterTab>('Simple');
  const [formDots, setFormDots] = useState<PredictionWithMatches[]>([]);
  const { profile } = useAuth();
  const autoSelected = useRef(false);
  const formScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPublicPredictions();
    loadPredictionCounts();
    loadForm();
  }, []);

  useEffect(() => {
    if (!formScrollRef.current) return;
    const container = formScrollRef.current;
    requestAnimationFrame(() => {
      container.scrollLeft = 0;
    });
  }, [formDots]);

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
      const { data: predData } = await supabase
        .from('predictions')
        .select('*')
        .in('status', ['won', 'lost'])
        .order('validated_at', { ascending: false, nullsFirst: false })
        .limit(100);

      const preds = predData || [];
      if (preds.length === 0) {
        setFormDots([]);
        return;
      }

      const predIds = preds.map(p => p.id);
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .in('prediction_id', predIds)
        .order('match_date');

      const matchesByPred = new Map<string, Match[]>();
      for (const m of matchData || []) {
        const arr = matchesByPred.get(m.prediction_id) || [];
        arr.push(m);
        matchesByPred.set(m.prediction_id, arr);
      }

      const withMatches: PredictionWithMatches[] = preds.map(pred => ({
        ...pred,
        matches: matchesByPred.get(pred.id) || [],
      }));

      setFormDots(withMatches);
    } catch {
      setFormDots([]);
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
      const matchDate = prediction.matches.length > 0 ? prediction.matches[0].match_date : new Date().toISOString();
      await supabase.from('predictions').update({
        status: won ? 'won' : 'lost',
        profit,
        validated_at: matchDate,
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
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="text-textmain text-xl">Chargement...</div>
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
    <div className="min-h-screen bg-page py-4 px-3">
      <div className="max-w-7xl mx-auto">
        {/* Stats line - single row */}
        <div className="mb-3 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <h1 className="text-sm font-bold text-white whitespace-nowrap">En cours</h1>
          <div className="flex items-center gap-0.5 whitespace-nowrap">
            <button
              onClick={() => onPageChange?.('home')}
              className="flex items-center gap-1 bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-full px-2.5 py-1 hover:border-[#333] transition-colors cursor-pointer"
            >
              <Users size={13} className="text-[#22c55e]" />
              <span className="text-xs font-semibold text-textmain">{publicCount}</span>
              <span className="text-[11px] text-[#aaa]">public</span>
            </button>
            <button
              onClick={() => onPageChange?.('vip')}
              className="flex items-center gap-1 bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-full px-2.5 py-1 hover:border-[#333] transition-colors cursor-pointer"
            >
              <Crown size={13} className="text-[#22c55e]" />
              <span className="text-xs font-semibold text-textmain">{vipCount}</span>
              <span className="text-[11px] text-[#aaa]">VIP</span>
            </button>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/news?category=prediction');
                onPageChange?.('news');
              }}
              className="flex items-center gap-1 bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-full px-2.5 py-1 hover:border-[#333] transition-colors cursor-pointer"
            >
              <Ticket size={13} className="text-[#22c55e]" />
              <span className="text-xs font-semibold text-textmain">{ticketCount}</span>
              <span className="text-[11px] text-[#aaa]">Ticket</span>
            </button>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/news?category=infos');
                onPageChange?.('news');
              }}
              className="flex items-center gap-1 bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-full px-2.5 py-1 hover:border-[#333] transition-colors cursor-pointer"
            >
              <Info size={13} className="text-[#22c55e]" />
              <span className="text-xs font-semibold text-textmain">{infoCount}</span>
              <span className="text-[11px] text-[#aaa]">Infos</span>
            </button>
          </div>
        </div>

        {/* Tipster tabs - scrollable */}
        <div className="flex items-center gap-0.5 sm:gap-1 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {TIPSTER_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[11px] font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#22c55e]/10 border border-[#22c55e]/25 text-[#22c55e]'
                  : 'bg-[#161616] text-[#666] hover:text-[#e8e8e8] hover:bg-[#1e1e1e] border border-[#2a2a2a]'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? 'bg-black/30 text-[#22c55e]' : 'bg-[#1a1a1a] text-[#666]'
              }`}>
                {tabCounts[i]}
              </span>
              {tabCounts[i] > 0 && (
                <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse-dot flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Form indicator - simple inline dots */}
        {(() => {
          const recent = formDots.slice(0, 16).reverse();
          if (recent.length === 0) return null;
          return (
            <div className="mb-4 -mt-1">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-[10px] text-[#555] uppercase font-semibold whitespace-nowrap">Forme sur les {recent.length} derniers paris</span>
              </div>
              <div className="flex items-center gap-1">
                {recent.map((p) => (
                  <span
                    key={p.id}
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border ${
                      p.status === 'won'
                        ? 'bg-[#22c55e] border-[#22c55e] shadow-sm shadow-[#22c55e]/50'
                        : 'bg-[#ef4444] border-[#ef4444] shadow-sm shadow-[#ef4444]/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })()}

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
          <div className="bg-page rounded-lg p-8 text-center border border-[#2a2a2a] mb-8">
            <p className="text-[#aaa]">Aucun pari en cours dans {activeTab}</p>
          </div>
        )}

        {/* Derniers Resultats - accordion by type, 6 each */}
        {(() => {
          const typeLabels = ['Derniers résultats Simples', 'Derniers résultats Doubles', 'Derniers résultats Triples', 'Derniers résultats Quadri'];
          const groups = [0, 1, 2, 3].map(ti =>
            validatedPredictions
              .filter(p => getTipsterIndex(p) === ti)
              .slice(0, 6)
          );
          const hasAny = groups.some(g => g.length > 0);
          if (!hasAny) return null;
          return (
            <div className="mb-8">
              <h2 className="text-base font-bold text-textmain uppercase mb-3">Derniers Resultats</h2>
              {groups.map((group, gi) =>
                group.length > 0 ? (
                  <ResultAccordion key={gi} title={typeLabels[gi]} count={group.length}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.map((prediction) => (
                        <TicketCard
                          key={prediction.id}
                          prediction={prediction}
                          isAdmin={false}
                          onValidate={validatePrediction}
                          onTogglePublic={togglePublicStatus}
                        />
                      ))}
                    </div>
                    <div className="mt-3 text-center">
                      <button
                        onClick={() => onPageChange?.('stats')}
                        className="text-xs text-[#22c55e] hover:text-[#22c55e]/80 underline"
                      >
                        Voir tout l'historique
                      </button>
                    </div>
                  </ResultAccordion>
                ) : null
              )}
            </div>
          );
        })()}

        <section className="mt-10 mb-6 border-t border-[#2a2a2a] pt-6">
          <h2 className="text-base font-semibold text-[#aaa] mb-2">Pronostics sportifs gratuits et VIP</h2>
          <p className="text-xs text-[#666] leading-relaxed">
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
