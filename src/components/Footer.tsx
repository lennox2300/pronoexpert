import { AlertTriangle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <a href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">
            FAQs
          </a>
          <span className="text-gray-600">|</span>
          <a href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
            Privacy Policy
          </a>
          <span className="text-gray-600">|</span>
          <a href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
            Terms of Use
          </a>
          <span className="text-gray-600">|</span>
          <a href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
            About Us
          </a>
          <span className="text-gray-600">|</span>
          <a href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
            Contact Us
          </a>
        </div>

        <div className="border-t border-gray-800 pt-6 mb-4">
          <div className="flex items-start space-x-2 mb-3">
            <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Les jeux d'argent et de hasard sont interdits aux mineurs. Jouez de manière responsable.
              Ne misez que des sommes que vous pouvez vous permettre de perdre.
            </p>
          </div>
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-red-400">⚠️ AVERTISSEMENT:</strong> LES JEUX D'ARGENT ET DE HASARD PEUVENT ÊTRE DANGEREUX :
              PERTES D'ARGENT, CONFLITS FAMILIAUX, ADDICTION...
              <br />
              <span className="text-gray-400 mt-1 inline-block">
                Numéro de téléphone pour vous aider : 09-74-75-13-13 (appel non surtaxé)
              </span>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            © 2026 PRONO EXPERT. All Rights Reserved
          </p>
          <p className="text-xs text-gray-600">
            Copyright MF@23
          </p>
        </div>
      </div>
    </footer>
  );
}
