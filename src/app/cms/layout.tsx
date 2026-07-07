import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Settings, ArrowLeft, Image as ImageIcon, Newspaper } from 'lucide-react';
import { AfroNegoceLogo } from '../../components/Logo';
import { PasswordGate } from '../../components/PasswordGate';

export default function CMSLayout() {
  const location = useLocation();

  const menuItems = [
    { name: 'Tableau de bord', path: '/cms', icon: LayoutDashboard },
    { name: 'Identité Visuelle', path: '/cms/identity', icon: ImageIcon },
    { name: 'Notre Histoire', path: '/cms/history', icon: History },
    { name: 'Actualités', path: '/cms/news', icon: Newspaper },
    { name: 'Paramètres', path: '/cms/settings', icon: Settings },
  ];

  return (
    <PasswordGate unlockKey="cms_unlocked" expectedPassword="aziz123">
      <div className="min-h-screen bg-[#FAFAFA] flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <AfroNegoceLogo className="w-8 h-8" />
              <span className="text-lg font-black uppercase font-display text-slate-900">CMS Admin</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <Link 
              to="/afro-digital" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour Afro Digital
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto min-h-screen">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </PasswordGate>
  );
}
