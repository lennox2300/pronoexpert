import { useEffect, useState } from 'react';
import { Newspaper, Plus, X, Eye, EyeOff, Crown, CreditCard as Edit, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { Footer } from '../components/Footer';

type News = Database['public']['Tables']['news']['Row'];

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

const getDropboxEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace('?dl=1', '');
  }
  return url;
};

export function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [expandedNewsIds, setExpandedNewsIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [dropboxVideoUrl, setDropboxVideoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [category, setCategory] = useState<'article' | 'analysis' | 'prediction'>('article');
  const { profile } = useAuth();

  useEffect(() => {
    loadNews();
  }, [profile]);

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsList(data || []);
    } catch (error) {
      console.error('Error loading news:', error);
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.is_admin || !profile?.id) return;

    try {
      const { error } = await supabase.from('news').insert({
        title,
        content,
        image_url: imageUrl || null,
        youtube_url: youtubeUrl || null,
        dropbox_video_url: dropboxVideoUrl || null,
        is_public: isPublic,
        category,
        created_by: profile.id,
      });

      if (error) throw error;

      setTitle('');
      setContent('');
      setImageUrl('');
      setYoutubeUrl('');
      setDropboxVideoUrl('');
      setIsPublic(true);
      setCategory('article');
      setShowCreateForm(false);
      loadNews();
    } catch (error) {
      console.error('Error creating news:', error);
      alert('Erreur lors de la création de l\'actualité');
    }
  };

  const toggleNewsVisibility = async (newsId: string, currentIsPublic: boolean) => {
    if (!profile?.is_admin) return;

    try {
      const { error } = await supabase
        .from('news')
        .update({ is_public: !currentIsPublic })
        .eq('id', newsId);

      if (error) throw error;
      loadNews();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const deleteNews = async (newsId: string) => {
    if (!profile?.is_admin) return;
    if (!confirm('Voulez-vous vraiment supprimer cette actualité ?')) return;

    try {
      const { error } = await supabase.from('news').delete().eq('id', newsId);

      if (error) throw error;
      loadNews();
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  const startEditNews = (news: News) => {
    setEditingNewsId(news.id);
    setTitle(news.title);
    setContent(news.content);
    setImageUrl(news.image_url || '');
    setYoutubeUrl(news.youtube_url || '');
    setDropboxVideoUrl(news.dropbox_video_url || '');
    setIsPublic(news.is_public);
    setCategory(news.category);
    setShowCreateForm(false);
  };

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.is_admin || !editingNewsId) return;

    try {
      const { error } = await supabase
        .from('news')
        .update({
          title,
          content,
          image_url: imageUrl || null,
          youtube_url: youtubeUrl || null,
          dropbox_video_url: dropboxVideoUrl || null,
          is_public: isPublic,
          category,
        })
        .eq('id', editingNewsId);

      if (error) throw error;

      setTitle('');
      setContent('');
      setImageUrl('');
      setYoutubeUrl('');
      setDropboxVideoUrl('');
      setIsPublic(true);
      setCategory('article');
      setEditingNewsId(null);
      loadNews();
    } catch (error) {
      console.error('Error updating news:', error);
      alert('Erreur lors de la mise à jour de l\'actualité');
    }
  };

  const markNewsAsWon = async (newsId: string) => {
    if (!profile?.is_admin) return;

    try {
      const { error } = await supabase
        .from('news')
        .update({ status: 'won' })
        .eq('id', newsId);

      if (error) throw error;
      loadNews();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const markNewsAsLost = async (newsId: string) => {
    if (!profile?.is_admin) return;

    try {
      const { error } = await supabase
        .from('news')
        .update({ status: 'lost' })
        .eq('id', newsId);

      if (error) throw error;
      loadNews();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const toggleNewsExpanded = (newsId: string) => {
    setExpandedNewsIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  };

  const canViewNews = (news: News) => {
    return news.is_public || profile?.is_vip || profile?.is_admin;
  };

  const visibleNews = newsList.filter(canViewNews);

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Newspaper className="text-emerald-600" size={28} />
            <h1 className="text-2xl font-bold text-white">ACTUALITÉS</h1>
          </div>
          {profile?.is_admin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={18} />
              <span>Nouvelle</span>
            </button>
          )}
        </div>

        {editingNewsId && profile?.is_admin && (
          <div className="bg-black rounded-lg p-4 mb-4 border border-yellow-600">
            <h2 className="text-lg font-bold text-white mb-3">Modifier l'actualité</h2>
            <form onSubmit={handleUpdateNews} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Contenu</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">URL Image (optionnel)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Vidéo YouTube (optionnel)</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Vidéo Dropbox (optionnel)</label>
                <input
                  type="url"
                  value={dropboxVideoUrl}
                  onChange={(e) => setDropboxVideoUrl(e.target.value)}
                  placeholder="https://www.dropbox.com/..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'article' | 'analysis' | 'prediction')}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="article">Article</option>
                  <option value="analysis">Analyse</option>
                  <option value="prediction">Prédiction</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-300">Visible par tous (sinon VIP uniquement)</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Mettre à jour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingNewsId(null);
                    setTitle('');
                    setContent('');
                    setImageUrl('');
                    setYoutubeUrl('');
                    setDropboxVideoUrl('');
                    setIsPublic(true);
                    setCategory('article');
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {showCreateForm && profile?.is_admin && (
          <div className="bg-black rounded-lg p-4 mb-4 border border-emerald-700">
            <h2 className="text-lg font-bold text-white mb-3">Créer une actualité</h2>
            <form onSubmit={handleCreateNews} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Contenu</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">URL Image (optionnel)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Vidéo YouTube (optionnel)</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Vidéo Dropbox (optionnel)</label>
                <input
                  type="url"
                  value={dropboxVideoUrl}
                  onChange={(e) => setDropboxVideoUrl(e.target.value)}
                  placeholder="https://www.dropbox.com/..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'article' | 'analysis' | 'prediction')}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="article">Article</option>
                  <option value="analysis">Analyse</option>
                  <option value="prediction">Prédiction</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-300">Visible par tous (sinon VIP uniquement)</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Publier
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleNews.map((news) => {
            const isExpanded = expandedNewsIds.has(news.id);

            return (
              <div
                key={news.id}
                className="bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-gray-800 hover:border-emerald-600 transition-all duration-300 shadow-lg hover:shadow-emerald-900/20 flex flex-col"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => toggleNewsExpanded(news.id)}
                >
                  {news.image_url && (
                    <div className="w-full bg-gray-900">
                      <img
                        src={news.image_url}
                        alt={news.title}
                        className="w-full h-auto object-contain max-h-96"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="text-base font-bold text-white flex-1 line-clamp-2 leading-tight">
                        {news.title}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {news.status === 'won' && (
                          <span className="text-emerald-500 text-lg">✅</span>
                        )}
                        {news.status === 'lost' && (
                          <span className="text-red-500 text-lg">❌</span>
                        )}
                        {!news.is_public && (
                          <Crown className="text-yellow-500" size={16} />
                        )}
                      </div>
                    </div>

                    {!isExpanded && (
                      <p className="text-gray-400 text-sm line-clamp-3 mb-3">
                        {news.content}
                      </p>
                    )}

                    <div className="text-xs text-gray-500">
                      {new Date(news.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 flex-1 flex flex-col">
                    {news.youtube_url && getYouTubeVideoId(news.youtube_url) && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(news.youtube_url)}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {news.dropbox_video_url && getDropboxEmbedUrl(news.dropbox_video_url) && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        <video
                          controls
                          className="w-full rounded-lg"
                          style={{ maxHeight: '300px' }}
                        >
                          <source src={getDropboxEmbedUrl(news.dropbox_video_url) || ''} type="video/mp4" />
                          Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                      </div>
                    )}

                    <p className="text-gray-300 text-sm whitespace-pre-wrap flex-1">
                      {news.content}
                    </p>
                  </div>
                )}

                {profile?.is_admin && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-800 mt-auto">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNewsVisibility(news.id, news.is_public);
                        }}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                          news.is_public
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {news.is_public ? <Eye size={10} /> : <EyeOff size={10} />}
                        <span>{news.is_public ? 'Public' : 'VIP'}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditNews(news);
                        }}
                        className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 text-black px-2 py-1 rounded text-xs transition-colors font-semibold"
                      >
                        <Edit size={10} />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markNewsAsWon(news.id);
                        }}
                        className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs transition-colors font-semibold"
                      >
                        <CheckCircle size={10} />
                        <span>✅</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markNewsAsLost(news.id);
                        }}
                        className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors font-semibold"
                      >
                        <XCircle size={10} />
                        <span>❌</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNews(news.id);
                        }}
                        className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {visibleNews.length === 0 && (
          <div className="bg-black rounded-lg p-8 text-center border border-gray-800">
            <Newspaper className="mx-auto text-gray-600 mb-3" size={48} />
            <p className="text-gray-400">Aucune actualité pour le moment</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
