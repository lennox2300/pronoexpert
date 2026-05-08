import { useState, useEffect } from 'react';
import { Check, X, Users, Crown, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { Footer } from '../components/Footer';

type User = Database['public']['Tables']['users']['Row'];

interface VIPRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at: string | null;
}

export function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [vipRequests, setVipRequests] = useState<VIPRequest[]>([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsVIP, setNewUserIsVIP] = useState(false);
  const [vipDuration, setVipDuration] = useState<30 | 90 | 360>(30);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalVipDuration, setModalVipDuration] = useState<30 | 90 | 360>(30);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin) {
      loadUsers();
    }
  }, [profile]);

  useEffect(() => {
    if (users.length > 0 && profile?.is_admin) {
      loadVipRequests();
    }
  }, [users]);

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

  const loadVipRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('vip_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVipRequests(data || []);
    } catch (error) {
      console.error('Error loading VIP requests:', error);
    }
  };

  const handleApproveVipRequest = (request: VIPRequest) => {
    setSelectedUserId(request.user_id);
    setPendingRequestId(request.id);
    setShowVIPModal(true);
  };

  const handleRejectVipRequest = async (requestId: string) => {
    try {
      await supabase
        .from('vip_requests')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('id', requestId);

      loadVipRequests();
    } catch (error) {
      console.error('Error rejecting VIP request:', error);
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
      setPendingRequestId(null);
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

      if (pendingRequestId) {
        await supabase
          .from('vip_requests')
          .update({ status: 'approved', processed_at: new Date().toISOString() })
          .eq('id', pendingRequestId);
      } else {
        await supabase
          .from('vip_requests')
          .update({ status: 'approved', processed_at: new Date().toISOString() })
          .eq('user_id', selectedUserId)
          .eq('status', 'pending');
      }

      setShowVIPModal(false);
      setSelectedUserId(null);
      setPendingRequestId(null);
      setModalVipDuration(30);
      loadUsers();
      loadVipRequests();
    } catch (error) {
      console.error('Error updating VIP status:', error);
      alert('Erreur lors de la mise à jour du statut VIP');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_user`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression de l\'utilisateur: ' + error.message);
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
            <h1 className="text-3xl font-bold text-white mb-2">Gestion des utilisateurs</h1>
            <p className="text-gray-400">Ajouter, modifier et gérer les membres</p>
          </div>
          <button
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Users size={20} />
            <span>Ajouter utilisateur</span>
          </button>
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
                      setPendingRequestId(null);
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

        {vipRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Crown className="text-yellow-500" size={24} />
              Demandes VIP
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">{vipRequests.length}</span>
            </h2>
            <div className="bg-gray-900 rounded-xl border border-yellow-700/50 overflow-hidden">
              <div className="divide-y divide-gray-800">
                {vipRequests.map((request) => {
                  const requestUser = users.find((u) => u.id === request.user_id);
                  return (
                    <div key={request.id} className="flex items-center justify-between p-4 hover:bg-gray-800/50">
                      <div>
                        <p className="text-white font-medium">{requestUser?.email || 'Utilisateur inconnu'}</p>
                        <p className="text-gray-400 text-sm">
                          Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')} à {new Date(request.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveVipRequest(request)}
                          className="flex items-center gap-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Check size={16} />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRejectVipRequest(request.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          <X size={16} />
                          Refuser
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12} />
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
      </div>
      <Footer />
    </div>
  );
}
