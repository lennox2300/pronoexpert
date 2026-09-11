import type { ReactNode } from 'react';

interface AutoScrollCarouselProps {
  children: ReactNode[];
  ariaLabel?: string;
  onItemClick?: () => void;
}

export function AutoScrollCarousel({ children, ariaLabel, onItemClick }: AutoScrollCarouselProps) {
  if (!children || children.length === 0) return null;
  const items = [...children, ...children];

  const duration = Math.max(50, children.length * 12);

  return (
    <div
      className="relative w-full overflow-hidden"
      role="region"
      aria-label={ariaLabel}
    >
      <div
        className="flex w-max gap-3 animate-marquee"
        style={{ animationDuration: `${duration}s` }}
      >
        {items.map((child, i) => (
          <div
            key={i}
            onClick={onItemClick}
            className={`min-w-[280px] sm:min-w-[300px] md:min-w-[320px] flex-shrink-0 ${onItemClick ? 'cursor-pointer' : ''}`}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
