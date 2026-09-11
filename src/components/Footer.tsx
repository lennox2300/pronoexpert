import { AlertTriangle, Facebook, Twitter, Send, Music2, Youtube } from 'lucide-react';
import { useBranding } from '../hooks/useBranding';

export function Footer() {
  const { social_links } = useBranding();

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
            <p className="text-xs text-[#aaa] leading-relaxed">
              Les jeux d'argent et de hasard sont interdits aux mineurs. Jouez de manière responsable.
              Ne misez que des sommes que vous pouvez vous permettre de perdre.
            </p>
          </div>
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-[#aaa] leading-relaxed">
              <strong className="text-[#ef4444]">⚠️ AVERTISSEMENT:</strong> LES JEUX D'ARGENT ET DE HASARD PEUVENT ÊTRE DANGEREUX :
              PERTES D'ARGENT, CONFLITS FAMILIAUX, ADDICTION...
              <br />
              <span className="text-[#666] mt-1 inline-block">
                Numéro de téléphone pour vous aider : 09-74-75-13-13 (appel non surtaxé)
              </span>
            </p>
          </div>
        </div>

        <div className="border-t border-[#2a2a2a] pt-4 mb-4">
          <p className="text-xs text-[#666] leading-relaxed text-center max-w-3xl mx-auto">
            PRONO EXPERT est un service de pronostics sportifs professionnels specialise dans le football, le tennis, le basketball, le hockey et le rugby.
            Nous proposons des pronostics gratuits et VIP avec un suivi transparent de bankroll et un historique complet verifiable.
            Retrouvez nos analyses et predictions pour la Coupe du Monde 2026, la Ligue des Champions, la Ligue 1, le Top 14 et tous les grands championnats.
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-[#666] mb-2">
            © 2026 PRONO EXPERT. All Rights Reserved
          </p>
          <p className="text-xs text-[#444]">
            Copyright MF@23
          </p>
        </div>
      </div>
    </footer>
  );
}
