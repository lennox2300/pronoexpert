import { useState, useEffect } from 'react';
import { Plus, Check, X, Eye, EyeOff, Trash2, Archive, Users, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { Footer } from '../components/Footer';

type Prediction = Database['public']['Tables']['predictions']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];
type User = Database['public']['Tables']['users']['Row'];

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
  match_time: string;
}

const SPORT_ICONS: Record<string, string> = {
  football: '⚽',
  tennis: '🎾',
  basketball: '🏀',
  hockey: '🏒',
  rugby: '🏉',
  sports_us: '🏈',
};

export function AdminPage() {
  const { profile } = useAuth();
  const [predictions, setPredictions] = useState<PredictionWithMatches[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<PredictionWithMatches | null>(null);
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
      match_time: '20:00',
    },
  ]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsVIP, setNewUserIsVIP] = useState(false);
  const [vipDuration, setVipDuration] = useState<30 | 90 | 360>(30);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalVipDuration, setModalVipDuration] = useState<30 | 90 | 360>(30);

  useEffect(() => {
    if (profile?.is_admin) {
      loadPredictions();
      loadUsers();
    }
  }, [profile]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

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
    setMatches([
      ...matches,
      {
        sport: 'football',
        team1: '',
        team2: '',
        bet_type: '',
        odds: 1,
        match_date: new Date().toISOString().split('T')[0],
        match_time: '20:00',
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
      setMatches([
        {
          sport: 'football',
          team1: '',
          team2: '',
          bet_type: '',
          odds: 1,
          match_date: new Date().toISOString().split('T')[0],
          match_time: '20:00',
        },
      ]);
      loadPredictions();
    } catch (error) {
      console.error('Error creating prediction:', error);
      alert('Erreur lors de la création de la prédiction');
    }
  };

  const handleValidatePrediction = async (predictionId: string, won: boolean) => {
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

      const { data: bankrollData, error: bankrollFetchError } = await supabase
        .from('bankroll')
        .select('*')
        .single();

      if (bankrollFetchError) throw bankrollFetchError;

      const currentBalance = Number(bankrollData.balance);
      const newBalance = currentBalance + profit;

      const newTotalProfit = won
        ? Number(bankrollData.total_profit) + profit
        : Number(bankrollData.total_profit);

      const newTotalLoss = won
        ? Number(bankrollData.total_loss)
        : (newBalance < 5000 ? Number(bankrollData.total_loss) + Math.abs(profit) : Number(bankrollData.total_loss));

      const newWonCount = won ? Number(bankrollData.won_count) + 1 : Number(bankrollData.won_count);
      const newLostCount = won ? Number(bankrollData.lost_count) : Number(bankrollData.lost_count) + 1;

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
      alert('Erreur lors de la mise à jour');
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
      loadPredictions();
    } catch (error) {
      console.error('Error deleting prediction:', error);
      alert('Erreur lors de la suppression');
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
      loadPredictions();
    } catch (error) {
      console.error('Error archiving prediction:', error);
      alert('Erreur lors de l\'archivage');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const vipExpiresAt = newUserIsVIP
        ? new Date(Date.now() + vipDuration * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create_user`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          is_vip: newUserIsVIP,
          vip_expires_at: vipExpiresAt,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erreur lors de la création de l\'utilisateur');
      }

      setShowAddUserForm(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserIsVIP(false);
      setVipDuration(30);
      loadUsers();
      alert('Utilisateur créé avec succès');
    } catch (error: any) {
      console.error('Error adding user:', error);
      alert('Erreur lors de la création de l\'utilisateur: ' + error.message);
    }
  };

  const handleToggleVIP = async (userId: string, currentVIPStatus: boolean) => {
    if (currentVIPStatus) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ is_vip: false, vip_expires_at: null })
          .eq('id', userId);

        if (error) throw error;
        loadUsers();
      } catch (error) {
        console.error('Error toggling VIP status:', error);
        alert('Erreur lors de la mise à jour du statut VIP');
      }
    } else {
      setSelectedUserId(userId);
      setShowVIPModal(true);
    }
  };

  const handleConfirmVIP = async () => {
    if (!selectedUserId) return;

    try {
      const vipExpiresAt = new Date(Date.now() + modalVipDuration * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('users')
        .update({ is_vip: true, vip_expires_at: vipExpiresAt })
        .eq('id', selectedUserId);

      if (error) throw error;

      setShowVIPModal(false);
      setSelectedUserId(null);
      setModalVipDuration(30);
      loadUsers();
    } catch (error) {
      console.error('Error updating VIP status:', error);
      alert('Erreur lors de la mise à jour du statut VIP');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleEditPrediction = (prediction: PredictionWithMatches) => {
    setEditingPrediction(prediction);
    setType(prediction.type);
    setStake(Number(prediction.stake).toString());
    setIsPublic(prediction.is_public);

    const formattedMatches = prediction.matches.map((match) => {
      const matchDate = new Date(match.match_date);
      return {
        sport: match.sport,
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
            <p className="text-gray-400">Gestion des prédictions et utilisateurs</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Users size={20} />
              <span>Ajouter utilisateur</span>
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Plus size={20} />
              <span>Nouvelle prédiction</span>
            </button>
          </div>
        </div>

        {showAddUserForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Ajouter un utilisateur</h2>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={newUserIsVIP}
                    onChange={(e) => setNewUserIsVIP(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Statut VIP</span>
                </label>

                {newUserIsVIP && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Durée VIP</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setVipDuration(30)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          vipDuration === 30
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        30 jours
                      </button>
                      <button
                        type="button"
                        onClick={() => setVipDuration(90)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          vipDuration === 90
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        90 jours
                      </button>
                      <button
                        type="button"
                        onClick={() => setVipDuration(360)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          vipDuration === 360
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        360 jours
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Créer l'utilisateur
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserForm(false);
                    setNewUserEmail('');
                    setNewUserPassword('');
                    setNewUserIsVIP(false);
                    setVipDuration(30);
                  }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {showVIPModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-xl max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-white mb-6">Sélectionner la durée VIP</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalVipDuration(30)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      modalVipDuration === 30
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    30 jours
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalVipDuration(90)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      modalVipDuration === 90
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    90 jours
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalVipDuration(360)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      modalVipDuration === 360
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    360 jours
                  </button>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleConfirmVIP}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => {
                      setShowVIPModal(false);
                      setSelectedUserId(null);
                      setModalVipDuration(30);
                    }}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Utilisateurs</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expiration VIP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date création</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">Admin</span>
                        )}
                        {user.is_vip && (
                          <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">VIP</span>
                        )}
                        {!user.is_admin && !user.is_vip && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.is_vip && user.vip_expires_at ? (
                        <div>
                          <div>{new Date(user.vip_expires_at).toLocaleDateString('fr-FR')}</div>
                          <div className="text-xs text-gray-500">
                            ({Math.ceil((new Date(user.vip_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} jours restants)
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        {!user.is_admin && (
                          <button
                            onClick={() => handleToggleVIP(user.id, user.is_vip)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              user.is_vip
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            }`}
                          >
                            {user.is_vip ? 'Retirer VIP' : 'Rendre VIP'}
                          </button>
                        )}
                        {!user.is_admin && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingPrediction ? 'Modifier la prédiction' : 'Créer une prédiction'}
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
                  {editingPrediction ? 'Modifier la prédiction' : 'Créer la prédiction'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPrediction(null);
                    setStake('');
                    setMatches([
                      {
                        sport: 'football',
                        team1: '',
                        team2: '',
                        bet_type: '',
                        odds: 1,
                        match_date: new Date().toISOString().split('T')[0],
                        match_time: '20:00',
                      },
                    ]);
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
                        onClick={() => handleEditPrediction(prediction)}
                        className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Edit size={18} />
                        <span>Modifier</span>
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
                          <div className="text-yellow-400 font-bold text-lg">
                            {Number(match.odds).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

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
                        {Number(prediction.stake).toFixed(2)}€
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Gain potentiel</div>
                      <div className="text-green-400 font-bold text-lg">
                        {(Number(prediction.stake) * Number(prediction.total_odds)).toFixed(2)}€
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
      </div>
      <Footer />
    </div>
  );
}
