import { Check, Crown } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { useBranding } from '../hooks/useBranding';

function renderSiteName(siteName: string) {
  const parts = siteName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return <span className="text-white">{siteName}</span>;
  }
  const lastWord = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(' ');
  return <><span className="text-white">{rest}</span> <span className="text-brand">{lastWord}</span></>;
}

type News = Database['public']['Tables']['news']['Row'];

interface WinningTicketCardProps {
  news: News;
}

function isSafeUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function WinningTicketCard({ news }: WinningTicketCardProps) {
  const { site_name } = useBranding();
  const images: string[] = [];
  if (isSafeUrl(news.image_url)) images.push(news.image_url!);
  if (news.gallery_images) {
    for (const image of news.gallery_images) {
      if (isSafeUrl(image) && !images.includes(image)) images.push(image);
    }
  }
  const thumb = images[0] || null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-semibold tracking-tight">{renderSiteName(site_name)}</div>
        <div className="flex items-center gap-2 text-xs text-textsec">
          <span>Pari combiné</span>
          <Check size={14} strokeWidth={1.8} className="text-wingreen" aria-label="Gagné" />
          <Crown size={14} strokeWidth={1.8} className="text-brand" aria-label="VIP" />
        </div>
      </div>

      {thumb ? (
        <div className="relative flex min-h-32 items-center justify-center overflow-hidden bg-page p-2">
          <img src={thumb} alt={news.title} className="max-h-48 w-full object-contain" onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1.5 bg-page/80 px-2 py-1">
            <Check size={13} strokeWidth={1.8} className="flex-shrink-0 text-wingreen" />
            <span className="truncate text-xs font-medium text-white">{news.title}</span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Check size={13} strokeWidth={1.8} className="flex-shrink-0 text-wingreen" />
            <span className="truncate text-xs font-medium text-white">{news.title}</span>
          </div>
          <p className="line-clamp-2 text-[11px] text-textsec">{news.content}</p>
        </div>
      )}

      {thumb && <div className="border-t border-border px-4 py-2"><p className="line-clamp-1 text-[11px] text-textsec">{news.content}</p></div>}
    </div>
  );
}
