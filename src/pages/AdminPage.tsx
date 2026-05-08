import { useState, useEffect } from 'react';
import { Plus, Check, X, Eye, EyeOff, Trash2, Archive, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { Footer } from '../components/Footer';

type Prediction = Database['public']['Tables']['predictions']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface PredictionWithMatches extends Prediction {
  matches: Match[];
}

interface MatchInput {
  sport: 'football' | 'tennis' | 'basketball' | 'hockey' | 'rugby' | 'sports_us';
  competition: string;
  team1: string;
  team2: string;
  bet_type: string;
  odds: number;
  match_date: string;
  match_time: string;
}

const SPORT_ICONS: Record<string, string> = {
  football: '\u26BD',
  tennis: '\uD83C\uDFBE',
  basketball: '\uD83C\uDFC0',
  hockey: '\uD83C\uDFD2',
  rugby: '\uD83C\uDFC9',
  sports_us: '\uD83C\uDFC8',
};

const DEFAULT_MATCH: MatchInput = {
  sport: 'football',
  competition: '',
  team1: '',
  team2: '',
  bet_type: '',
  odds: 1,
  match_date: new Date().toISOString().split('T')[0],
  match_time: '20:00',
};

export function AdminPage() {
  const { profile } = useAuth();
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<PredictionWithMatches | null>(null);
  const [type, setType] = useState<'simple' | 'combined'>('simple');
  const [stake, setStake] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [matches, setMatches] = useState<MatchInput[]>([{ ...DEFAULT_MATCH }]);
  const [validatingPrediction, setValidatingPrediction] = useState<string | null>(null);
  const [matchScores, setMatchScores] = useState<Record<string, string>>({});
  const [matchResults, setMatchResults] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile?.is_admin) {
      loadPredictions();
    }
  }, [profile]);

  const loadPredictions = async () => {
    try {
      const { data: predData, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false });

      if (predError) throw predError;

      const predictionsWithMatches: PredictionWithMatches[] = [];

      for (const pred of predData || []) {
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('prediction_id', pred.id);

        if (matchError) throw matchError;

        predictionsWithMatches.push({
          ...pred,
          matches: matchData || [],
        });
      }

      setPredictions(predictionsWithMatches);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const addMatch = () => {
    setMatches([...matches, { ...DEFAULT_MATCH }]);
  };

  const removeMatch = (index: number) => {
    setMatches(matches.filter((_, i) => i !== index));
  };

  const updateMatch = (index: number, field: keyof MatchInput, value: string | number) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: value };
    setMatches(newMatches);
  };

  const calculateTotalOdds = () => {
    return matches.reduce((total, match) => total * match.odds, 1);
  };

  const handleCreatePrediction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) return;

    try {
      const totalOdds = calculateTotalOdds();

      if (editingPrediction) {
        const { error: predError } = await supabase
          .from('predictions')
          .update({
            type,
            stake: parseFloat(stake),
            total_odds: totalOdds,
            is_public: isPublic,
          })
          .eq('id', editingPrediction.id);

        if (predError) throw predError;

        const { error: deleteError } = await supabase
          .from('matches')
          .delete()
          .eq('prediction_id', editingPrediction.id);

        if (deleteError) throw deleteError;

        const matchesData = matches.map((match) => ({
          prediction_id: editingPrediction.id,
          sport: match.sport,
          competition: match.competition,
          team1: match.team1,
          team2: match.team2,
          bet_type: match.bet_type,
          odds: Number(match.odds),
          match_date: new Date(`${match.match_date}T${match.match_time}`).toISOString(),
        }));

        const { error: matchError } = await supabase.from('matches').insert(matchesData);

        if (matchError) throw matchError;
      } else {
        const { data: predData, error: predError } = await supabase
          .from('predictions')
          .insert({
            user_id: profile.id,
            type,
            stake: parseFloat(stake),
            total_odds: totalOdds,
            is_public: isPublic,
            status: 'pending',
          })
          .select()
          .single();

        if (predError) throw predError;

        const matchesData = matches.map((match) => ({
          prediction_id: predData.id,
          sport: match.sport,
          competition: match.competition,
          team1: match.team1,
          team2: match.team2,
          bet_type: match.bet_type,
          odds: Number(match.odds),
          match_date: new Date(`${match.match_date}T${match.match_time}`).toISOString(),
        }));

        const { error: matchError } = await supabase.from('matches').insert(matchesData);

        if (matchError) throw matchError;
      }

      setShowCreateForm(false);
      setEditingPrediction(null);
      setStake('');
      setMatches([{ ...DEFAULT_MATCH }]);
      loadPredictions();
    } catch (error) {
      console.error('Error creating prediction:', error);
      alert('Erreur lors de la creation de la prediction');
    }
  };

  const startValidation = (predictionId: string) => {
    const prediction = predictions.find((p) => p.id === predictionId);
    if (!prediction) return;

    const scores: Record<string, string> = {};
    const results: Record<string, string> = {};
    for (const match of prediction.matches) {
      scores[match.id] = match.score || '';
      results[match.id] = match.result || 'pending';
    }
    setMatchScores(scores);
    setMatchResults(results);
    setValidatingPrediction(predictionId);
  };

  const handleValidateMatch = async (matchId: string, result: 'won' | 'lost') => {
    setMatchResults((prev) => ({ ...prev, [matchId]: result }));

    await supabase
      .from('matches')
      .update({
        result,
        score: matchScores[matchId] || '',
      })
      .eq('id', matchId);
  };

  const handleUpdateMatchScore = async (matchId: string, score: string) => {
    setMatchScores((prev) => ({ ...prev, [matchId]: score }));

    await supabase
      .from('matches')
      .update({ score })
      .eq('id', matchId);
  };

  const handleValidateCoupon = async (predictionId: string, won: boolean) => {
    try {
      const prediction = predictions.find((p) => p.id === predictionId);
      if (!prediction) return;

      const profit = won
        ? Number(prediction.stake) * Number(prediction.total_odds) - Number(prediction.stake)
        : -Number(prediction.stake);

      const { error: predError } = await supabase
        .from('predictions')
        .update({
          status: won ? 'won' : 'lost',
          profit,
          validated_at: new Date().toISOString(),
        })
        .eq('id', predictionId);

      if (predError) throw predError;

      await recalculateBankroll();
      setValidatingPrediction(null);
      loadPredictions();
    } catch (error) {
      console.error('Error validating prediction:', error);
      alert('Erreur lors de la validation');
    }
  };

  const handleTogglePublic = async (predictionId: string) => {
    try {
      const prediction = predictions.find((p) => p.id === predictionId);
      if (!prediction) return;

      const { error } = await supabase
        .from('predictions')
        .update({ is_public: !prediction.is_public })
        .eq('id', predictionId);

      if (error) throw error;
      loadPredictions();
    } catch (error) {
      console.error('Error toggling public status:', error);
      alert('Erreur lors de la mise a jour');
    }
  };

  const recalculateBankroll = async () => {
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

    const { data: bankrollData } = await supabase
      .from('bankroll')
      .select('id')
      .maybeSingle();

    if (bankrollData) {
      await supabase
        .from('bankroll')
        .update({
          balance: newBalance,
          total_profit: newBalance - 5000,
          total_loss: newTotalLoss,
          won_count: newWonCount,
          lost_count: newLostCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankrollData.id);
    }
  };

  const handleDeletePrediction = async (predictionId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette prediction ?')) return;

    try {
      await supabase.from('matches').delete().eq('prediction_id', predictionId);
      const { error } = await supabase
        .from('predictions')
        .delete()
        .eq('id', predictionId);

      if (error) throw error;
      await recalculateBankroll();
      loadPredictions();
    } catch (error) {
      console.error('Error deleting prediction:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleArchivePrediction = async (predictionId: string) => {
    if (!confirm('Envoyer cette prediction vers l\'historique sans validation ?')) return;

    try {
      const { error } = await supabase
        .from('predictions')
        .update({
          status: 'lost',
          profit: 0,
          validated_at: new Date().toISOString(),
        })
        .eq('id', predictionId);

      if (error) throw error;
      await recalculateBankroll();
      loadPredictions();
    } catch (error) {
      console.error('Error archiving prediction:', error);
      alert('Erreur lors de l\'archivage');
    }
  };

  const handleEditPrediction = (prediction: PredictionWithMatches) => {
    setEditingPrediction(prediction);
    setType(prediction.type);
    setStake(Number(prediction.stake).toString());
    setIsPublic(prediction.is_public);

    const formattedMatches: MatchInput[] = prediction.matches.map((match) => {
      const matchDate = new Date(match.match_date);
      return {
        sport: match.sport as MatchInput['sport'],
        competition: match.competition || '',
        team1: match.team1,
        team2: match.team2,
        bet_type: match.bet_type,
        odds: Number(match.odds),
        match_date: matchDate.toISOString().split('T')[0],
        match_time: matchDate.toTimeString().slice(0, 5),
      };
    });

    setMatches(formattedMatches);
    setShowCreateForm(true);
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Acces non autorise</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion des predictions</h1>
            <p className="text-gray-400">Creer, valider et gerer les pronostics</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            <span>Nouvelle prediction</span>
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingPrediction ? 'Modifier la prediction' : 'Creer une prediction'}
            </h2>

            <form onSubmit={handleCreatePrediction} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'simple' | 'combined')}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="simple">Simple</option>
                    <option value="combined">Combine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mise (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-300">Public</span>
                  </label>
                </div>
              </div>

              {matches.map((match, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Match {index + 1}</h3>
                    {matches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMatch(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Sport</label>
                      <select
                        value={match.sport}
                        onChange={(e) =>
                          updateMatch(index, 'sport', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="football">{SPORT_ICONS.football} Football</option>
                        <option value="tennis">{SPORT_ICONS.tennis} Tennis</option>
                        <option value="basketball">{SPORT_ICONS.basketball} Basketball</option>
                        <option value="hockey">{SPORT_ICONS.hockey} Hockey</option>
                        <option value="rugby">{SPORT_ICONS.rugby} Rugby</option>
                        <option value="sports_us">{SPORT_ICONS.sports_us} Sports US</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Competition</label>
                      <input
                        type="text"
                        value={match.competition}
                        onChange={(e) => updateMatch(index, 'competition', e.target.value)}
                        placeholder="Liga, Serie A, Ligue 1..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Equipe/Joueur 1</label>
                      <input
                        type="text"
                        value={match.team1}
                        onChange={(e) => updateMatch(index, 'team1', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Equipe/Joueur 2</label>
                      <input
                        type="text"
                        value={match.team2}
                        onChange={(e) => updateMatch(index, 'team2', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Type de pari</label>
                      <input
                        type="text"
                        value={match.bet_type}
                        onChange={(e) => updateMatch(index, 'bet_type', e.target.value)}
                        placeholder="ex: 1X2, Over/Under..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Cote</label>
                      <input
                        type="number"
                        step="0.01"
                        value={match.odds}
                        onChange={(e) => updateMatch(index, 'odds', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Date du match</label>
                      <input
                        type="date"
                        value={match.match_date}
                        onChange={(e) => updateMatch(index, 'match_date', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Heure du match</label>
                      <input
                        type="time"
                        value={match.match_time}
                        onChange={(e) => updateMatch(index, 'match_time', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addMatch}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
              >
                + Ajouter un match
              </button>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">Cote totale</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {calculateTotalOdds().toFixed(2)}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {editingPrediction ? 'Modifier la prediction' : 'Creer la prediction'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPrediction(null);
                    setStake('');
                    setMatches([{ ...DEFAULT_MATCH }]);
                  }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Predictions en attente</h2>
          <div className="space-y-4">
            {predictions
              .filter((p) => p.status === 'pending')
              .map((prediction) => {
                const isValidating = validatingPrediction === prediction.id;

                return (
                <div
                  key={prediction.id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="px-3 py-1 bg-yellow-600 rounded-lg text-sm text-white font-bold">
                        En attente
                      </div>
                      <div className="px-3 py-1 bg-gray-800 rounded-lg text-sm text-gray-300">
                        {prediction.type === 'simple' ? 'Simple' : 'Combine'}
                      </div>
                      {!prediction.is_public && (
                        <div className="px-3 py-1 bg-yellow-600 rounded-lg text-sm text-white font-bold">
                          VIP
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {!isValidating && (
                        <>
                          <button
                            onClick={() => startValidation(prediction.id)}
                            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border-2 border-emerald-400"
                          >
                            <Check size={18} />
                            <span>Valider les matchs</span>
                          </button>
                          <button
                            onClick={() => handleEditPrediction(prediction)}
                            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            <Edit size={18} />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => handleArchivePrediction(prediction.id)}
                            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            <Archive size={18} />
                            <span>Archiver</span>
                          </button>
                          <button
                            onClick={() => handleTogglePublic(prediction.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                              prediction.is_public
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            }`}
                          >
                            {prediction.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                            <span>{prediction.is_public ? 'Public' : 'VIP'}</span>
                          </button>
                          <button
                            onClick={() => handleDeletePrediction(prediction.id)}
                            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            <Trash2 size={18} />
                            <span>Supprimer</span>
                          </button>
                        </>
                      )}
                      {isValidating && (
                        <button
                          onClick={() => setValidatingPrediction(null)}
                          className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          <X size={18} />
                          <span>Annuler validation</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {prediction.matches.map((match) => (
                      <div
                        key={match.id}
                        className={`bg-gray-800 rounded-lg p-4 border ${
                          isValidating && matchResults[match.id] === 'won'
                            ? 'border-green-500'
                            : isValidating && matchResults[match.id] === 'lost'
                            ? 'border-red-500'
                            : 'border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{SPORT_ICONS[match.sport]}</span>
                            <div>
                              <div className="text-white font-semibold">
                                {match.team1} vs {match.team2}
                              </div>
                              <div className="flex items-center space-x-2">
                                {match.competition && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                                    {match.competition}
                                  </span>
                                )}
                                <span className="text-sm text-gray-400">{match.bet_type}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(match.match_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })} a {new Date(match.match_date).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="text-yellow-400 font-bold text-lg">
                            {Number(match.odds).toFixed(2)}
                          </div>
                        </div>

                        {isValidating && (
                          <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-400">Score:</label>
                              <input
                                type="text"
                                value={matchScores[match.id] || ''}
                                onChange={(e) => handleUpdateMatchScore(match.id, e.target.value)}
                                placeholder="2-1"
                                className="w-20 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleValidateMatch(match.id, 'won')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                                  matchResults[match.id] === 'won'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-700 hover:bg-green-700 text-gray-300'
                                }`}
                              >
                                <Check size={14} />
                                <span>Gagne</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleValidateMatch(match.id, 'lost')}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                                  matchResults[match.id] === 'lost'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-700 hover:bg-red-700 text-gray-300'
                                }`}
                              >
                                <X size={14} />
                                <span>Perdu</span>
                              </button>
                            </div>
                            {matchResults[match.id] && matchResults[match.id] !== 'pending' && (
                              <span className={`text-xs font-bold ${
                                matchResults[match.id] === 'won' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {matchResults[match.id] === 'won' ? 'GAGNE' : 'PERDU'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isValidating && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-blue-600 mb-4">
                      <p className="text-sm text-gray-300 mb-3">
                        Validez chaque match individuellement, puis validez le coupon :
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleValidateCoupon(prediction.id, true)}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Check size={18} />
                          <span>Coupon GAGNE</span>
                        </button>
                        <button
                          onClick={() => handleValidateCoupon(prediction.id, false)}
                          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <X size={18} />
                          <span>Coupon PERDU</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-6 pt-4 border-t border-gray-800">
                    <div>
                      <div className="text-xs text-gray-400">Cote totale</div>
                      <div className="text-yellow-400 font-bold text-lg">
                        {Number(prediction.total_odds).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Mise</div>
                      <div className="text-white font-bold text-lg">
                        {Number(prediction.stake).toFixed(2)}EUR
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Gain potentiel</div>
                      <div className="text-green-400 font-bold text-lg">
                        {(Number(prediction.stake) * Number(prediction.total_odds)).toFixed(2)}EUR
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            {predictions.filter((p) => p.status === 'pending').length === 0 && (
              <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
                <p className="text-gray-400">Aucune prediction en attente</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
