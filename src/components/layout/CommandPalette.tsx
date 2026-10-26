import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CornerDownLeft, Search, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PaletteSection {
  title: string;
  items: { name: string; path: string; icon: LucideIcon }[];
}

interface CommandPaletteProps {
  sections: PaletteSection[];
  onClose: () => void;
  /** Theme scope of the app opening the palette (the overlay is portalled outside it). */
  themeClassName?: string;
}

// Case- and accent-insensitive: "vehi" finds "Véhicules".
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function CommandPalette({ sections, onClose, themeClassName = 'theme-fleetops' }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return sections.flatMap((section) =>
      section.items
        .filter((item) => !q || normalize(`${item.name} ${section.title}`).includes(q))
        .map((item) => ({ ...item, section: section.title }))
    );
  }, [sections, query]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      go(results[activeIndex].path);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Portal: the blurred header would otherwise clip this fixed overlay to its own column.
  return createPortal(
    <div className={cn(themeClassName, 'fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]')}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Rechercher une page"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-lg bg-surface rounded-xl shadow-2xl border border-border overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page…"
            aria-label="Rechercher une page"
            className="flex-1 h-12 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-surface-2 px-1.5 text-[10px] font-medium text-text-muted">Échap</kbd>
        </div>

        <ul ref={listRef} className="max-h-80 overflow-y-auto custom-scrollbar p-2" role="listbox">
          {results.map((item, index) => (
            <li key={item.path} data-index={index} role="option" aria-selected={index === activeIndex}>
              <button
                onClick={() => go(item.path)}
                onMouseMove={() => setActiveIndex(index)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 h-10 rounded-lg text-left text-sm transition-colors',
                  index === activeIndex ? 'bg-primary/10 text-primary' : 'text-text-primary'
                )}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', index === activeIndex ? 'text-primary' : 'text-text-muted')} />
                <span className="flex-1 font-medium">{item.name}</span>
                <span className="text-xs text-text-muted">{item.section}</span>
                {index === activeIndex && <CornerDownLeft className="w-3.5 h-3.5 text-primary" />}
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-text-secondary">Aucune page ne correspond à « {query} ».</li>
          )}
        </ul>
      </motion.div>
    </div>,
    document.body
  );
}
