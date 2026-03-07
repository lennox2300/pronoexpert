import { useEffect, useState } from 'react';
import { CreditCard as Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Footer } from '../components/Footer';

interface LegalPageProps {
  slug: string;
}

interface LegalPageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
}

export function LegalPage({ slug }: LegalPageProps) {
  const [pageData, setPageData] = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    loadPageData();
  }, [slug]);

  const loadPageData = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPageData(data);
        setEditedContent(data.content);
      }
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pageData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('legal_pages')
        .update({
          content: editedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageData.id);

      if (error) throw error;

      setPageData({ ...pageData, content: editedContent });
      setEditing(false);
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(pageData?.content || '');
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-black py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <p className="text-gray-400">Page introuvable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">{pageData.title}</h1>
            {profile?.is_admin && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                <span>Modifier</span>
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 bg-gray-800 text-white p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-sm"
                placeholder="Contenu de la page (supporte Markdown)"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={18} />
                  <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <X size={18} />
                  <span>Annuler</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Astuce: Utilisez Markdown pour formater le texte (# pour les titres, ** pour le gras, etc.)
              </p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <div
                className="text-gray-300 leading-relaxed whitespace-pre-wrap"
                style={{ wordWrap: 'break-word' }}
              >
                {pageData.content.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={idx} className="text-2xl font-bold text-white mt-6 mb-4">
                        {line.substring(2)}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-xl font-bold text-white mt-5 mb-3">
                        {line.substring(3)}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-lg font-bold text-white mt-4 mb-2">
                        {line.substring(4)}
                      </h3>
                    );
                  }
                  if (line.trim() === '') {
                    return <br key={idx} />;
                  }
                  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                  const parts = [];
                  let lastIndex = 0;
                  let match;

                  while ((match = linkRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(line.substring(lastIndex, match.index));
                    }
                    parts.push(
                      <a
                        key={match.index}
                        href={match[2]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        {match[1]}
                      </a>
                    );
                    lastIndex = match.index + match[0].length;
                  }

                  if (lastIndex < line.length) {
                    parts.push(line.substring(lastIndex));
                  }

                  return (
                    <p key={idx} className="mb-3">
                      {parts.length > 0 ? parts : line}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Dernière mise à jour: {new Date(pageData.updated_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
