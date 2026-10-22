import { Link, useLocation } from 'react-router-dom';
import { Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/useAuthStore';
import { BrandMark } from '../Logo';
import { getNavForRole } from './fleetNav';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const sections = getNavForRole(user.role);

  const SidebarContent = (
    <aside className="w-64 h-full bg-sidebar text-sidebar-text flex flex-col border-r border-white/5">
      {/* Brand */}
      <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-3">
          <BrandMark className="w-9 h-9 rounded-lg shadow-lg shadow-black/20" />
          <div className="leading-tight">
            <div className="text-white font-semibold tracking-tight">FleetOps</div>
            <div className="text-xs text-sidebar-text/70">Afro Négoce</div>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="md:hidden p-2 -mr-2 text-sidebar-text hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Navigation FleetOps" className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/50">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors',
                        isActive ? 'bg-white/10 text-white' : 'text-sidebar-text hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="fleet-nav-indicator"
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-afro-green"
                        />
                      )}
                      <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-white' : 'text-sidebar-text/70')} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-white/5">
        <Link
          to="/"
          className="flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-white/5 hover:text-white transition-colors"
        >
          <Globe className="w-[18px] h-[18px] text-sidebar-text/70" />
          Site Afro Négoce
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute left-0 top-0 bottom-0 max-w-[85vw]"
            >
              {SidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
