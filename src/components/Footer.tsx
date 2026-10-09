import { AlertTriangle, Facebook, Twitter, Send, Music2, Youtube, Pencil, Save, X } from 'lucide-react';
import { useBranding } from '../hooks/useBranding';
import { useSiteTexts, refreshSiteTexts } from '../hooks/useSiteTexts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

export function Footer() {
  const { social_links } = useBranding();
  const texts = useSiteTexts();
  const { profile } = useAuth();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const t = (key: string, fallback: string) => texts[key]?.content ?? fallback;

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(t(key, ''));
  };

  const saveEdit = async (key: string) => {
    setSaving(true);
    await supabase.from('site_texts').update({ content: editValue, updated_at: new Date().toISOString() }).eq('key', key);
    refreshSiteTexts();
    setSaving(false);
    setEditingKey(null);
  };

  const EditableText = ({ keyName, fallback, className, render }: { keyName: string; fallback: string; className?: string; render: (text: string) => React.ReactNode }) => {
    const content = t(keyName, fallback);
    if (editingKey === keyName) {
      return (
        <div className="relative">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded border border-yellow-500 text-xs"
            rows={3}
            autoFocus
          />
          <div className="flex gap-1 mt-1">
            <button onClick={() => saveEdit(keyName)} disabled={saving} className="p-1 bg-emerald-600 hover:bg-emerald-700 rounded text-white"><Save size={12} /></button>
            <button onClick={() => setEditingKey(null)} className="p-1 bg-gray-600 hover:bg-gray-500 rounded text-white"><X size={12} /></button>
          </div>
        </div>
      );
    }
    return (
      <div className="relative group">
        {render(content)}
        {profile?.is_admin && (
          <button
            onClick={() => startEdit(keyName)}
            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-yellow-600 hover:bg-yellow-700 rounded text-black"
            title="Modifier"
          >
            <Pencil size={10} />
          </button>
        )}
      </div>
    );
  };

  const platformIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook size={18} />,
    twitter: <Twitter size={18} />,
    telegram: <Send size={18} />,
    tiktok: <Music2 size={18} />,
    youtube: <Youtube size={18} />,
  };

  const visibleSocials = Object.entries(social_links || {}).filter(
    ([, link]) => link?.url && link.url.trim() !== ''
  );

  return (
    <footer className="bg-[#0f0f0f] border-t border-[#2a2a2a] py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        {visibleSocials.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {visibleSocials.map(([key, link]) => (
                <a
                  key={key}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#aaa] hover:text-[#e8e8e8] transition-colors"
                  aria-label={link.name || key}
                >
                  {platformIcons[key] || null}
                  <span>{link.name || key}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <a href="/faq" className="text-sm text-[#aaa] hover:text-[#e8e8e8] transition-colors">
            FAQs
          </a>
          <span className="text-[#444]">|</span>
          <a href="/privacy" className="text-sm text-[#aaa] hover:text-[#e8e8e8] transition-colors">
            Privacy Policy
          </a>
          <span className="text-[#444]">|</span>
          <a href="/terms" className="text-sm text-[#aaa] hover:text-[#e8e8e8] transition-colors">
            Terms of Use
          </a>
          <span className="text-[#444]">|</span>
          <a href="/about" className="text-sm text-[#aaa] hover:text-[#e8e8e8] transition-colors">
            About Us
          </a>
          <span className="text-[#444]">|</span>
          <a href="/contact" className="text-sm text-[#aaa] hover:text-[#e8e8e8] transition-colors">
            Contact Us
          </a>
        </div>

        <div className="border-t border-[#2a2a2a] pt-6 mb-4">
          <div className="flex items-start space-x-2 mb-3">
            <AlertTriangle size={16} className="text-[#22c55e] flex-shrink-0 mt-0.5" />
            <EditableText
              keyName="footer_responsible_text"
              fallback="Les jeux d'argent et de hasard sont interdits aux mineurs. Jouez de manière responsable. Ne misez que des sommes que vous pouvez vous permettre de perdre."
              className="text-xs text-[#aaa] leading-relaxed"
              render={(text) => <p className="text-xs text-[#aaa] leading-relaxed">{text}</p>}
            />
          </div>
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-3 mb-4">
            <div className="text-xs text-[#aaa] leading-relaxed">
              <EditableText
                keyName="footer_warning_text"
                fallback="AVERTISSEMENT: LES JEUX D'ARGENT ET DE HASARD PEUVENT ÊTRE DANGEREUX : PERTES D'ARGENT, CONFLITS FAMILIAUX, ADDICTION..."
                render={(text) => <p className="text-xs text-[#aaa] leading-relaxed"><strong className="text-[#ef4444]">⚠️ {text}</strong></p>}
              />
              <br />
              <EditableText
                keyName="footer_warning_phone"
                fallback="Numéro de téléphone pour vous aider : 09-74-75-13-13 (appel non surtaxé)"
                render={(text) => <span className="text-[#666] mt-1 inline-block">{text}</span>}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#2a2a2a] pt-4 mb-4">
          <EditableText
            keyName="footer_seo_text"
            fallback={'PRONO EXPERT est un service de pronostics sportifs professionnels specialise dans le football, le tennis, le basketball, le hockey et le rugby.\nNous proposons des pronostics gratuits et VIP avec un suivi transparent de bankroll et un historique complet verifiable.\nRetrouvez nos analyses et predictions pour la Coupe du Monde 2026, la Ligue des Champions, la Ligue 1, le Top 14 et tous les grands championnats.'}
            render={(text) => <p className="text-xs text-[#666] leading-relaxed text-center max-w-3xl mx-auto whitespace-pre-wrap">{text}</p>}
          />
        </div>

        <div className="text-center">
          <EditableText
            keyName="footer_copyright"
            fallback="© 2026 PRONO EXPERT. All Rights Reserved"
            render={(text) => <p className="text-xs text-[#666] mb-2">{text}</p>}
          />
          <p className="text-xs text-[#444]">
            Copyright MF@23
          </p>
        </div>
      </div>
    </footer>
  );
}
