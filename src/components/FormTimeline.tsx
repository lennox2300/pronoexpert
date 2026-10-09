import { useEffect, useRef, useState, useCallback } from 'react';
type FormTicket = {
  id: string;
  status: string;
  created_at: string;
  event_time?: string | null;
  validated_at?: string | null;
  matches?: Array<{ match_date: string | null }>;
};

const DAYS_BACK = 14;
const RETURN_DELAY = 10000;
const JOURS_FR = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

interface DayGroup {
  date: Date;
  dayKey: string;
  results: ('win' | 'loss')[];
  isToday: boolean;
  isVeille: boolean;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(d: Date): string {
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
}

export function FormTimeline({ tickets }: { tickets: FormTicket[] }) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const veilleCardRef = useRef<HTMLDivElement>(null);
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userScrollingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const [currentDayKey, setCurrentDayKey] = useState(() => dayKey(new Date()));

  const centerOnVeille = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!veilleCardRef.current || !timelineRef.current) return;
    const card = veilleCardRef.current;
    const container = timelineRef.current;
    const targetScroll = card.offsetLeft - (container.clientWidth / 2) + (card.offsetWidth / 2);
    container.scrollTo({ left: targetScroll, behavior });
  }, []);

  const resetReturnTimer = useCallback(() => {
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    returnTimerRef.current = setTimeout(() => {
      centerOnVeille('smooth');
      userScrollingRef.current = false;
    }, RETURN_DELAY);
  }, [centerOnVeille]);

  // R12: detect day change
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const key = dayKey(now);
      setCurrentDayKey(previous => previous === key ? previous : key);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // R3: center on veille after mount
  useEffect(() => {
    const t = setTimeout(() => centerOnVeille('auto'), 100);
    return () => clearTimeout(t);
  }, [centerOnVeille, currentDayKey]);

  // Cleanup return timer on unmount
  useEffect(() => {
    return () => {
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    };
  }, []);

  // Build day groups from tickets data
  const groups: DayGroup[] = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group tickets by day
    const byDay: Record<string, ('win' | 'loss')[]> = {};
    for (const t of tickets) {
      const rawDate = t.matches?.[0]?.match_date || t.event_time || t.created_at;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) continue;
      d.setHours(0, 0, 0, 0);
      const key = dayKey(d);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(t.status === 'won' ? 'win' : 'loss');
    }

    const result: DayGroup[] = [];
    for (let offset = -DAYS_BACK; offset <= 0; offset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      const key = dayKey(d);
      const isToday = offset === 0;
      const isVeille = offset === -1;
      const results = byDay[key] || [];

      // Past days remain visible even when no bets were played.
      // Today shows "En attente" if no results, or results if they exist.
      result.push({
        date: new Date(d),
        dayKey: key,
        results,
        isToday,
        isVeille,
      });
    }

    return result;
  })();

  if (groups.length === 0) {
    return (
      <div className="mb-4">
        <div className="text-[10px] text-gray-600 py-2">Aucun resultat encore</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* R10: Scroll zone with edge fades */}
      <div className="relative w-full overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 w-5 pointer-events-none z-5"
          style={{ background: 'linear-gradient(to right, #0f0f0f, transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-5 pointer-events-none z-5"
          style={{ background: 'linear-gradient(to left, #0f0f0f, transparent)' }}
        />

        {/* R9: Scrollable timeline */}
        <div
          ref={timelineRef}
          className="flex gap-1.5 overflow-x-auto overflow-y-hidden px-5 pb-2.5 pt-1.5 scrollbar-hide cursor-grab"
          style={{
            touchAction: 'pan-x',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '400px',
          }}
          onMouseDown={(e) => {
            if (!timelineRef.current) return;
            isDraggingRef.current = true;
            userScrollingRef.current = true;
            e.currentTarget.classList.add('cursor-grabbing');
            dragStartRef.current = {
              x: e.pageX - e.currentTarget.offsetLeft,
              scrollLeft: e.currentTarget.scrollLeft,
            };
            if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
          }}
          onMouseLeave={(e) => {
            isDraggingRef.current = false;
            e.currentTarget.classList.remove('cursor-grabbing');
            if (userScrollingRef.current) resetReturnTimer();
          }}
          onMouseUp={(e) => {
            isDraggingRef.current = false;
            e.currentTarget.classList.remove('cursor-grabbing');
            resetReturnTimer();
          }}
          onMouseMove={(e) => {
            if (!isDraggingRef.current || !timelineRef.current) return;
            e.preventDefault();
            const x = e.pageX - timelineRef.current.offsetLeft;
            const walk = (x - dragStartRef.current.x) * 1.5;
            timelineRef.current.scrollLeft = dragStartRef.current.scrollLeft - walk;
          }}
          onTouchStart={() => {
            userScrollingRef.current = true;
            if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
          }}
          onTouchEnd={() => resetReturnTimer()}
          onWheel={(e) => {
            if (!timelineRef.current) return;
            e.preventDefault();
            userScrollingRef.current = true;
            timelineRef.current.scrollLeft += e.deltaY;
            if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
            resetReturnTimer();
          }}
          onScroll={() => {
            if (!userScrollingRef.current) return;
            if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
            resetReturnTimer();
          }}
        >
          {groups.map((g) => (
            <div
              key={g.dayKey}
              ref={g.isVeille ? veilleCardRef : undefined}
              className={`flex-shrink-0 rounded-[10px] px-1 py-1.5 flex flex-col items-center border-[1.5px] relative transition-all ${
                g.isVeille
                  ? 'border-[#00e676] bg-[#1e2a1e]'
                  : 'border-transparent bg-[#1a1a1a]'
              }`}
              style={
                g.isVeille
                  ? { boxShadow: '0 0 8px rgba(0,230,118,0.25)', minWidth: '56px' }
                  : { minWidth: '56px' }
              }
            >
              {/* R7: Today badge */}
              {g.isToday && (
                <div
                  className="absolute -top-1.5 text-[7px] font-bold uppercase px-1 py-0.5 rounded-sm"
                  style={{ background: '#ff9800', color: '#000' }}
                >
                  Auj
                </div>
              )}

              {/* Day name */}
              <span
                className={`text-[9px] font-bold uppercase tracking-[0.3px] ${g.isVeille ? 'text-[#00e676]' : 'text-gray-500'}`}
              >
                {JOURS_FR[g.date.getDay()]}
              </span>

              {/* Date */}
              <span className="text-[8px] text-gray-600 mt-px">{fmtDate(g.date)}</span>

              {/* R1/R7/R8: Results */}
              <div className="flex flex-wrap gap-[2px] justify-center mt-1 min-h-[8px] max-w-full">
                {g.isToday && g.results.length === 0 ? (
                  <span className="text-[8px] text-[#ff9800] font-bold">En attente</span>
                ) : (
                  g.results.map((r, i) => (
                    <span
                      key={i}
                      className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                      style={{ background: r === 'win' ? '#00e676' : '#ff4444' }}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="text-center text-[9px] text-gray-600 mt-1">glisse pour voir plus</div>
    </div>
  );
}
