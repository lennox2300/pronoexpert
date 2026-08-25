import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SocialLink {
  name: string;
  url: string;
}

interface Branding {
  site_name: string;
  site_logo_url: string;
  social_links: Record<string, SocialLink>;
}

const DEFAULT_BRANDING: Branding = {
  site_name: 'PRONO EXPERT',
  site_logo_url: '',
  social_links: {},
};

let cachedBranding: Branding | null = null;

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(cachedBranding ?? DEFAULT_BRANDING);

  useEffect(() => {
    if (cachedBranding) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc('get_site_branding');
        if (!cancelled && data) {
          const b = data as unknown as Partial<Branding>;
          cachedBranding = {
            site_name: b.site_name || 'PRONO EXPERT',
            site_logo_url: b.site_logo_url || '',
            social_links: b.social_links || {},
          };
          setBranding(cachedBranding);
        }
      } catch {
        // keep default
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return branding;
}

export function refreshBranding() {
  cachedBranding = null;
}
