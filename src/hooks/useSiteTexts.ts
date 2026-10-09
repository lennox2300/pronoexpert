import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteText {
  label: string;
  content: string;
  category: string;
  is_rich: boolean;
}

type SiteTextsMap = Record<string, SiteText>;

const DEFAULT_TEXTS: SiteTextsMap = {};

let cachedTexts: SiteTextsMap | null = null;
const listeners = new Set<(texts: SiteTextsMap) => void>();

export function useSiteTexts() {
  const [texts, setTexts] = useState<SiteTextsMap>(cachedTexts ?? DEFAULT_TEXTS);

  useEffect(() => {
    if (cachedTexts) {
      setTexts(cachedTexts);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc('get_site_texts');
        if (!cancelled && data) {
          cachedTexts = data as unknown as SiteTextsMap;
          setTexts(cachedTexts);
        }
      } catch {
        // keep defaults
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return texts;
}

export function getSiteText(key: string, fallback: string): string {
  if (cachedTexts && cachedTexts[key]) {
    return cachedTexts[key].content;
  }
  return fallback;
}

export function refreshSiteTexts() {
  cachedTexts = null;
  (async () => {
    try {
      const { data } = await supabase.rpc('get_site_texts');
      if (data) {
        cachedTexts = data as unknown as SiteTextsMap;
        listeners.forEach(fn => fn(cachedTexts!));
      }
    } catch {
      // ignore
    }
  })();
}
