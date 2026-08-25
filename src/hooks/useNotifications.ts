import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const POLL_INTERVAL = 30000;
const STORAGE_KEY = 'pronoexpert_last_check';

function getLastCheck(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const now = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, now);
  return now;
}

function setLastCheck(date: string) {
  localStorage.setItem(STORAGE_KEY, date);
}

async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showNotification(title: string, body: string) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/favicon.svg',
  });
}

async function checkForNewContent(lastCheck: string): Promise<string> {
  const now = new Date().toISOString();

  const { data: newPredictions } = await supabase
    .from('predictions')
    .select('id, is_public', { count: 'exact', head: false })
    .gt('created_at', lastCheck)
    .eq('status', 'pending');

  if (newPredictions && newPredictions.length > 0) {
    const publicOnes = newPredictions.filter(p => p.is_public);
    const vipOnes = newPredictions.filter(p => !p.is_public);

    if (publicOnes.length > 0) {
      showNotification(
        'Nouveau pronostic public',
        `${publicOnes.length} nouveau${publicOnes.length > 1 ? 'x' : ''} pronostic${publicOnes.length > 1 ? 's' : ''} disponible${publicOnes.length > 1 ? 's' : ''} !`
      );
    }
    if (vipOnes.length > 0) {
      showNotification(
        'Nouveau pronostic VIP',
        `${vipOnes.length} nouveau${vipOnes.length > 1 ? 'x' : ''} pronostic${vipOnes.length > 1 ? 's' : ''} VIP disponible${vipOnes.length > 1 ? 's' : ''} !`
      );
    }
  }

  const { data: newNews } = await supabase
    .from('news')
    .select('id, title')
    .gt('created_at', lastCheck)
    .eq('is_public', true);

  if (newNews && newNews.length > 0) {
    showNotification(
      'Nouvel article',
      newNews.length === 1
        ? newNews[0].title
        : `${newNews.length} nouveaux articles disponibles !`
    );
  }

  return now;
}

export function useNotifications() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    requestPermission();

    const poll = async () => {
      const lastCheck = getLastCheck();
      const newCheck = await checkForNewContent(lastCheck);
      setLastCheck(newCheck);
    };

    const timer = setTimeout(poll, 5000);
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
