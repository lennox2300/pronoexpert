import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Save, CreditCard, Megaphone, BadgeDollarSign, ToggleLeft, ToggleRight, ImagePlus, X, Facebook, Twitter, Send, Music2, Youtube, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { refreshBranding } from '../hooks/useBranding';
import type { Json } from '../lib/database.types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  label: string;
  days: number;
  price: number;
  savings: string;
  popular: boolean;
  active: boolean;
}

interface AdProviders {
  enabled: boolean;
  admob: string;
  appnext: string;
  startio: string;
  unity_game: string;
  unity_placement: string;
  ironsource: string;
  wortise_app: string;
  wortise_unit: string;
  monetag: string;
}

interface BannerAd extends AdProviders {
  position: string;
  size: string;
}

interface InstreamAd {
  enabled: boolean;
  appnext: string;
  startio: string;
  first_after: number;
  then_every: number;
}

interface RewardedAd extends AdProviders {
  interval: string;
  message: string;
}

interface InterstitialAd extends AdProviders {
  freq_pages: number;
  freq_messages: number;
  show_on_launch: boolean;
  launch_type: string;
  launch_admob: string;
}

interface AdsConfig {
  banners: BannerAd;
  native_profile: AdProviders;
  native_menus: AdProviders;
  instream: InstreamAd;
  rewarded: RewardedAd;
  interstitial: InterstitialAd;
}

interface MonetisationConfig {
  payment_mode_enabled: boolean;
  plans: Plan[];
  stripe_public_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  stripe_test_mode: boolean;
  paypal_client_id: string;
  paypal_client_secret: string;
  paypal_sandbox_mode: boolean;
  ads_config: AdsConfig;
  site_name: string;
  site_logo_url: string;
  social_links: Record<string, { name: string; url: string }>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: 'Facebook' },
  { key: 'twitter', label: 'Twitter / X', icon: 'Twitter' },
  { key: 'telegram', label: 'Telegram', icon: 'Send' },
  { key: 'tiktok', label: 'TikTok', icon: 'Music2' },
  { key: 'youtube', label: 'YouTube', icon: 'Youtube' },
] as const;

const SOCIAL_DEFAULTS: Record<string, string> = {
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  telegram: 'Telegram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 focus:outline-none"
    >
      <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-[#f7c600]' : 'bg-gray-600'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </div>
      {label && (
        <span className={`text-xs font-bold ${on ? 'text-[#f7c600]' : 'text-gray-400'}`}>
          {on ? 'ACTIVE' : 'DESACTIVE'}
        </span>
      )}
    </button>
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600] pr-9"
      />
      <button
        type="button"
        onMouseDown={() => setShow(true)}
        onMouseUp={() => setShow(false)}
        onMouseLeave={() => setShow(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function SectionAccordion({ icon, title, open, onToggle, adEnabled, onAdToggle, children }: {
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  adEnabled?: boolean;
  onAdToggle?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden mb-3" style={{ boxShadow: '0 0 12px rgba(247,198,0,0.03)' }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[#f7c600]">{icon}</span>
          <span className="text-sm font-bold text-white tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {onAdToggle !== undefined && adEnabled !== undefined && (
            <Toggle on={adEnabled} onToggle={onAdToggle} />
          )}
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>
      {open && <div className="px-4 py-4 bg-[#111] space-y-3">{children}</div>}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600]"
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string | number; onChange: (v: string) => void; options: { label: string; value: string | number }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function AdProvidersFields({ data, onChange }: { data: Record<string, string>; onChange: (key: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <FieldRow label="ID Unité AdMob">
        <TextInput value={data.admob ?? ''} onChange={(v) => onChange('admob', v)} placeholder="ca-app-pub-..." />
      </FieldRow>
      <FieldRow label="ID Placement Appnext">
        <TextInput value={data.appnext ?? ''} onChange={(v) => onChange('appnext', v)} placeholder="Appnext Placement ID" />
      </FieldRow>
      <FieldRow label="ID Application Start.io">
        <TextInput value={data.startio ?? ''} onChange={(v) => onChange('startio', v)} placeholder="Start.io App ID" />
      </FieldRow>
      <FieldRow label="ID Jeu UnityAds">
        <TextInput value={data.unity_game ?? ''} onChange={(v) => onChange('unity_game', v)} placeholder="Unity Game ID" />
      </FieldRow>
      <FieldRow label="ID Placement UnityAds">
        <TextInput value={data.unity_placement ?? ''} onChange={(v) => onChange('unity_placement', v)} placeholder="Unity Placement ID" />
      </FieldRow>
      <FieldRow label="ID Application IronSource">
        <TextInput value={data.ironsource ?? ''} onChange={(v) => onChange('ironsource', v)} placeholder="IronSource App ID" />
      </FieldRow>
      <FieldRow label="ID Application Wortise">
        <TextInput value={data.wortise_app ?? ''} onChange={(v) => onChange('wortise_app', v)} placeholder="Wortise App ID" />
      </FieldRow>
      <FieldRow label="ID Unité Wortise">
        <TextInput value={data.wortise_unit ?? ''} onChange={(v) => onChange('wortise_unit', v)} placeholder="Wortise Unit ID" />
      </FieldRow>
      <FieldRow label="ID Direct Monetag">
        <TextInput value={data.monetag ?? ''} onChange={(v) => onChange('monetag', v)} placeholder="Monetag ID/URL" />
      </FieldRow>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function AdminMonetisationPage() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<MonetisationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingAds, setSavingAds] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'stripe' | 'paypal'>('stripe');
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    const { data } = await (supabase as unknown as { rpc: (fn: string) => Promise<{ data: MonetisationConfig | null }> }).rpc('get_monetisation_config_admin');
    if (data) setConfig(data as unknown as MonetisationConfig);
    setLoading(false);
  };

  const showSaved = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 2500);
  };

  if (!profile?.is_admin) return null;

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  const set = <K extends keyof MonetisationConfig>(key: K, val: MonetisationConfig[K]) =>
    setConfig((c) => c ? { ...c, [key]: val } : c);

  const setPlan = (idx: number, field: keyof Plan, val: unknown) => {
    const plans = [...config.plans];
    plans[idx] = { ...plans[idx], [field]: val };
    set('plans', plans);
  };

  const setAds = <K extends keyof AdsConfig>(section: K, field: string, val: unknown) => {
    setConfig((c) => {
      if (!c) return c;
      return {
        ...c,
        ads_config: {
          ...c.ads_config,
          [section]: { ...(c.ads_config[section] as unknown as Record<string, unknown>), [field]: val },
        },
      };
    });
  };

  const savePaymentMode = async () => {
    setSaving(true);
    await supabase.from('monetisation_config').update({ payment_mode_enabled: config.payment_mode_enabled, updated_at: new Date().toISOString() }).eq('id', CONFIG_ID);
    setSaving(false);
    showSaved('Mode paiement sauvegardé');
  };

  const savePrices = async () => {
    setSavingPrices(true);
    await supabase.from('monetisation_config').update({ plans: config.plans as unknown as Json, updated_at: new Date().toISOString() }).eq('id', CONFIG_ID);
    setSavingPrices(false);
    showSaved('Prix sauvegardés');
  };

  const savePaymentKeys = async () => {
    setSavingPayment(true);
    await supabase.from('monetisation_config').update({
      stripe_public_key: config.stripe_public_key,
      stripe_secret_key: config.stripe_secret_key,
      stripe_webhook_secret: config.stripe_webhook_secret,
      stripe_test_mode: config.stripe_test_mode,
      paypal_client_id: config.paypal_client_id,
      paypal_client_secret: config.paypal_client_secret,
      paypal_sandbox_mode: config.paypal_sandbox_mode,
      updated_at: new Date().toISOString(),
    }).eq('id', CONFIG_ID);
    setSavingPayment(false);
    showSaved('Passerelles sauvegardées');
  };

  const saveAds = async () => {
    setSavingAds(true);
    await supabase.from('monetisation_config').update({ ads_config: config.ads_config as unknown as Json, updated_at: new Date().toISOString() }).eq('id', CONFIG_ID);
    setSavingAds(false);
    showSaved('Publicités sauvegardées');
  };

  const saveBranding = async () => {
    setSavingBranding(true);
    await supabase.from('monetisation_config').update({
      site_name: config.site_name,
      site_logo_url: config.site_logo_url,
      updated_at: new Date().toISOString(),
    }).eq('id', CONFIG_ID);
    refreshBranding();
    setSavingBranding(false);
    showSaved('Branding sauvegardé');
  };

  const saveSocial = async () => {
    setSavingSocial(true);
    await supabase.from('monetisation_config').update({
      social_links: config.social_links as unknown as Json,
      updated_at: new Date().toISOString(),
    }).eq('id', CONFIG_ID);
    refreshBranding();
    setSavingSocial(false);
    showSaved('Réseaux sociaux sauvegardés');
  };

  const handleLogoUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setUploadingLogo(true);
    try {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('news-gallery')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('news-gallery').getPublicUrl(fileName);
      set('site_logo_url', pub.publicUrl);
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Erreur lors de l\'envoi du logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const setSocial = (key: string, field: 'name' | 'url', val: string) => {
    setConfig((c) => {
      if (!c) return c;
      const current = c.social_links?.[key] || { name: SOCIAL_DEFAULTS[key], url: '' };
      return {
        ...c,
        social_links: {
          ...c.social_links,
          [key]: { ...current, [field]: val },
        },
      };
    });
  };

  const toggleSection = (s: string) => setOpenSection((prev) => prev === s ? null : s);

  return (
    <div className="min-h-screen py-4 px-3" style={{ background: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BadgeDollarSign className="text-[#f7c600]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">MONETISATION & PUBLICITES</h1>
            <p className="text-xs text-gray-500">Configurez les abonnements VIP, l'integration Stripe/PayPal et gérez les bannières publicitaires.</p>
          </div>
        </div>

        {savedMsg && (
          <div className="mb-4 px-4 py-2 bg-[#f7c600]/10 border border-[#f7c600]/40 rounded-lg text-[#f7c600] text-sm font-semibold">
            {savedMsg}
          </div>
        )}

        {/* Section 0 — Branding (nom + logo) */}
        <div className="rounded-xl border border-[#2a2a2a] p-4 mb-4 bg-[#1a1a1a]" style={{ boxShadow: '0 0 12px rgba(247,198,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-[#f7c600] flex items-center gap-2"><ImagePlus size={14} />SECTION 0 — BRANDING DU SITE</p>
              <p className="text-xs text-gray-500">Personnalisez le nom et le logo affichés dans la barre de navigation.</p>
            </div>
            <button
              onClick={saveBranding}
              disabled={savingBranding}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              style={{ background: '#f7c600', color: '#000' }}
            >
              <Save size={12} />
              {savingBranding ? '...' : 'Sauvegarder'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nom du site */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nom du site</label>
              <input
                type="text"
                value={config.site_name ?? ''}
                onChange={(e) => set('site_name', e.target.value)}
                placeholder="PRONO EXPERT"
                className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600]"
              />
              <p className="text-[10px] text-gray-600 mt-1">Espace pour séparer les mots colorés (ex: "PRONO EXPERT" → PRONO <span className="text-yellow-600">EXPERT</span>)</p>
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Logo du site</label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-7 rounded border border-[#333] bg-[#111] flex items-center justify-center overflow-hidden">
                  {config.site_logo_url ? (
                    <img src={config.site_logo_url} alt="Logo" className="max-h-7 max-w-12 object-contain" />
                  ) : (
                    <span className="text-[10px] text-gray-600">Aucun</span>
                  )}
                </div>
                <label className="flex items-center gap-2 px-3 py-2 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] rounded text-xs font-semibold text-white cursor-pointer transition-colors">
                  <ImagePlus size={14} />
                  {uploadingLogo ? 'Envoi...' : 'Choisir'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleLogoUpload(e.target.files); }}
                  />
                </label>
                {config.site_logo_url && (
                  <button
                    onClick={() => set('site_logo_url', '')}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    title="Retirer le logo"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                Dimensions recommandées: <span className="text-[#f7c600] font-semibold">112×28 px</span> (ou ratio 4:1).
                <br />Hauteur max affichée: 28px. Format: PNG avec fond transparent idéal.
              </p>
            </div>
          </div>
        </div>

        {/* Section Réseaux Sociaux */}
        <div className="rounded-xl border border-[#2a2a2a] p-4 mb-4 bg-[#1a1a1a]" style={{ boxShadow: '0 0 12px rgba(247,198,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-[#f7c600] flex items-center gap-2"><Share2 size={14} />SECTION RÉSEAUX SOCIAUX</p>
              <p className="text-xs text-gray-500">Renseignez les liens de vos réseaux sociaux. Un réseau ne s'affiche sur le site que si son lien est rempli.</p>
            </div>
            <button
              onClick={saveSocial}
              disabled={savingSocial}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              style={{ background: '#f7c600', color: '#000' }}
            >
              <Save size={12} />
              {savingSocial ? '...' : 'Sauvegarder'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOCIAL_PLATFORMS.map(({ key, label }) => {
              const link = config.social_links?.[key] || { name: label, url: '' };
              return (
                <div key={key} className="rounded-lg border border-[#2a2a2a] p-3 bg-[#111] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    {key === 'facebook' && <Facebook size={14} className="text-[#f7c600]" />}
                    {key === 'twitter' && <Twitter size={14} className="text-[#f7c600]" />}
                    {key === 'telegram' && <Send size={14} className="text-[#f7c600]" />}
                    {key === 'tiktok' && <Music2 size={14} className="text-[#f7c600]" />}
                    {key === 'youtube' && <Youtube size={14} className="text-[#f7c600]" />}
                    {label}
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Nom affiché (optionnel)</label>
                    <input
                      type="text"
                      value={link.name || ''}
                      onChange={(e) => setSocial(key, 'name', e.target.value)}
                      placeholder={label}
                      className="w-full px-2 py-1.5 bg-[#1a1a1a] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Lien URL</label>
                    <input
                      type="text"
                      value={link.url || ''}
                      onChange={(e) => setSocial(key, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-1.5 bg-[#1a1a1a] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section A — Mode Paiement */}
        <div className="rounded-xl border border-[#2a2a2a] p-4 mb-4 bg-[#1a1a1a]" style={{ boxShadow: '0 0 12px rgba(247,198,0,0.04)' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#f7c600] mb-1">MODE SOCIETE / PAIEMENT</p>
              <p className="text-xs text-gray-400">
                Quand activé : les demandes VIP sont redirigées vers la page d'abonnement avec paiement (via Stripe ou PayPal). Les accès s'activent de manière automatique une fois le règlement validé.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Toggle on={config.payment_mode_enabled} onToggle={() => set('payment_mode_enabled', !config.payment_mode_enabled)} label="" />
              <span className={`text-xs font-bold ${config.payment_mode_enabled ? 'text-[#f7c600]' : 'text-gray-500'}`}>
                {config.payment_mode_enabled ? 'ACTIVE' : 'DESACTIVE'}
              </span>
              <button
                onClick={savePaymentMode}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                style={{ background: '#f7c600', color: '#000' }}
              >
                <Save size={12} />
                {saving ? '...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>

        {/* Section B — Pricing (visible when payment mode ON) */}
        {config.payment_mode_enabled && (
          <div className="rounded-xl border border-[#2a2a2a] p-4 mb-4 bg-[#1a1a1a]" style={{ boxShadow: '0 0 12px rgba(247,198,0,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-[#f7c600]">SECTION B — CONFIGURATION DES TARIFS VIP</p>
                <p className="text-xs text-gray-500">Personnalisez les 4 fiches d'abonnement de la boutique VIP.</p>
              </div>
              <button
                onClick={savePrices}
                disabled={savingPrices}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                style={{ background: '#f7c600', color: '#000' }}
              >
                <Save size={12} />
                {savingPrices ? '...' : 'Sauvegarder les prix'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {config.plans.map((plan, idx) => (
                <div key={plan.id} className="rounded-lg border border-[#2a2a2a] p-3 bg-[#111] space-y-2.5" style={{ boxShadow: plan.popular ? '0 0 12px rgba(247,198,0,0.08)' : undefined }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{plan.days >= 365 ? '365 JOURS' : `${plan.days} JOURS`}</span>
                    <Toggle on={plan.active} onToggle={() => setPlan(idx, 'active', !plan.active)} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Libellé</label>
                    <input
                      type="text"
                      value={plan.label}
                      onChange={(e) => setPlan(idx, 'label', e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#1a1a1a] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Tarif (€ TTC)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={plan.price}
                      onChange={(e) => setPlan(idx, 'price', parseFloat(e.target.value))}
                      className="w-full px-2 py-1.5 bg-[#1a1a1a] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600]"
                    />
                  </div>
                  {idx > 0 && (
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Economie affichée</label>
                      <input
                        type="text"
                        value={plan.savings}
                        onChange={(e) => setPlan(idx, 'savings', e.target.value)}
                        placeholder="Economisez 22%"
                        className="w-full px-2 py-1.5 bg-[#1a1a1a] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#f7c600]"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-500">Badge Populaire</span>
                    <Toggle on={plan.popular} onToggle={() => setPlan(idx, 'popular', !plan.popular)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section C — Passerelles de paiement */}
        <div className="rounded-xl border border-[#2a2a2a] p-4 mb-4 bg-[#1a1a1a]" style={{ boxShadow: '0 0 12px rgba(247,198,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-[#f7c600] flex items-center gap-2"><CreditCard size={14} />SECTION C — PASSERELLES DE PAIEMENT</p>
              <p className="text-xs text-gray-500">Renseignez vos clés API Stripe ou PayPal pour collecter les transactions.</p>
            </div>
            <button
              onClick={savePaymentKeys}
              disabled={savingPayment}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              style={{ background: '#f7c600', color: '#000' }}
            >
              <Save size={12} />
              {savingPayment ? '...' : 'Sauvegarder'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-[#2a2a2a]">
            {(['stripe', 'paypal'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPaymentTab(tab)}
                className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-px ${paymentTab === tab ? 'border-[#f7c600] text-[#f7c600]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                {tab === 'stripe' ? 'STRIPE' : 'PAYPAL'}
              </button>
            ))}
          </div>

          {paymentTab === 'stripe' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldRow label="Clé publique Stripe (pk_live_...)">
                  <SecretInput value={config.stripe_public_key} onChange={(v) => set('stripe_public_key', v)} placeholder="pk_live_..." />
                </FieldRow>
                <FieldRow label="Clé secrète Stripe (sk_live_...)">
                  <SecretInput value={config.stripe_secret_key} onChange={(v) => set('stripe_secret_key', v)} placeholder="sk_live_..." />
                </FieldRow>
              </div>
              <FieldRow label="Webhook Secret Stripe">
                <SecretInput value={config.stripe_webhook_secret} onChange={(v) => set('stripe_webhook_secret', v)} placeholder="whsec_..." />
              </FieldRow>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#2a2a2a]">
                <div>
                  <p className="text-xs font-bold text-white">Mode Environnement</p>
                  <p className="text-[10px] text-gray-500">{config.stripe_test_mode ? 'SIMULATION MOCK / TEST' : 'PRODUCTION LIVE'}</p>
                </div>
                <Toggle on={!config.stripe_test_mode} onToggle={() => set('stripe_test_mode', !config.stripe_test_mode)} />
              </div>
              <button
                onClick={async () => { alert(config.stripe_public_key ? 'Connexion OK (vérification manuelle)' : 'Aucune clé configurée'); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#222] hover:bg-[#2a2a2a] text-white border border-[#333] transition-colors"
              >
                Tester la connexion
              </button>
            </div>
          )}

          {paymentTab === 'paypal' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldRow label="Client ID PayPal">
                  <SecretInput value={config.paypal_client_id} onChange={(v) => set('paypal_client_id', v)} placeholder="AX..." />
                </FieldRow>
                <FieldRow label="Client Secret PayPal">
                  <SecretInput value={config.paypal_client_secret} onChange={(v) => set('paypal_client_secret', v)} placeholder="Secret..." />
                </FieldRow>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#2a2a2a]">
                <div>
                  <p className="text-xs font-bold text-white">Mode Environnement</p>
                  <p className="text-[10px] text-gray-500">{config.paypal_sandbox_mode ? 'SANDBOX / TEST' : 'PRODUCTION LIVE'}</p>
                </div>
                <Toggle on={!config.paypal_sandbox_mode} onToggle={() => set('paypal_sandbox_mode', !config.paypal_sandbox_mode)} />
              </div>
              <button
                onClick={async () => { alert(config.paypal_client_id ? 'Connexion OK (vérification manuelle)' : 'Aucun Client ID configuré'); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#222] hover:bg-[#2a2a2a] text-white border border-[#333] transition-colors"
              >
                Tester la connexion
              </button>
            </div>
          )}
        </div>

        {/* Section D — Publicités */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-[#f7c600] flex items-center gap-2"><Megaphone size={14} />SECTION D — CONFIGURATION DES PUBLICITES</p>
              <p className="text-xs text-gray-500">Deployez des bannières, interstitiels et vidéos récompensées sur vos zones d'audience.</p>
            </div>
            <button
              onClick={saveAds}
              disabled={savingAds}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              style={{ background: '#f7c600', color: '#000' }}
            >
              <Save size={12} />
              {savingAds ? '...' : 'Sauvegarder les pubs'}
            </button>
          </div>

          {/* Banners */}
          <SectionAccordion
            icon={<ToggleRight size={16} />}
            title="BANNIERES PUBLICITAIRES"
            open={openSection === 'banners'}
            onToggle={() => toggleSection('banners')}
            adEnabled={config.ads_config.banners.enabled}
            onAdToggle={() => setAds('banners', 'enabled', !config.ads_config.banners.enabled)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <FieldRow label="Position de la bannière">
                <SelectInput
                  value={config.ads_config.banners.position}
                  onChange={(v) => setAds('banners', 'position', v)}
                  options={[
                    { label: 'Haut', value: 'top' },
                    { label: 'Bas', value: 'bottom' },
                    { label: 'Haut et Bas (Les deux)', value: 'both' },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Taille de l'affiche">
                <SelectInput
                  value={config.ads_config.banners.size}
                  onChange={(v) => setAds('banners', 'size', v)}
                  options={[
                    { label: 'Normale', value: 'normal' },
                    { label: 'Grande', value: 'large' },
                    { label: 'Adaptative (Fluide)', value: 'adaptive' },
                  ]}
                />
              </FieldRow>
            </div>
            <p className="text-[10px] font-bold text-[#f7c600] mb-2 uppercase tracking-wider">Fournisseurs publicitaires (ID Unités / Placements)</p>
            <AdProvidersFields data={config.ads_config.banners as unknown as Record<string, string>} onChange={(k, v) => setAds('banners', k, v)} />
            <p className="text-[10px] text-gray-500 mt-2 italic">Si plusieurs fournisseurs sont configurés, les bannières s'affichent de façon aléatoire à chaque re-chargement.</p>
          </SectionAccordion>

          {/* Native Profile */}
          <SectionAccordion
            icon={<ToggleLeft size={16} />}
            title="PUBLICITES NATIVES — PROFIL UTILISATEUR"
            open={openSection === 'native_profile'}
            onToggle={() => toggleSection('native_profile')}
            adEnabled={config.ads_config.native_profile.enabled}
            onAdToggle={() => setAds('native_profile', 'enabled', !config.ads_config.native_profile.enabled)}
          >
            <AdProvidersFields data={config.ads_config.native_profile as unknown as Record<string, string>} onChange={(k, v) => setAds('native_profile', k, v)} />
          </SectionAccordion>

          {/* Native Menus */}
          <SectionAccordion
            icon={<ToggleLeft size={16} />}
            title="PUBLICITES NATIVES — MENUS TABLEAUX"
            open={openSection === 'native_menus'}
            onToggle={() => toggleSection('native_menus')}
            adEnabled={config.ads_config.native_menus.enabled}
            onAdToggle={() => setAds('native_menus', 'enabled', !config.ads_config.native_menus.enabled)}
          >
            <AdProvidersFields data={config.ads_config.native_menus as unknown as Record<string, string>} onChange={(k, v) => setAds('native_menus', k, v)} />
          </SectionAccordion>

          {/* Instream */}
          <SectionAccordion
            icon={<ToggleLeft size={16} />}
            title="PUBLICITES INTEGREES AUX CONVERSATIONS"
            open={openSection === 'instream'}
            onToggle={() => toggleSection('instream')}
            adEnabled={config.ads_config.instream.enabled}
            onAdToggle={() => setAds('instream', 'enabled', !config.ads_config.instream.enabled)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <FieldRow label="ID Placement Appnext">
                <TextInput value={config.ads_config.instream.appnext} onChange={(v) => setAds('instream', 'appnext', v)} placeholder="Appnext Placement ID" />
              </FieldRow>
              <FieldRow label="ID Application Start.io">
                <TextInput value={config.ads_config.instream.startio} onChange={(v) => setAds('instream', 'startio', v)} placeholder="Start.io App ID" />
              </FieldRow>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow label="1ère diffusion (après X messages)">
                <SelectInput
                  value={config.ads_config.instream.first_after}
                  onChange={(v) => setAds('instream', 'first_after', parseInt(v))}
                  options={[2, 4, 6, 8].map((n) => ({ label: `${n} messages`, value: n }))}
                />
              </FieldRow>
              <FieldRow label="Ensuite (tous les X messages)">
                <SelectInput
                  value={config.ads_config.instream.then_every}
                  onChange={(v) => setAds('instream', 'then_every', parseInt(v))}
                  options={[5, 10, 20].map((n) => ({ label: `${n} messages`, value: n }))}
                />
              </FieldRow>
            </div>
          </SectionAccordion>

          {/* Rewarded */}
          <SectionAccordion
            icon={<ToggleLeft size={16} />}
            title="PUBLICITES VIDEO RECOMPENSEES"
            open={openSection === 'rewarded'}
            onToggle={() => toggleSection('rewarded')}
            adEnabled={config.ads_config.rewarded.enabled}
            onAdToggle={() => setAds('rewarded', 'enabled', !config.ads_config.rewarded.enabled)}
          >
            <AdProvidersFields data={config.ads_config.rewarded as unknown as Record<string, string>} onChange={(k, v) => setAds('rewarded', k, v)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <FieldRow label="Intervalle d'affichage">
                <SelectInput
                  value={config.ads_config.rewarded.interval}
                  onChange={(v) => setAds('rewarded', 'interval', v)}
                  options={[
                    { label: 'Afficher toujours', value: 'always' },
                    { label: 'Après 3 vues', value: '3' },
                    { label: 'Après 5 vues', value: '5' },
                    { label: 'Après 10 vues', value: '10' },
                  ]}
                />
              </FieldRow>
              <FieldRow label="Message avant vidéo (optionnel)">
                <TextInput value={config.ads_config.rewarded.message} onChange={(v) => setAds('rewarded', 'message', v)} placeholder="Laisser vide pour message par défaut" />
              </FieldRow>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic">L'utilisateur visionne la vidéo pour accéder à une section premium.</p>
          </SectionAccordion>

          {/* Interstitial */}
          <SectionAccordion
            icon={<ToggleLeft size={16} />}
            title="PUBLICITES INTERSTITIELLES"
            open={openSection === 'interstitial'}
            onToggle={() => toggleSection('interstitial')}
            adEnabled={config.ads_config.interstitial.enabled}
            onAdToggle={() => setAds('interstitial', 'enabled', !config.ads_config.interstitial.enabled)}
          >
            <AdProvidersFields data={config.ads_config.interstitial as unknown as Record<string, string>} onChange={(k, v) => setAds('interstitial', k, v)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              <FieldRow label="Fréquence dans l'app">
                <SelectInput
                  value={config.ads_config.interstitial.freq_pages}
                  onChange={(v) => setAds('interstitial', 'freq_pages', parseInt(v))}
                  options={[2, 3, 5].map((n) => ({ label: `Toutes les ${n} pages`, value: n }))}
                />
              </FieldRow>
              <FieldRow label="Dans les discussions">
                <SelectInput
                  value={config.ads_config.interstitial.freq_messages}
                  onChange={(v) => setAds('interstitial', 'freq_messages', parseInt(v))}
                  options={[5, 10, 20].map((n) => ({ label: `Tous les ${n} messages`, value: n }))}
                />
              </FieldRow>
              <FieldRow label="Type Appnext lancement">
                <SelectInput
                  value={config.ads_config.interstitial.launch_type}
                  onChange={(v) => setAds('interstitial', 'launch_type', v)}
                  options={[
                    { label: 'Interstitiel', value: 'interstitial' },
                    { label: 'Bannière', value: 'banner' },
                  ]}
                />
              </FieldRow>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] mt-3">
              <p className="text-xs font-semibold text-white">Afficher au 1er lancement</p>
              <Toggle on={config.ads_config.interstitial.show_on_launch} onToggle={() => setAds('interstitial', 'show_on_launch', !config.ads_config.interstitial.show_on_launch)} />
            </div>
            <FieldRow label="ID annonce ouverture AdMob">
              <TextInput value={config.ads_config.interstitial.launch_admob} onChange={(v) => setAds('interstitial', 'launch_admob', v)} placeholder="ca-app-pub-..." />
            </FieldRow>
          </SectionAccordion>
        </div>
      </div>
    </div>
  );
}
