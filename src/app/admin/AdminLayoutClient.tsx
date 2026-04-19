'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Store,
  AlertTriangle,
  Image as ImageIcon,
  Settings,
  Menu,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminT } from './AdminI18nProvider';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useAdminT();
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: t('nav.users'), icon: Users },
    { href: '/admin/meals', label: t('nav.meals'), icon: UtensilsCrossed },
    { href: '/admin/restaurants', label: t('nav.restaurants'), icon: Store },
    { href: '/admin/reports', label: t('nav.reports'), icon: AlertTriangle, badge: 3 },
    { href: '/admin/photos', label: t('nav.photos'), icon: ImageIcon },
    { href: '/admin/settings', label: t('nav.settings'), icon: Settings },
  ];

  // Get page name from pathname for breadcrumb
  const getPageLabel = () => {
    if (pathname === '/admin') return t('nav.dashboard');
    const path = pathname.replace('/admin/', '');
    const navItem = navItems.find(item => !item.exact && pathname.startsWith(item.href));
    return navItem?.label || path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-dark/95 backdrop-blur-xl border-r border-primary/30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-gray/30">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-mint rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-lg">🍸</span>
              </div>
              <div>
                <span className="text-base font-bold text-white">
                  Drink<span className="text-primary">Together</span>
                </span>
                <span className="block text-[10px] text-gray-light font-medium tracking-wider uppercase">{t('layout.adminPanel')}</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4.5 h-4.5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-light hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    isActive
                      ? 'bg-primary/20'
                      : 'group-hover:bg-white/5'
                  )}>
                    <Icon className={cn(
                      'w-4 h-4',
                      isActive ? 'text-primary' : 'text-gray-light group-hover:text-white'
                    )} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-primary/60" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="px-3 py-4 border-t border-gray/30">
            {/* View frontend link */}
            <Link
              href="/en"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-light hover:bg-white/5 hover:text-white transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
              <span className="flex-1">{t('layout.viewFrontend')}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen bg-dark">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 glass border-b border-primary/30">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-1.5 text-sm">
                <Link href="/admin" className="text-gray-light hover:text-white transition-colors">{t('layout.admin')}</Link>
                {pathname !== '/admin' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-light" />
                    <span className="text-white font-medium">
                      {getPageLabel()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
                <Bell className="w-5 h-5 text-gray-light" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full animate-pulse" />
              </button>
              {/* Admin avatar */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-gray/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-xs font-bold text-white">A</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-white">Admin</p>
                  <p className="text-[11px] text-gray-light">{t('layout.superAdmin')}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
}
