import { AlertTriangle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-3">
        <div className="flex items-start space-x-2 mb-3">
          <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            Les jeux d'argent et de hasard sont interdits aux mineurs. Jouez de manière responsable.
            Ne misez que des sommes que vous pouvez vous permettre de perdre.
          </p>
        </div>
        <p className="text-xs text-gray-500">
          En utilisant cette application, vous acceptez nos conditions d'utilisation.
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Copyright MF@23
        </p>
      </div>
    </footer>
  );
}
