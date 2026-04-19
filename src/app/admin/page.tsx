'use client';

import { useEffect, useState } from 'react';
import { useAdminT } from './AdminI18nProvider';
import {
  Users,
  UtensilsCrossed,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  XCircle,
  Store,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeMeals: number;
  mealsThisWeek: number;
  newUsersToday: number;
  cancelledMeals: number;
  completedMeals: number;
  totalMeals: number;
  totalPhotos: number;
  partnerRestaurants: number;
}

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  activeMeals: 0,
  mealsThisWeek: 0,
  newUsersToday: 0,
  cancelledMeals: 0,
  completedMeals: 0,
  totalMeals: 0,
  totalPhotos: 0,
  partnerRestaurants: 0,
};

export default function AdminDashboard() {
  const t = useAdminT();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const [usersRes, mealsRes, photosRes, restaurantsRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('meals').select('*'),
          supabase.from('meal_photos').select('*', { count: 'exact', head: true }),
          supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        ]);

        const totalUsers = usersRes.count || 0;
        const meals = mealsRes.data || [];
        const totalPhotos = photosRes.count || 0;
        const partnerRestaurants = restaurantsRes.count || 0;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        const mealsThisWeek = meals.filter((m) => new Date(m.datetime) >= weekAgo).length;
        const activeMeals = meals.filter((m) => ['open', 'confirmed', 'ongoing'].includes(m.status)).length;
        const cancelledMeals = meals.filter((m) => m.status === 'cancelled').length;
        const completedMeals = meals.filter((m) => m.status === 'completed').length;

        // New users today - query profiles created today
        const { count: newUsersToday } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart);

        setStats({
          totalUsers,
          activeMeals,
          mealsThisWeek,
          newUsersToday: newUsersToday || 0,
          cancelledMeals,
          completedMeals,
          totalMeals: meals.length,
          totalPhotos,
          partnerRestaurants,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const confirmationRate = stats.totalMeals > 0
    ? Math.round((stats.completedMeals / stats.totalMeals) * 100)
    : 0;
  const cancellationRate = stats.totalMeals > 0
    ? Math.round((stats.cancelledMeals / stats.totalMeals) * 100)
    : 0;

  const statsConfig = [
    { labelKey: 'dashboard.totalUsers', value: loading ? '...' : String(stats.totalUsers), icon: Users, color: 'from-blue-500 to-blue-600' },
    { labelKey: 'dashboard.activeMeals', value: loading ? '...' : String(stats.activeMeals), icon: UtensilsCrossed, color: 'from-[#FF6B35] to-[#FF6B6B]' },
    { labelKey: 'dashboard.mealsThisWeek', value: loading ? '...' : String(stats.mealsThisWeek), icon: TrendingUp, color: 'from-[#2EC4B6] to-[#5DD9CE]' },
    { labelKey: 'dashboard.newUsersToday', value: loading ? '...' : String(stats.newUsersToday), icon: UserPlus, color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.labelKey} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{t(stat.labelKey)}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                  {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Icon className="w-5 h-5 text-white" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#2EC4B6]" />
            <span className="text-xs text-gray-500 font-medium">{t('dashboard.confirmationRate')}</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{loading ? '--' : `${confirmationRate}%`}</p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
            <div className="h-1.5 bg-[#2EC4B6] rounded-full transition-all" style={{ width: `${confirmationRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-[#FF6B6B]" />
            <span className="text-xs text-gray-500 font-medium">{t('dashboard.cancellationRate')}</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{loading ? '--' : `${cancellationRate}%`}</p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
            <div className="h-1.5 bg-[#FF6B6B] rounded-full transition-all" style={{ width: `${cancellationRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-4 h-4 text-[#FFD700]" />
            <span className="text-xs text-gray-500 font-medium">{t('dashboard.partnerRestaurants')}</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{loading ? '...' : stats.partnerRestaurants}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">{t('dashboard.galleryPhotos')}</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{loading ? '...' : stats.totalPhotos}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Meals */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">{t('dashboard.recentMeals')}</h2>
            <span className="text-xs text-[#FF6B35] font-medium cursor-pointer hover:underline">{t('dashboard.viewAll')}</span>
          </div>
          <div className="px-5 py-12 text-center">
            {loading ? (
              <Loader2 className="w-8 h-8 text-[#FF6B35] mx-auto mb-3 animate-spin" />
            ) : stats.totalMeals > 0 ? (
              <p className="text-sm text-gray-500">
                {stats.totalMeals} meals total, {stats.activeMeals} active
              </p>
            ) : (
              <p className="text-sm text-gray-400">No meals created yet</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">{t('dashboard.newUsers')}</h2>
            <span className="text-xs text-[#FF6B35] font-medium cursor-pointer hover:underline">{t('dashboard.viewAll')}</span>
          </div>
          <div className="px-5 py-12 text-center">
            {loading ? (
              <Loader2 className="w-8 h-8 text-[#FF6B35] mx-auto mb-3 animate-spin" />
            ) : stats.totalUsers > 0 ? (
              <p className="text-sm text-gray-500">
                {stats.totalUsers} registered users
              </p>
            ) : (
              <p className="text-sm text-gray-400">No users registered yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
