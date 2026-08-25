import { useEffect, useRef, useState } from 'react';
import { Newspaper, Plus, X, Eye, EyeOff, Crown, CreditCard as Edit, Play, Volume2, ChevronDown, ChevronUp, ThumbsUp, Share2, ImagePlus, ChevronLeft, ChevronRight, Pause, Lock, Zap, RotateCcw, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { Footer } from '../components/Footer';

type News = Database['public']['Tables']['news']['Row'];

const FORM_MAX = 7;

// ─── Media helpers ────────────────────────────────────────────────────────────

function toDropboxDirect(url: string): string {
  let u = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  u = u.replace(/[?&]dl=[01]/, '');
  u += u.includes('?') ? '&raw=1' : '?raw=1';
  return u;
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function isAudioUrl(url: string): boolean {
  return /\.(mp3|wav|ogg|aac|flac|m4a)(\?|$)/i.test(url);
}

function isSafeMediaUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ['https:', 'http:'].includes(u.protocol);
  } catch {
    return false;
  }
}

function resolveMedia(news: News): { type: 'youtube'; id: string } | { type: 'video'; src: string } | { type: 'audio'; src: string } | null {
  const raw = news.youtube_url || news.dropbox_video_url;
  if (!raw || !isSafeMediaUrl(raw)) return null;
  const ytId = getYoutubeId(raw);
  if (ytId) return { type: 'youtube', id: ytId };
  const src = raw.includes('dropbox.com') ? toDropboxDirect(raw) : raw;
  if (!isSafeMediaUrl(src)) return null;
  if (isAudioUrl(src)) return { type: 'audio', src };
  return { type: 'video', src };
}

// ─── Media Players ────────────────────────────────────────────────────────────

function YoutubePlayer({ id }: { id: string }) {
  return (
    <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}

function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  return (
    <div className="rounded-xl overflow-hidden bg-black border border-gray-800 shadow-lg">
      <video
        ref={ref}
        controls
        preload="metadata"
        src={src}
        className="w-full max-h-72 sm:max-h-96 block"
        style={{ background: '#000' }}
      >
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 border-t border-gray-800">
        <Play size={12} className="text-emerald-500 flex-shrink-0" />
        <span className="text-[10px] text-gray-500 font-mono truncate">{src.split('/').pop()?.split('?')[0]}</span>
      </div>
    </div>
  );
}

function AudioPlayer({ src }: { src: string }) {
  const fileName = src.split('/').pop()?.split('?')[0] ?? 'audio';
  return (
    <div className="rounded-xl overflow-hidden bg-gray-950 border border-gray-800 shadow-lg">
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-950">
        <div className="w-9 h-9 rounded-full bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center flex-shrink-0">
          <Volume2 size={16} className="text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-semibold truncate">{fileName}</p>
          <p className="text-gray-500 text-[10px]">Fichier audio</p>
        </div>
      </div>
      <div className="px-3 pb-3 pt-2 bg-gray-950">
        <audio controls src={src} className="w-full h-8" style={{ accentColor: '#10b981' }}>
          Votre navigateur ne supporte pas la lecture audio.
        </audio>
      </div>
    </div>
  );
}

// ─── Ticket Carousel ──────────────────────────────────────────────────────────

function TicketCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (images.length <= 1 || !playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length, playing]);

  if (!images || images.length === 0) return null;

  const go = (dir: number) => {
    setPlaying(false);
    setIndex((prev) => (prev + dir + images.length) % images.length);
  };

  const select = (i: number) => {
    setPlaying(false);
    setIndex(i);
  };

  const maxH = 'clamp(180px, 40vh, 380px)';

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden">
      {/* Slides */}
      <div className="relative w-full overflow-hidden">
        <div
          className="flex w-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <div key={i} className="min-w-full flex-shrink-0 relative flex items-center justify-center" style={{ maxHeight: maxH }}>
              <img
                src={src}
                alt={`Ticket ${i + 1}`}
                className="w-full h-auto max-h-[clamp(180px,40vh,380px)] object-contain"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
              />
            </div>
          ))}
        </div>

        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 sm:p-1.5 transition-colors touch-manipulation z-10"
              aria-label="Ticket précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 sm:p-1.5 transition-colors touch-manipulation z-10"
              aria-label="Ticket suivant"
            >
              <ChevronRight size={16} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => setPlaying((p) => !p)}
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 sm:p-1.5 transition-colors touch-manipulation z-10"
              aria-label={playing ? 'Pause' : 'Lecture'}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>

            {/* Counter */}
            <span className="absolute bottom-1.5 sm:bottom-2 right-2 sm:right-3 text-[9px] sm:text-[10px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded font-mono z-10">
              {index + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {/* Ticket buttons bar */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-gray-950 border-t border-gray-800">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all touch-manipulation ${
                i === index
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Ticket {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPlaying((p) => !p)}
            className="ml-auto px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-1"
            aria-label={playing ? 'Pause' : 'Lecture auto'}
          >
            {playing ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Auto</>}
          </button>
        </div>
      )}
    </div>
  );
}

// Deduplicate images: combine image_url + gallery, remove duplicates
function collectImages(news: News): string[] {
  const gallery = (news.gallery_images?.filter(Boolean) ?? []).filter(isSafeMediaUrl);
  const main = (news.image_url && isSafeMediaUrl(news.image_url)) ? news.image_url : null;
  const all = main ? [main, ...gallery] : gallery;
  return all.filter((url, idx, arr) => arr.indexOf(url) === idx);
}

// ─── Locked Card (Premium content for non-VIP) ────────────────────────────────

interface LockedCardProps {
  news: News;
  isLoggedIn: boolean;
  onJoin: () => void;
}

function LockedCard({ news, isLoggedIn, onJoin }: LockedCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-gray-800 shadow-lg flex flex-col">
      {(() => {
        const imgs = collectImages(news);
        const thumb = imgs[0];
        if (!thumb) return null;
        return (
          <div className="w-full overflow-hidden bg-black relative">
            <img
              src={thumb}
              alt={news.title}
              className="w-full h-32 sm:h-40 object-cover blur-sm opacity-60"
              onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Lock className="text-yellow-500" size={32} />
            </div>
          </div>
        );
      })()}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="text-yellow-500 flex-shrink-0" size={16} />
          <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide">Premium</span>
        </div>
        <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-2 leading-snug">{news.title}</h3>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3 flex-1">{news.content}</p>
        <div className="mt-auto">
          <p className="text-gray-400 text-xs mb-2.5">
            {isLoggedIn
              ? 'Devenez membre VIP pour accéder à ce contenu exclusif.'
              : 'Créez un compte gratuit puis demandez l\'accès VIP pour découvrir ce contenu.'}
          </p>
          <button
            onClick={onJoin}
            className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2.5 rounded-lg text-sm transition-all transform hover:scale-[1.02]"
          >
            <Zap size={16} />
            {isLoggedIn ? 'Devenir VIP' : 'Créer un compte'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────────

interface ArticleCardProps {
  news: News;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  isAdmin: boolean;
  onTogglePublic: (id: string, cur: boolean) => void;
  onEdit: (news: News) => void;
  onMarkWon: (id: string) => void;
  onMarkLost: (id: string) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onShare: (news: News) => void;
  localLiked: boolean;
  copied: boolean;
}

function ArticleCard({ news, isExpanded, onToggle, isAdmin, onTogglePublic, onEdit, onMarkWon, onMarkLost, onDelete, onLike, onShare, localLiked, copied }: ArticleCardProps) {
  const media = resolveMedia(news);
  const allImages = collectImages(news);
  const [shareOpen, setShareOpen] = useState(false);

  const shareUrl = 'https://pronoexpert.net';
  const shareText = 'PRONO EXPERT — Pronostics VIP & Premium';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const socialLinks = [
    { name: 'WhatsApp', url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`, color: 'bg-[#25D366] hover:bg-[#1da851]', icon: 'whatsapp' },
    { name: 'Telegram', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, color: 'bg-[#0088cc] hover:bg-[#006699]', icon: 'telegram' },
    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: 'bg-[#1877f2] hover:bg-[#0d65d9]', icon: 'facebook' },
    { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, color: 'bg-black hover:bg-gray-800 border border-gray-600', icon: 'twitter' },
  ];

  const openSocial = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    setShareOpen(false);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border border-gray-800 hover:border-emerald-700/60 transition-all duration-300 shadow-lg flex flex-col">

      {/* Ticket carousel (clickable to expand) */}
      {allImages.length > 0 && (
        <div className="cursor-pointer" onClick={() => onToggle(news.id)}>
          <TicketCarousel images={allImages} />
        </div>
      )}

      {/* Title + meta (clickable) */}
      <div className="cursor-pointer" onClick={() => onToggle(news.id)}>
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-2 mb-1.5">
            <h3 className="text-sm sm:text-base font-bold text-white flex-1 line-clamp-2 leading-snug">
              {news.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
              {news.status === 'won' && <span className="text-base leading-none">✅</span>}
              {news.status === 'lost' && <span className="text-base leading-none">❌</span>}
              {!news.is_public && <Crown className="text-yellow-500" size={14} />}
            </div>
          </div>

          {!isExpanded && (
            <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 mb-2 leading-relaxed">
              {news.content}
            </p>
          )}

          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-gray-600">
              {new Date(news.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-emerald-500 flex items-center gap-0.5 font-medium">
              {isExpanded ? <><ChevronUp size={12} />Fermer</> : <><ChevronDown size={12} />Lire</>}
            </span>
          </div>
        </div>
      </div>

      {/* Like + Share bar */}
      <div className="flex items-center gap-2 px-3 pb-2 pt-0 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onLike(news.id)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${localLiked ? 'bg-emerald-600/20 border-emerald-600 text-emerald-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-emerald-700 hover:text-emerald-400'}`}
        >
          <ThumbsUp size={12} className={localLiked ? 'fill-emerald-400' : ''} />
          <span>{news.likes_count ?? 0}</span>
        </button>
        <button
          onClick={() => { setShareOpen(v => !v); onShare(news); }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${copied ? 'bg-emerald-600/20 border-emerald-600 text-emerald-400' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-blue-600 hover:text-blue-400'}`}
        >
          {copied ? <Check size={12} /> : <Share2 size={12} />}
          <span>{copied ? 'Copie!' : 'Partager'}</span>
        </button>

        {/* Social share menu */}
        {shareOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
            <div className="absolute bottom-full left-3 mb-1 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 flex items-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
              {socialLinks.map((s) => (
                <button
                  key={s.name}
                  onClick={() => openSocial(s.url)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg text-white transition-colors ${s.color}`}
                  title={s.name}
                >
                  {s.icon === 'whatsapp' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  )}
                  {s.icon === 'telegram' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.122.3-.142.41-.02.11.118.13.32.02.43l-7.5 8.4c-.05.06-.14.1-.23.1-.08 0-.17-.04-.23-.1L5.91 12.2c-.12-.12-.12-.32 0-.44.12-.12.32-.12.44 0l2.9 2.85 6.66-7.38z"/></svg>
                  )}
                  {s.icon === 'facebook' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  )}
                  {s.icon === 'twitter' && (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.82l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  )}
                </button>
              ))}
              <button
                onClick={() => { onShare(news); setShareOpen(false); }}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Copier le lien"
              >
                <Check size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-4 flex-1 flex flex-col gap-3 border-t border-gray-800/60 pt-3">
          {/* Media player */}
          {media && (
            <div onClick={(e) => e.stopPropagation()}>
              {media.type === 'youtube' && <YoutubePlayer id={media.id} />}
              {media.type === 'video' && <VideoPlayer src={media.src} />}
              {media.type === 'audio' && <AudioPlayer src={media.src} />}
            </div>
          )}

          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed flex-1">
            {news.content}
          </p>
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <div className="px-3 sm:px-4 pb-3 pt-2 border-t border-gray-800 mt-auto">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePublic(news.id, news.is_public); }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${news.is_public ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            >
              {news.is_public ? <Eye size={10} /> : <EyeOff size={10} />}
              {news.is_public ? 'Public' : 'Premium'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(news); }}
              className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-black px-2 py-1 rounded text-[10px] font-semibold transition-colors"
            >
              <Edit size={10} />Modifier
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMarkWon(news.id); }}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded text-[10px] transition-colors"
              title="Marquer gagné"
            >✅</button>
            <button
              onClick={(e) => { e.stopPropagation(); onMarkLost(news.id); }}
              className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] transition-colors"
              title="Marquer perdu"
            >❌</button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(news.id); }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-[10px] transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Media form field ─────────────────────────────────────────────────────────

interface MediaFieldProps {
  value: string;
  onChange: (v: string) => void;
  accentClass: string;
}

function MediaField({ value, onChange, accentClass }: MediaFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        Video / Audio / GIF URL <span className="text-gray-600">(YouTube, Dropbox, lien direct)</span>
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://youtube.com/watch?v=... ou https://www.dropbox.com/..."
        className={`w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none ${accentClass}`}
      />
    </div>
  );
}

// ─── Gallery upload field ─────────────────────────────────────────────────────

interface GalleryFieldProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  uploading: boolean;
  onUpload: (files: FileList) => Promise<void>;
}

function GalleryField({ images, onImagesChange, uploading, onUpload }: GalleryFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const removeImage = (idx: number) => {
    onImagesChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        Images de la galerie <span className="text-gray-600">(envoi direct — plusieurs images possibles, affichées en diaporama)</span>
      </label>

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-600 transition-colors"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files && e.target.files.length > 0) onUpload(e.target.files); }}
        />
        <ImagePlus className="mx-auto text-gray-500 mb-2" size={28} />
        <p className="text-xs text-gray-400">
          {uploading ? 'Envoi en cours...' : 'Cliquez pour sélectionner une ou plusieurs images'}
        </p>
      </div>

      {/* Preview thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Galerie ${idx + 1}`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-700"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
              <span className="absolute bottom-0.5 left-0.5 text-[8px] text-white bg-black/60 px-1 rounded">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NewsForm ─────────────────────────────────────────────────────────────────

interface NewsFormProps {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  imageUrl: string; setImageUrl: (v: string) => void;
  mediaUrl: string; setMediaUrl: (v: string) => void;
  isPublic: boolean; setIsPublic: (v: boolean) => void;
  category: 'article' | 'analysis' | 'prediction' | 'infos'; setCategory: (v: 'article' | 'analysis' | 'prediction' | 'infos') => void;
  eventTime: string; setEventTime: (v: string) => void;
  galleryImages: string[]; setGalleryImages: (v: string[]) => void;
  uploading: boolean;
  onGalleryUpload: (files: FileList) => Promise<void>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  accentFocus: string;
  submitBg: string;
}

function NewsForm({ title, setTitle, content, setContent, imageUrl, setImageUrl, mediaUrl, setMediaUrl, isPublic, setIsPublic, category, setCategory, eventTime, setEventTime, galleryImages, setGalleryImages, uploading, onGalleryUpload, onSubmit, onCancel, submitLabel, accentFocus, submitBg }: NewsFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Titre</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none ${accentFocus}`} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Contenu</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4}
          className={`w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none ${accentFocus}`} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Date et heure de l'événement <span className="text-gray-600">(pré-rempli avec la date du jour)</span>
        </label>
        <input type="datetime-local" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
          className={`w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none ${accentFocus}`} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Image principale / GIF URL <span className="text-gray-600">(optionnel)</span>
        </label>
        <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg ou image.gif"
          className={`w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none ${accentFocus}`} />
      </div>
      <GalleryField images={galleryImages} onImagesChange={setGalleryImages} uploading={uploading} onUpload={onGalleryUpload} />
      <MediaField value={mediaUrl} onChange={setMediaUrl} accentClass={accentFocus} />
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Categorie</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as 'article' | 'analysis' | 'prediction' | 'infos')}
          className={`w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white text-sm focus:outline-none ${accentFocus}`}>
          <option value="prediction">Ticket</option>
          <option value="article">Article</option>
          <option value="analysis">Analyse</option>
          <option value="infos">Infos</option>
        </select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 rounded border-gray-700 bg-gray-900" />
        <span className="text-sm text-gray-300">Public <span className="text-gray-600">(décoché = Premium, visible par les membres VIP)</span></span>
      </label>
      <div className="flex gap-2">
        <button type="submit" className={`flex-1 ${submitBg} text-white py-2 rounded-lg text-sm font-semibold transition-colors`}>
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}

function groupByMonthNews(items: News[]) {
  const groups: { [key: string]: News[] } = {};
  items.forEach(item => {
    const rawDate = item.event_time || item.created_at;
    const date = new Date(rawDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(item);
  });
  return groups;
}

function formatMonthYear(monthKey: string) {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function nowLocalDatetime(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export function NewsPage({ onPageChange, categoryFilter = 'all' }: { onPageChange?: (p: string) => void; categoryFilter?: 'all' | 'prediction' | 'infos' }) {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [category, setCategory] = useState<'article' | 'analysis' | 'prediction' | 'infos'>('article');
  const [eventTime, setEventTime] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [formDots, setFormDots] = useState<News[]>([]);
  const [validatedHistory, setValidatedHistory] = useState<News[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const { profile } = useAuth();

  useEffect(() => { loadNews(); loadForm(); loadHistory(); }, [profile]);

  useEffect(() => {
    const articleId = new URLSearchParams(window.location.search).get('article');
    if (articleId && newsList.some((news) => news.id === articleId)) {
      setExpandedNewsId(articleId);
    }
  }, [newsList]);

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('event_time', { ascending: false, nullsFirst: false });
      if (error) throw error;
      const sorted = [...(data || [])].sort((a, b) => {
        const ta = a.event_time ? new Date(a.event_time).getTime() : null;
        const tb = b.event_time ? new Date(b.event_time).getTime() : null;
        if (ta !== null && tb !== null) return tb - ta;
        if (ta !== null) return -1;
        if (tb !== null) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setNewsList(sorted);
    } catch {
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadForm = async () => {
    try {
      const { count } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .in('status', ['won', 'lost']);

      const total = count || 0;
      const dotsToShow = Math.min(total, FORM_MAX);

      if (dotsToShow === 0) {
        setFormDots([]);
        return;
      }

      const { data } = await supabase
        .from('news')
        .select('*')
        .in('status', ['won', 'lost'])
        .order('event_time', { ascending: false, nullsFirst: false })
        .limit(dotsToShow);

      const sorted = [...(data || [])].reverse();
      setFormDots(sorted);
    } catch {
      setFormDots([]);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .in('status', ['won', 'lost'])
        .order('event_time', { ascending: false, nullsFirst: false });

      if (error) return;

      setValidatedHistory(data || []);

      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setExpandedMonths(new Set([currentMonthKey]));
    } catch {
      setValidatedHistory([]);
    }
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  const resetForm = () => {
    setTitle(''); setContent(''); setImageUrl(''); setMediaUrl('');
    setIsPublic(true); setCategory('article'); setEventTime(''); setGalleryImages([]);
  };

  const handleGalleryUpload = async (files: FileList) => {
    if (!profile?.is_admin) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('news-gallery')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('news-gallery').getPublicUrl(fileName);
        uploaded.push(pub.publicUrl);
      }
      setGalleryImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors de l\'envoi des images');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.is_admin || !profile?.id) return;
    try {
      const isYt = !!getYoutubeId(mediaUrl);
      await supabase.from('news').insert({
        title, content,
        image_url: imageUrl || null,
        youtube_url: isYt ? mediaUrl : null,
        dropbox_video_url: (!isYt && mediaUrl) ? mediaUrl : null,
        is_public: isPublic, category, created_by: profile.id,
        event_time: eventTime || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
      });
      resetForm(); setShowCreateForm(false); loadNews();
    } catch (err) {
      console.error(err); alert('Erreur lors de la création');
    }
  };

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.is_admin || !editingNewsId) return;
    try {
      const isYt = !!getYoutubeId(mediaUrl);
      const { error: updateError } = await supabase.from('news').update({
        title, content,
        image_url: imageUrl || null,
        youtube_url: isYt ? mediaUrl : null,
        dropbox_video_url: (!isYt && mediaUrl) ? mediaUrl : null,
        is_public: isPublic, category,
        event_time: eventTime || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
      }).eq('id', editingNewsId);
      if (updateError) throw updateError;
      resetForm(); setEditingNewsId(null); loadNews(); loadForm(); loadHistory();
    } catch (err) {
      console.error(err); alert('Erreur lors de la mise à jour');
    }
  };

  const toggleExpanded = (newsId: string) => {
    setExpandedNewsId(prev => {
      const next = prev === newsId ? null : newsId;
      if (next !== null) window.scrollTo({ top: 0, behavior: 'smooth' });
      return next;
    });
  };

  const startEditNews = (news: News) => {
    setEditingNewsId(news.id);
    setTitle(news.title); setContent(news.content);
    setImageUrl(news.image_url || '');
    const raw = news.youtube_url || news.dropbox_video_url || '';
    setMediaUrl(raw);
    setIsPublic(news.is_public); setCategory(news.category);
    setEventTime(news.event_time ? new Date(news.event_time).toISOString().slice(0, 16) : '');
    setGalleryImages(news.gallery_images?.filter(Boolean) ?? []);
    setShowCreateForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleVisibility = async (id: string, cur: boolean) => {
    if (!profile?.is_admin) return;
    await supabase.from('news').update({ is_public: !cur }).eq('id', id);
    loadNews();
  };

  const markStatus = async (id: string, status: 'won' | 'lost') => {
    if (!profile?.is_admin) return;
    const { error } = await supabase.from('news').update({ status, is_public: true, status_changed_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      console.error('markStatus error:', error);
      alert('Erreur lors de la validation: ' + error.message);
      return;
    }
    loadNews();
    loadForm();
    loadHistory();
  };

  const handleLike = async (id: string) => {
    const key = `liked_news_${id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setNewsList(prev => prev.map(n => n.id === id ? { ...n, likes_count: (n.likes_count ?? 0) + 1 } : n));
    const { data, error } = await supabase.rpc('increment_news_likes', { p_news_id: id });
    if (error) {
      console.error('Like RPC error:', error.message);
      return;
    }
    if (typeof data === 'number') {
      setNewsList(prev => prev.map(n => n.id === id ? { ...n, likes_count: data } : n));
      setValidatedHistory(prev => prev.map(n => n.id === id ? { ...n, likes_count: data } : n));
    }
  };

  const handleShare = async (news: News) => {
    const shareUrl = 'https://pronoexpert.net';
    const text = 'PRONO EXPERT — Pronostics VIP & Premium';

    if (navigator.share) {
      const shareData: ShareData = { title: 'PRONO EXPERT', text, url: shareUrl };
      await navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`).catch(() => {});
      setCopiedId(news.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const deleteNews = async (id: string) => {
    if (!profile?.is_admin) return;
    if (!confirm('Supprimer cette actualité ?')) return;
    await supabase.from('news').delete().eq('id', id);
    loadNews();
  };

  const resetSeason = async () => {
    if (!profile?.is_admin) return;
    const step1 = confirm(
      'NOUVELLE SAISON\n\n' +
      'Cette action va supprimer DÉFINITIVEMENT toutes les actualités de la section Premium et toutes les images stockées.\n\n' +
      'Les images envoyées par lien externe ne seront pas affectées.\n\n' +
      'Continuer ?'
    );
    if (!step1) return;
    const step2 = confirm(
      'DERNIÈRE CONFIRMATION\n\n' +
      'Êtes-vous absolument sûr ? Cette action est irréversible.'
    );
    if (!step2) return;
    try {
      const { data: allNews } = await supabase.from('news').select('image_url, gallery_images');
      const filePaths: string[] = [];
      const extractPath = (url: string) => {
        try {
          const u = new URL(url);
          const marker = '/storage/v1/object/public/news-gallery/';
          const idx = u.pathname.indexOf(marker);
          if (idx !== -1) {
            return decodeURIComponent(u.pathname.slice(idx + marker.length));
          }
        } catch { return null; }
        return null;
      };
      (allNews ?? []).forEach((n) => {
        if (n.image_url) {
          const p = extractPath(n.image_url);
          if (p) filePaths.push(p);
        }
        (n.gallery_images ?? []).forEach((g) => {
          const p = extractPath(g);
          if (p) filePaths.push(p);
        });
      });
      if (filePaths.length > 0) {
        await supabase.storage.from('news-gallery').remove(filePaths);
      }
      await supabase.from('news').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      loadNews();
      alert('Nouvelle saison : tous les articles et images ont été supprimés.');
    } catch (err) {
      console.error('Reset season error:', err);
      alert('Erreur lors de la réinitialisation. Réessayez.');
    }
  };

  const canView = (news: News) => news.is_public || profile?.is_vip || profile?.is_admin;
  const visible = newsList.filter(n => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (n.status === 'won' || n.status === 'lost') return false;
    return true;
  });
  const isLocked = (news: News) => !canView(news);
  const isLoggedIn = !!profile;
  const goToJoin = () => {
    if (onPageChange) {
      onPageChange('joinvip');
      window.history.pushState({}, '', '/joinvip');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-12 pb-4 px-3">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Newspaper className="text-emerald-600 flex-shrink-0" size={20} />
            <h1 className="text-base sm:text-2xl font-bold text-white uppercase">Premium</h1>
          </div>
          {profile?.is_admin && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setShowCreateForm(v => !v);
                  setEditingNewsId(null);
                  resetForm();
                  setEventTime(nowLocalDatetime());
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus size={16} /><span className="hidden sm:inline">Nouvelle</span>
              </button>
              <button
                onClick={resetSeason}
                className="flex items-center gap-2 bg-red-900/80 hover:bg-red-800 text-red-200 hover:text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border border-red-700/50"
                title="Nouvelle saison — effacer tous les articles et images"
              >
                <RotateCcw size={14} /><span className="hidden sm:inline">Saison</span>
              </button>
            </div>
          )}
        </div>

        {/* Form indicator - 7 dots max */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[10px] text-gray-500 uppercase font-semibold whitespace-nowrap">Forme</span>
          <div className="flex items-center gap-1">
            {formDots.length > 0 ? (
              formDots.map((n, idx) => (
                <span
                  key={n.id}
                  title={n.status === 'won' ? 'Gagné' : 'Perdu'}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-[fadeIn_0.3s_ease-out_both] ${
                    n.status === 'won'
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      : 'bg-red-500 shadow-sm shadow-red-500/50'
                  }`}
                />
              ))
            ) : (
              <span className="text-[10px] text-gray-600">Aucun resultat encore</span>
            )}
          </div>
        </div>

        {/* Category filter banner */}
        {categoryFilter !== 'all' && (
          <div className="flex items-center gap-2 mb-4 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-300">
              Filtre: {categoryFilter === 'prediction' ? 'Tickets / Prédictions' : 'Infos'}
            </span>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/news');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="ml-auto text-xs text-gray-400 hover:text-white underline"
            >
              Tout voir
            </button>
          </div>
        )}

        {/* Edit form */}
        {editingNewsId && profile?.is_admin && (
          <div className="bg-black rounded-lg p-4 mb-4 border border-yellow-600">
            <h2 className="text-lg font-bold text-white mb-3">Modifier l'actualité</h2>
            <NewsForm
              title={title} setTitle={setTitle}
              content={content} setContent={setContent}
              imageUrl={imageUrl} setImageUrl={setImageUrl}
              mediaUrl={mediaUrl} setMediaUrl={setMediaUrl}
              isPublic={isPublic} setIsPublic={setIsPublic}
              category={category} setCategory={setCategory}
              eventTime={eventTime} setEventTime={setEventTime}
              galleryImages={galleryImages} setGalleryImages={setGalleryImages}
              uploading={uploading}
              onGalleryUpload={handleGalleryUpload}
              onSubmit={handleUpdateNews}
              onCancel={() => { setEditingNewsId(null); resetForm(); }}
              submitLabel="Mettre à jour"
              accentFocus="focus:ring-2 focus:ring-yellow-500"
              submitBg="bg-yellow-600 hover:bg-yellow-700"
            />
          </div>
        )}

        {/* Create form */}
        {showCreateForm && profile?.is_admin && (
          <div className="bg-black rounded-lg p-4 mb-4 border border-emerald-700">
            <h2 className="text-lg font-bold text-white mb-3">Créer une actualité</h2>
            <NewsForm
              title={title} setTitle={setTitle}
              content={content} setContent={setContent}
              imageUrl={imageUrl} setImageUrl={setImageUrl}
              mediaUrl={mediaUrl} setMediaUrl={setMediaUrl}
              isPublic={isPublic} setIsPublic={setIsPublic}
              category={category} setCategory={setCategory}
              eventTime={eventTime} setEventTime={setEventTime}
              galleryImages={galleryImages} setGalleryImages={setGalleryImages}
              uploading={uploading}
              onGalleryUpload={handleGalleryUpload}
              onSubmit={handleCreateNews}
              onCancel={() => { setShowCreateForm(false); resetForm(); }}
              submitLabel="Publier"
              accentFocus="focus:ring-2 focus:ring-emerald-500"
              submitBg="bg-emerald-700 hover:bg-emerald-600"
            />
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((news) => (
            isLocked(news) ? (
              <LockedCard key={news.id} news={news} isLoggedIn={isLoggedIn} onJoin={goToJoin} />
            ) : (
              <ArticleCard
                key={news.id}
                news={news}
                isExpanded={expandedNewsId === news.id}
                onToggle={toggleExpanded}
                isAdmin={!!profile?.is_admin}
                onTogglePublic={toggleVisibility}
                onEdit={startEditNews}
                onMarkWon={(id) => markStatus(id, 'won')}
                onMarkLost={(id) => markStatus(id, 'lost')}
                onDelete={deleteNews}
                onLike={handleLike}
                onShare={handleShare}
                localLiked={!!localStorage.getItem(`liked_news_${news.id}`)}
                copied={copiedId === news.id}
              />
            )
          ))}
        </div>

        {visible.length === 0 && (
          <div className="bg-black rounded-lg p-8 text-center border border-gray-800">
            <Newspaper className="mx-auto text-gray-600 mb-3" size={48} />
            <p className="text-gray-400">Aucune actualité pour le moment</p>
          </div>
        )}

        {/* Historique - collapsible by month */}
        {(() => {
          const grouped = groupByMonthNews(validatedHistory);
          const sortedMonthKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
          if (sortedMonthKeys.length === 0) return null;
          return (
            <div className="mt-8">
              <h2 className="text-base font-bold text-white mb-3 uppercase">Historique</h2>
              {sortedMonthKeys.map((monthKey) => {
                const monthNews = grouped[monthKey];
                const won = monthNews.filter(n => n.status === 'won').length;
                const lost = monthNews.filter(n => n.status === 'lost').length;
                const total = monthNews.length;
                const isExpanded = expandedMonths.has(monthKey);
                return (
                  <div key={monthKey} className="mb-3">
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full flex items-center justify-between p-3 bg-gradient-to-br from-gray-900 to-black border border-emerald-700/50 rounded-lg hover:border-emerald-600 transition-colors"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {isExpanded
                          ? <ChevronDown className="text-emerald-500 flex-shrink-0" size={18} />
                          : <ChevronRight className="text-emerald-500 flex-shrink-0" size={18} />}
                        <h3 className="text-sm font-bold text-emerald-500 uppercase capitalize truncate">
                          {formatMonthYear(monthKey)}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap">({total} tickets)</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold text-emerald-500">{won}G</span>
                        <span className="text-xs font-semibold text-red-500">{lost}P</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                        {monthNews.map((news) => (
                          <ArticleCard
                            key={news.id}
                            news={news}
                            isExpanded={false}
                            onToggle={() => {}}
                            isAdmin={!!profile?.is_admin}
                            onTogglePublic={toggleVisibility}
                            onEdit={startEditNews}
                            onMarkWon={(id) => markStatus(id, 'won')}
                            onMarkLost={(id) => markStatus(id, 'lost')}
                            onDelete={deleteNews}
                            onLike={handleLike}
                            onShare={handleShare}
                            localLiked={!!localStorage.getItem(`liked_news_${news.id}`)}
                            copied={copiedId === news.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      <Footer />
    </div>
  );
}
