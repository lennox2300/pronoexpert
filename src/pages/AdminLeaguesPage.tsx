import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Search, Trophy, CreditCard as Edit2, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';
import { LEAGUES } from '../lib/leaguesData';

interface CustomEntry {
  id: string;
  entry_type: 'league' | 'team' | 'bet_type';
  name: string;
  logo_url: string | null;
  competition: string | null;
  sport: string | null;
  created_at: string;
}

const SPORTS = [
  { id: 'football', label: '⚽ Football' },
  { id: 'tennis', label: '🎾 Tennis' },
  { id: 'basketball', label: '🏀 Basketball' },
  { id: 'hockey', label: '🏒 Hockey' },
  { id: 'rugby', label: '🏉 Rugby' },
  { id: 'sports_us', label: '🏈 Sports US' },
  { id: 'boxing', label: '🥊 Boxe' },
  { id: 'mma', label: '🥋 MMA / UFC' },
  { id: 'golf', label: '⛳ Golf' },
  { id: 'volleyball', label: '🏐 Volley' },
  { id: 'handball', label: '🤾 Handball' },
  { id: 'baseball', label: '⚾ Baseball' },
  { id: 'cycling', label: '🚴 Cyclisme' },
];

export function AdminLeaguesPage() {
  const { profile } = useAuth();
  const [leagues, setLeagues] = useState<CustomEntry[]>([]);
  const [teams, setTeams] = useState<CustomEntry[]>([]);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('all');

  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueLogo, setNewLeagueLogo] = useState('');
  const [newLeagueSport, setNewLeagueSport] = useState('football');

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('');
  const [newTeamLeague, setNewTeamLeague] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogo, setEditLogo] = useState('');

  const [showLeagueForm, setShowLeagueForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [leaguesRes, teamsRes] = await Promise.all([
      supabase.from('custom_entries').select('*').eq('entry_type', 'league').order('name'),
      supabase.from('custom_entries').select('*').eq('entry_type', 'team').order('name'),
    ]);
    if (leaguesRes.data) setLeagues(leaguesRes.data as CustomEntry[]);
    if (teamsRes.data) setTeams(teamsRes.data as CustomEntry[]);
  }, []);

  useEffect(() => {
    if (profile?.is_admin) loadData();
  }, [profile, loadData]);

  const addLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLeagueName.trim();
    if (!name) return;
    const { data: existing } = await supabase
      .from('custom_entries')
      .select('id')
      .eq('entry_type', 'league')
      .eq('name', name)
      .maybeSingle();
    if (existing) {
      alert('Ce championnat existe déjà');
      return;
    }
    await supabase.from('custom_entries').insert({
      entry_type: 'league',
      name,
      logo_url: newLeagueLogo.trim() || null,
      sport: newLeagueSport,
    });
    setNewLeagueName('');
    setNewLeagueLogo('');
    setShowLeagueForm(false);
    loadData();
  };

  const addTeam = async (e: React.FormEvent, leagueName: string) => {
    e.preventDefault();
    const name = newTeamName.trim();
    if (!name) return;
    const { data: existing } = await supabase
      .from('custom_entries')
      .select('id')
      .eq('entry_type', 'team')
      .eq('name', name)
      .eq('competition', leagueName)
      .maybeSingle();
    if (existing) {
      alert('Cette équipe existe déjà dans ce championnat');
      return;
    }
    const league = leagues.find(l => l.name === leagueName);
    await supabase.from('custom_entries').insert({
      entry_type: 'team',
      name,
      logo_url: newTeamLogo.trim() || null,
      competition: leagueName,
      sport: league?.sport || null,
    });
    setNewTeamName('');
    setNewTeamLogo('');
    setShowTeamForm(null);
    loadData();
  };

  const deleteLeague = async (id: string, name: string) => {
    if (!confirm(`Supprimer le championnat "${name}" et toutes ses équipes ?`)) return;
    await supabase.from('custom_entries').delete().eq('id', id);
    await supabase.from('custom_entries').delete().eq('entry_type', 'team').eq('competition', name);
    loadData();
  };

  const deleteTeam = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'équipe "${name}" ?`)) return;
    await supabase.from('custom_entries').delete().eq('id', id);
    loadData();
  };

  const startEdit = (entry: CustomEntry) => {
    setEditingId(entry.id);
    setEditName(entry.name);
    setEditLogo(entry.logo_url || '');
  };

  const saveEdit = async (id: string, entry: CustomEntry) => {
    const oldName = entry.name;
    const newName = editName.trim();
    await supabase.from('custom_entries').update({
      name: newName,
      logo_url: editLogo.trim() || null,
    }).eq('id', id);

    if (entry.entry_type === 'league' && newName !== oldName) {
      await supabase
        .from('custom_entries')
        .update({ competition: newName })
        .eq('entry_type', 'team')
        .eq('competition', oldName);
    }

    setEditingId(null);
    loadData();
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Accès non autorisé</div>
      </div>
    );
  }

  const filteredLeagues = leagues.filter(l => {
    if (sportFilter !== 'all' && l.sport !== sportFilter) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getTeamsForLeague = (leagueName: string) =>
    teams.filter(t => t.competition === leagueName);

  const sportLabel = (sport: string | null) =>
    SPORTS.find(s => s.id === sport)?.label || 'Autre';

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Championnats & Équipes</h1>
            <p className="text-gray-400">Gérez vos championnats, équipes et liens logo</p>
          </div>
          <button
            onClick={() => setShowLeagueForm(!showLeagueForm)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            <span>Nouveau championnat</span>
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un championnat..."
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tous les sports</option>
              {SPORTS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {showLeagueForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-emerald-700/50 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">Ajouter un championnat</h2>
            <form onSubmit={addLeague} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nom du championnat</label>
                  <input
                    type="text"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    placeholder="ex: Liga MX"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sport</label>
                  <select
                    value={newLeagueSport}
                    onChange={(e) => setNewLeagueSport(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SPORTS.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">URL logo (Dropbox OK)</label>
                  <input
                    type="text"
                    value={newLeagueLogo}
                    onChange={(e) => setNewLeagueLogo(e.target.value)}
                    placeholder="https://www.dropbox.com/.../logo.png?dl=0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
                  <Check size={16} /> Créer
                </button>
                <button type="button" onClick={() => setShowLeagueForm(false)} className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {filteredLeagues.length === 0 && (
            <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
              <Trophy className="mx-auto text-gray-600 mb-3" size={40} />
              <p className="text-gray-400">
                {leagues.length === 0 ? 'Aucun championnat personnalisé. Ajoutez-en un pour commencer.' : 'Aucun résultat pour cette recherche.'}
              </p>
            </div>
          )}

          {filteredLeagues.map((league) => {
            const leagueTeams = getTeamsForLeague(league.name);
            const isExpanded = expandedLeague === league.id;
            const isEditing = editingId === league.id;

            return (
              <div key={league.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => setExpandedLeague(isExpanded ? null : league.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {league.logo_url ? (
                      <img
                        src={league.logo_url}
                        alt={league.name}
                        className="w-10 h-10 object-contain flex-shrink-0 rounded bg-gray-800 p-1"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-gray-800 rounded">
                        <Trophy size={18} className="text-gray-500" />
                      </div>
                    )}
                    {isEditing ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm flex-1"
                        />
                        <input
                          type="text"
                          value={editLogo}
                          onChange={(e) => setEditLogo(e.target.value)}
                          placeholder="URL logo"
                          className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm flex-1"
                        />
                        <button onClick={() => saveEdit(league.id, league)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">{league.name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-1.5 py-0.5 bg-gray-800 rounded">{sportLabel(league.sport)}</span>
                          <span>{leagueTeams.length} équipe{leagueTeams.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => startEdit(league)}
                        className="text-gray-400 hover:text-yellow-400 p-1.5 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => deleteLeague(league.id, league.name)}
                        className="text-gray-400 hover:text-red-400 p-1.5 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-800 bg-gray-950/50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300">Équipes de {league.name}</h4>
                        <button
                          onClick={() => setShowTeamForm(showTeamForm === league.id ? null : league.id)}
                          className="flex items-center gap-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Plus size={14} /> Ajouter une équipe
                        </button>
                      </div>

                      {showTeamForm === league.id && (
                        <form onSubmit={(e) => addTeam(e, league.name)} className="bg-gray-900 rounded-lg p-3 mb-3 border border-gray-700">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                            <input
                              type="text"
                              value={newTeamName}
                              onChange={(e) => setNewTeamName(e.target.value)}
                              placeholder="Nom de l'équipe"
                              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                            <input
                              type="text"
                              value={newTeamLogo}
                              onChange={(e) => setNewTeamLogo(e.target.value)}
                              placeholder="URL logo (Dropbox OK, finit par dl=0)"
                              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors">
                              <Check size={14} /> Ajouter
                            </button>
                            <button type="button" onClick={() => setShowTeamForm(null)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors">
                              Annuler
                            </button>
                          </div>
                        </form>
                      )}

                      {leagueTeams.length === 0 ? (
                        <p className="text-gray-500 text-sm py-2">Aucune équipe. Ajoutez-en une pour gagner du temps plus tard.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {leagueTeams.map((team) => {
                            const isTeamEditing = editingId === team.id;
                            return (
                              <div key={team.id} className="flex items-center gap-2 bg-gray-900 rounded-lg p-2 border border-gray-800">
                                {isTeamEditing ? (
                                  <div className="flex-1 flex flex-col gap-1">
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                                    />
                                    <input
                                      type="text"
                                      value={editLogo}
                                      onChange={(e) => setEditLogo(e.target.value)}
                                      placeholder="URL logo"
                                      className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                                    />
                                    <div className="flex gap-1">
                                      <button onClick={() => saveEdit(team.id, team)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs"><Check size={12} /></button>
                                      <button onClick={() => setEditingId(null)} className="bg-gray-700 text-white px-2 py-1 rounded text-xs"><X size={12} /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {team.logo_url ? (
                                      <img
                                        src={team.logo_url}
                                        alt={team.name}
                                        className="w-7 h-7 object-contain flex-shrink-0"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div className="w-7 h-7 flex-shrink-0" />
                                    )}
                                    <span className="text-white text-sm flex-1 truncate">{team.name}</span>
                                    <button onClick={() => startEdit(team)} className="text-gray-500 hover:text-yellow-400 p-1 transition-colors">
                                      <Edit2 size={13} />
                                    </button>
                                    <button onClick={() => deleteTeam(team.id, team.name)} className="text-gray-500 hover:text-red-400 p-1 transition-colors">
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Liens Dropbox</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Les liens Dropbox se terminant par <code className="text-emerald-400 bg-gray-800 px-1 rounded">dl=0</code> sont compatibles.
            Pour un affichage direct de l'image, remplacez <code className="text-emerald-400 bg-gray-800 px-1 rounded">dl=0</code> par
            <code className="text-emerald-400 bg-gray-800 px-1 rounded">raw=1</code> dans l'URL.
            Exemple: <code className="text-gray-400 bg-gray-800 px-1 rounded text-[10px]">https://www.dropbox.com/s/xxx/logo.png?raw=1</code>
          </p>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>Championnats prédéfinis ({LEAGUES.filter(l => l.id !== 'other').length}): {LEAGUES.filter(l => l.id !== 'other').map(l => l.name).join(', ')}</p>
          <p className="mt-1">Ces championnats ont des équipes prédéfinies. Vos championnats personnalisés apparaissent ci-dessus avec le bouton "Autre" lors de la création d'un pronostic.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
