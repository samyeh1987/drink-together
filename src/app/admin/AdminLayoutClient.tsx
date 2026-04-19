'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Store,
  AlertTriangle,
  Image as ImageIcon,
  Settings,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminT } from './AdminI18nProvider';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-dark/95 backdrop-blur-xl border-b border-primary/30">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-primary/30">
              <Image
                src="/logo.png"
                alt="DrinkTogether"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-white">
                Drink<span className="text-primary">Together</span>
              </span>
              <span className="hidden sm:block text-[10px] text-gray-light font-medium tracking-wider uppercase">{t('layout.adminPanel')}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-light hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-gray-light')} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side: notifications + admin */}
          <div className="flex items-center gap-2">
            {/* View frontend link */}
            <Link
              href="/en"
              target="_blank"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-light hover:bg-white/5 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>{t('layout.viewFrontend')}</span>
            </Link>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-light" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full animate-pulse" />
            </button>

            {/* Admin avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">Admin</p>
                <p className="text-[11px] text-gray-light">{t('layout.superAdmin')}</p>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-dark/95 backdrop-blur-xl border-b border-primary/30">
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-gray-light hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen bg-dark px-6 py-6">
        {children}
      </main>
    </>
  );
}
