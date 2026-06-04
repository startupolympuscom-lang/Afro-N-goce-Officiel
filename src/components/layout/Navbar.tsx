import { Bell, Search, Menu, UserCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-surface-2 rounded-md transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden sm:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher (Cmd+K)..." 
            className="w-full h-9 pl-9 pr-4 rounded-md border border-border bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-text-secondary hover:bg-surface-2 rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-surface"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="hidden md:block text-right">
            <div className="text-sm font-medium text-text-primary">{user?.nom} {user?.prenom}</div>
            <div className="text-xs text-text-muted capitalize">{user?.role.replace('_', ' ')}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
            {user?.avatarInitials || 'U'}
          </div>
          <button 
            onClick={logout}
            className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-full transition-colors md:hidden"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
