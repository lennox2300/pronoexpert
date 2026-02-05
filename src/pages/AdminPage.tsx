import { useState, useEffect } from 'react';
import { Plus, Check, X, Eye, EyeOff, Trash2, Archive, Users, UserPlus } from 'lucide-react';
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
  team1: string;
  team2: string;
  bet_type: string;
  odds: number;
  match_date: string;
}

const SPORT_ICONS: Record<string, string> = {
  football: '⚽',
  tennis: '🎾',
  basketball: '🏀',
  hockey: '🏒',
  rugby: '🏉',
  sports_us: '🏈',
};

interface User {
  id: string;
  email: string;
  is_vip: boolean;
  is_admin: boolean;
  created_at: string;
}

export function AdminPage() {
  const { profile } = useAuth();
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [type, setType] = useState<'simple' | 'combined'>('simple');
  const [stake, setStake] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [matches, setMatches] = useState<MatchInput[]>([
    {
      sport: 'football',
      team1: '',
      team2: '',
      bet_type: '',
      odds: 1,
      match_date: new Date().toISOString().split('T')[0],
    },
  ]);
  const [showUserSection, setShowUserSection] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsVip, setNewUserIsVip] = useState(false);

  useEffect(() => {
    if (profile?.is_admin) {
      loadPredictions();
      if (showUserSection) {
        loadUsers();
      }
    }
  }, [profile, showUserSection]);

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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, is_vip, is_admin, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Erreur lors du chargement des utilisateurs');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('Session expirée, veuillez vous reconnecter');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_vip_user`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          isVip: newUserIsVip,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      alert(`✅ Utilisateur créé avec succès !\n\nEmail: ${newUserEmail}\nMot de passe: ${newUserPassword}\nVIP: ${newUserIsVip ? 'Oui' : 'Non'}`);

      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserIsVip(false);
      setShowCreateUserForm(false);
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleToggleVip = async (userId: string, currentVipStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_vip: !currentVipStatus })
        .eq('id', userId);

      if (error) throw error;

      alert(`✅ Statut VIP ${!currentVipStatus ? 'activé' : 'désactivé'} !`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling VIP status:', error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const addMatch = () => {
    setMatches([
      ...matches,
      {
        sport: 'football',
        team1: '',
        team2: '',
        bet_type: '',
        odds: 1,
        match_date: new Date().toISOString().split('T')[0],
      },
    ]);
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

    if (!profile?.id) {
      alert('Erreur : Vous devez être connecté en tant qu\'admin');
      return;
    }

    try {
      const totalOdds = calculateTotalOdds();

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

      if (predError) {
        console.error('Erreur prédiction:', predError);
        alert(`Erreur lors de la création de la prédiction: ${predError.message}`);
        return;
      }

      const matchesData = matches.map((match) => ({
        prediction_id: predData.id,
        sport: match.sport,
        team1: match.team1,
        team2: match.team2,
        bet_type: match.bet_type,
        odds: match.odds,
        match_date: new Date(match.match_date).toISOString(),
      }));

      const { error: matchError } = await supabase.from('matches').insert(matchesData);

      if (matchError) {
        console.error('Erreur matches:', matchError);
        alert(`Erreur lors de l'ajout des matchs: ${matchError.message}`);
        return;
      }

      alert('✅ Prédiction créée avec succès !');
      setShowCreateForm(false);
      setStake('');
      setMatches([
        {
          sport: 'football',
          team1: '',
          team2: '',
          bet_type: '',
          odds: 1,
          match_date: new Date().toISOString().split('T')[0],
        },
      ]);
      loadPredictions();
    } catch (error) {
      console.error('Error creating prediction:', error);
      alert(`Erreur inattendue : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleValidatePrediction = async (predictionId: string, won: boolean) => {
    try {
      const prediction = predictions.find((p) => p.id === predictionId);
      if (!prediction) return;

      const profit = won
        ? prediction.stake * prediction.total_odds - prediction.stake
        : -prediction.stake;

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

      alert(`✅ Prédiction validée comme ${won ? 'GAGNÉE' : 'PERDUE'} !`);
      loadPredictions();
    } catch (error) {
      console.error('Error validating prediction:', error);
      alert(`Erreur lors de la validation : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
      alert(`✅ Prédiction mise en ${!prediction.is_public ? 'PUBLIC' : 'VIP'} !`);
      loadPredictions();
    } catch (error) {
      console.error('Error toggling public status:', error);
      alert(`Erreur lors de la mise à jour : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleDeletePrediction = async (predictionId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette prédiction ?')) return;

    try {
      const { error } = await supabase
        .from('predictions')
        .delete()
        .eq('id', predictionId);

      if (error) throw error;
      alert('✅ Prédiction supprimée !');
      loadPredictions();
    } catch (error) {
      console.error('Error deleting prediction:', error);
      alert(`Erreur lors de la suppression : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleArchivePrediction = async (predictionId: string) => {
    if (!confirm('Envoyer cette prédiction vers l\'historique sans validation ?')) return;

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
      alert('✅ Prédiction archivée !');
      loadPredictions();
    } catch (error) {
      console.error('Error archiving prediction:', error);
      alert(`Erreur lors de l'archivage : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Accès non autorisé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Administration</h1>
            <p className="text-gray-400">Gestion du site</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowUserSection(!showUserSection);
                setShowCreateForm(false);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                showUserSection
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <Users size={20} />
              <span>Utilisateurs</span>
            </button>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setShowUserSection(false);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                showCreateForm
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <Plus size={20} />
              <span>Nouvelle prédiction</span>
            </button>
          </div>
        </div>

        {showUserSection && (
          <div className="mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Gestion des utilisateurs</h2>
                <button
                  onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <UserPlus size={18} />
                  <span>Créer utilisateur</span>
                </button>
              </div>

              {showCreateUserForm && (
                <form onSubmit={handleCreateUser} className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Nouvel utilisateur</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Mot de passe</label>
                      <input
                        type="text"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Minimum 6 caractères"
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUserIsVip}
                        onChange={(e) => setNewUserIsVip(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Activer le statut VIP</span>
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Créer l'utilisateur
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateUserForm(false);
                        setNewUserEmail('');
                        setNewUserPassword('');
                        setNewUserIsVip(false);
                      }}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white font-semibold">{user.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.is_admin && (
                        <div className="px-3 py-1 bg-red-600 rounded-lg text-xs text-white font-bold">
                          ADMIN
                        </div>
                      )}
                      <button
                        onClick={() => handleToggleVip(user.id, user.is_vip)}
                        disabled={user.is_admin}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          user.is_vip
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-black'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {user.is_vip ? 'VIP ✓' : 'Rendre VIP'}
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Aucun utilisateur trouvé
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Créer une prédiction</h2>

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
                    <option value="combined">Combiné</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mise (€)</label>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Sport</label>
                      <select
                        value={match.sport}
                        onChange={(e) =>
                          updateMatch(
                            index,
                            'sport',
                            e.target.value as 'football' | 'tennis' | 'basketball' | 'hockey' | 'rugby' | 'sports_us'
                          )
                        }
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="football">⚽ Football</option>
                        <option value="tennis">🎾 Tennis</option>
                        <option value="basketball">🏀 Basketball</option>
                        <option value="hockey">🏒 Hockey</option>
                        <option value="rugby">🏉 Rugby</option>
                        <option value="sports_us">🏈 Sports US</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Équipe/Joueur 1</label>
                      <input
                        type="text"
                        value={match.team1}
                        onChange={(e) => updateMatch(index, 'team1', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Équipe/Joueur 2</label>
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
                  Créer la prédiction
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {!showUserSection && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Prédictions en attente</h2>
          <div className="space-y-4">
            {predictions
              .filter((p) => p.status === 'pending')
              .map((prediction) => (
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
                        {prediction.type === 'simple' ? 'Simple' : 'Combiné'}
                      </div>
                      {!prediction.is_public && (
                        <div className="px-3 py-1 bg-yellow-600 rounded-lg text-sm text-white font-bold">
                          VIP
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleValidatePrediction(prediction.id, true)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Check size={18} />
                        <span>Gagné</span>
                      </button>
                      <button
                        onClick={() => handleValidatePrediction(prediction.id, false)}
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        <X size={18} />
                        <span>Perdu</span>
                      </button>
                      <button
                        onClick={() => handleArchivePrediction(prediction.id)}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {prediction.matches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{SPORT_ICONS[match.sport]}</span>
                            <div>
                              <div className="text-white font-semibold">
                                {match.team1} vs {match.team2}
                              </div>
                              <div className="text-sm text-gray-400">{match.bet_type}</div>
                            </div>
                          </div>
                          <div className="text-yellow-400 font-bold text-lg">
                            {match.odds.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-6 pt-4 border-t border-gray-800">
                    <div>
                      <div className="text-xs text-gray-400">Cote totale</div>
                      <div className="text-yellow-400 font-bold text-lg">
                        {prediction.total_odds.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Mise</div>
                      <div className="text-white font-bold text-lg">
                        {prediction.stake.toFixed(2)}€
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Gain potentiel</div>
                      <div className="text-green-400 font-bold text-lg">
                        {(prediction.stake * prediction.total_odds).toFixed(2)}€
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {predictions.filter((p) => p.status === 'pending').length === 0 && (
              <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
                <p className="text-gray-400">Aucune prédiction en attente</p>
              </div>
            )}
          </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
