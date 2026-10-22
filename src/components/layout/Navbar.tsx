import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { CommandPalette } from './CommandPalette';
import { findNavEntry, getNavForRole, ROLE_LABELS } from './fleetNav';

interface NavbarProps {
  onMenuClick: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const documentAlerts = useDocumentStore(s => s.documents.filter(d => d.status !== 'valide').length);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const entry = findNavEntry(location.pathname);
  const sections = user ? getNavForRole(user.role) : [];
  const canOpenSettings = sections.some(s => s.items.some(i => i.path === '/parametres'));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsUserMenuOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isUserMenuOpen]);

  useEffect(() => setIsUserMenuOpen(false), [location.pathname]);

  const initials = user?.avatarInitials || `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <header className="relative z-30 h-16 shrink-0 bg-surface/90 backdrop-blur border-b border-border flex items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
          className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-surface-2 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        {entry && (
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm min-w-0">
            <span className="hidden sm:inline text-text-muted">{entry.section.title}</span>
            <span className="hidden sm:inline text-border-strong">/</span>
            <span className="font-semibold text-text-primary truncate">{entry.item.name}</span>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setIsPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 h-9 w-56 lg:w-64 px-3 rounded-lg border border-border bg-surface-2 text-sm text-text-muted hover:border-border-strong transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left whitespace-nowrap">Rechercher…</span>
          <kbd className="whitespace-nowrap rounded border border-border bg-surface px-1.5 text-[10px] font-medium">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>
        <button
          onClick={() => setIsPaletteOpen(true)}
          aria-label="Rechercher une page"
          className="sm:hidden p-2 text-text-secondary hover:bg-surface-2 rounded-lg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        <Link
          to="/conformite"
          aria-label={documentAlerts > 0 ? `${documentAlerts} document(s) expiré(s) ou à renouveler` : 'Conformité : aucune alerte'}
          title={documentAlerts > 0 ? `${documentAlerts} document(s) expiré(s) ou à renouveler` : 'Aucune alerte de conformité'}
          className="relative p-2 text-text-secondary hover:bg-surface-2 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {documentAlerts > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold leading-4 text-center ring-2 ring-surface">
              {documentAlerts > 99 ? '99+' : documentAlerts}
            </span>
          )}
        </Link>

        <div ref={userMenuRef} className="relative pl-2 sm:pl-3 border-l border-border">
          <button
            onClick={() => setIsUserMenuOpen(open => !open)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            className="flex items-center gap-3 rounded-lg p-1 pr-2 hover:bg-surface-2 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs">
              {initials}
            </span>
            <span className="hidden md:block text-left leading-tight">
              <span className="block text-sm font-medium text-text-primary">{user?.prenom} {user?.nom}</span>
              <span className="block text-xs text-text-muted">{user ? ROLE_LABELS[user.role] : ''}</span>
            </span>
            <ChevronDown className="hidden md:block w-4 h-4 text-text-muted" />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-60 bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50"
              >
                <div className="px-3 py-2.5 border-b border-border mb-1.5">
                  <div className="text-sm font-semibold text-text-primary truncate">{user?.prenom} {user?.nom}</div>
                  <div className="text-xs text-text-muted truncate">{user?.email}</div>
                </div>
                {canOpenSettings && (
                  <Link
                    to="/parametres"
                    role="menuitem"
                    className="flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-text-primary hover:bg-surface-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-text-muted" />
                    Paramètres du compte
                  </Link>
                )}
                <button
                  onClick={logout}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isPaletteOpen && <CommandPalette sections={sections} onClose={() => setIsPaletteOpen(false)} />}
      </AnimatePresence>
    </header>
  );
}
