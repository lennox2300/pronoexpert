import { useState, useRef, useEffect } from 'react';

export interface Suggestion {
  name: string;
  logo_url?: string | null;
  competition?: string | null;
  sport?: string | null;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: Suggestion) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  type?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  className = '',
  required,
  type = 'text',
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.trim()
    ? suggestions.filter(s =>
        s.name.toLowerCase().includes(value.toLowerCase().trim())
      )
    : suggestions;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.name);
    onSelect?.(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev <= 0 ? filtered.length - 1 : prev - 1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((s, i) => (
            <li
              key={i}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
                i === highlightedIndex ? 'bg-gray-600' : 'hover:bg-gray-600'
              }`}
            >
              {s.logo_url && (
                <img
                  src={s.logo_url}
                  alt=""
                  className="w-5 h-5 object-contain flex-shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <span className="text-white truncate">{s.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
