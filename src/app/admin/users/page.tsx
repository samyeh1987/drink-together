'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, Eye, Ban, ShieldCheck, ShieldAlert,
  ChevronDown, ChevronUp, X, UserCheck, UserX, TrendingUp,
  Calendar, Star, AlertTriangle, MoreVertical,
  Download, UserPlus,
} from 'lucide-react';
import { cn, getCreditLevel } from '@/lib/utils';
import { ADMIN_STATUS_COLORS, type AdminUser } from '../data';
import { useAdminT } from '../AdminI18nProvider';

type SortField = 'credit_score' | 'created_at' | 'total_meals_hosted' | 'total_meals_joined' | 'no_show_count';
type SortDir = 'asc' | 'desc';

interface ProfileWithStats extends AdminUser {
  total_meals_hosted: number;
  total_meals_joined: number;
  no_show_count: number;
  last_active: string;
}

export default function AdminUsersPage() {
  const t = useAdminT();
  const [users, setUsers] = useState<ProfileWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('credit_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedUser, setSelectedUser] = useState<ProfileWithStats | null>(null);
  const [creditModal, setCreditModal] = useState<{ user: ProfileWithStats; amount: number; reason: string } | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Enrich with meal counts
          const { data: mealCounts } = await supabase
            .from('meals')
            .select('creator_id, status');

          const hostedMap: Record<string, number> = {};
          const cancelledMap: Record<string, number> = {};
          if (mealCounts) {
            for (const m of mealCounts) {
              hostedMap[m.creator_id] = (hostedMap[m.creator_id] || 0) + 1;
            }
          }

          const { data: participations } = await supabase
            .from('meal_participants')
            .select('user_id, status');

          const joinedMap: Record<string, number> = {};
          const noShowMap: Record<string, number> = {};
          if (participations) {
            for (const p of participations) {
              if (p.status === 'approved' || p.status === 'no_show') {
                joinedMap[p.user_id] = (joinedMap[p.user_id] || 0) + 1;
              }
              if (p.status === 'no_show') {
                noShowMap[p.user_id] = (noShowMap[p.user_id] || 0) + 1;
              }
            }
          }

          const enriched: ProfileWithStats[] = data.map((p) => ({
            id: p.id,
            email: p.email || '',
            nickname: p.nickname,
            avatar_url: p.avatar_url,
            age_range: p.age_range,
            occupation: p.occupation,
            bio: p.bio,
            languages_spoken: p.languages_spoken || [],
            credit_score: p.credit_score || 100,
            email_verified: p.email_verified ?? false,
            created_at: p.created_at,
            status: 'active' as const,
            total_meals_hosted: hostedMap[p.id] || 0,
            total_meals_joined: joinedMap[p.id] || 0,
            no_show_count: noShowMap[p.id] || 0,
            last_active: p.created_at,
          }));

          setUsers(enriched);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.nickname?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(u => u.status === statusFilter);
    }
    list.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const aNum = typeof aVal === 'number' ? aVal : Number(aVal);
      const bNum = typeof bVal === 'number' ? bVal : Number(bVal);
      return sortDir === 'asc' ? (aNum > bNum ? 1 : -1) : (aNum < bNum ? 1 : -1);
    });
    return list;
  }, [users, search, statusFilter, sortBy, sortDir]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    banned: users.filter(u => u.status === 'banned').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    avgCredit: users.length > 0 ? Math.round(users.reduce((s, u) => s + u.credit_score, 0) / users.length) : 0,
  }), [users]);

  const handleBanUser = async (user: ProfileWithStats) => {
    if (!confirm(`Ban user "${user.nickname || user.email}"?`)) return;
    setActionLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'banned' })
        .eq('id', user.id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'banned' as const } : u));
      setSelectedUser(null);
      setActionMenu(null);
    } catch (err) {
      console.error('Failed to ban user:', err);
      alert('Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateUser = async (user: ProfileWithStats) => {
    setActionLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', user.id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'active' as const } : u));
      setSelectedUser(null);
      setActionMenu(null);
    } catch (err) {
      console.error('Failed to reactivate user:', err);
      alert('Failed to reactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustCredit = async () => {
    if (!creditModal || creditModal.amount === 0) return;
    setActionLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const newScore = creditModal.user.credit_score + creditModal.amount;
      const { error } = await supabase
        .from('profiles')
        .update({ credit_score: newScore })
        .eq('id', creditModal.user.id);
      if (error) throw error;
      // Insert credit history
      await supabase.from('credit_history').insert({
        user_id: creditModal.user.id,
        change_amount: creditModal.amount,
        new_score: newScore,
        reason: creditModal.reason || `Admin adjustment: ${creditModal.amount > 0 ? '+' : ''}${creditModal.amount}`,
      });
      setUsers(prev => prev.map(u => u.id === creditModal.user.id ? { ...u, credit_score: newScore } : u));
      setCreditModal(null);
    } catch (err) {
      console.error('Failed to adjust credit:', err);
      alert('Failed to adjust credit score');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronDown className="w-3.5 h-3.5 text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#FF6B35]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#FF6B35]" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('users.title')}</h1>
          <p className="text-sm text-gray-light mt-1">{t('users.subtitle')}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors">
          <Download className="w-4 h-4" /> {t('users.exportCsv')}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: t('users.totalUsers'), value: stats.total, icon: UserPlus, color: 'from-primary to-pink-400' },
          { label: t('users.active'), value: stats.active, icon: UserCheck, color: 'from-mint to-cyan-400' },
          { label: t('users.banned'), value: stats.banned, icon: UserX, color: 'from-red-500 to-red-600' },
          { label: t('users.suspended'), value: stats.suspended, icon: ShieldAlert, color: 'from-gold to-yellow-400' },
          { label: t('users.avgCredit'), value: stats.avgCredit, icon: TrendingUp, color: 'from-coral to-pink-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card glass p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs text-gray-light font-medium">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-light" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white placeholder:text-gray-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-light hover:text-white" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-light" />
          {[
            { key: 'all', label: t('users.all') },
            { key: 'active', label: t('users.active') },
            { key: 'banned', label: t('users.banned') },
            { key: 'suspended', label: t('users.suspended') },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize',
                statusFilter === s.key
                  ? 'bg-primary text-white'
                  : 'glass text-gray-light hover:bg-white/10'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="card glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray/30">
                <th className="text-left text-xs font-semibold text-gray-light px-5 py-3">{t('users.user')}</th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3">{t('users.status')}</th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('credit_score')}>
                  <div className="flex items-center gap-1">{t('users.credit')} <SortIcon field="credit_score" /></div>
                </th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('total_meals_hosted')}>
                  <div className="flex items-center gap-1">{t('users.hosted')} <SortIcon field="total_meals_hosted" /></div>
                </th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('total_meals_joined')}>
                  <div className="flex items-center gap-1">{t('users.joined')} <SortIcon field="total_meals_joined" /></div>
                </th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('no_show_count')}>
                  <div className="flex items-center gap-1">{t('users.noShow')} <SortIcon field="no_show_count" /></div>
                </th>
                <th className="text-right text-xs font-semibold text-gray-light px-5 py-3">{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray/20">
              {filtered.map(user => {
                const creditInfo = getCreditLevel(user.credit_score);
                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-mint/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{user.nickname?.charAt(0) || user.email.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{user.nickname || t('users.unnamed')}</p>
                          <p className="text-[11px] text-gray-light truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full capitalize', ADMIN_STATUS_COLORS[user.status])}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{user.credit_score}</span>
                        <span className="text-[10px]" title={creditInfo.label}>{creditInfo.emoji.slice(0, 2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-light">{user.total_meals_hosted}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-light">{user.total_meals_joined}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        'text-sm font-medium',
                        user.no_show_count > 2 ? 'text-red-400' : user.no_show_count > 0 ? 'text-gold' : 'text-gray-light'
                      )}>
                        {user.no_show_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-light" />
                        </button>
                        {actionMenu === user.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 glass rounded-xl shadow-lg border border-gray/30 py-1 z-20">
                            <button
                              onClick={() => { setSelectedUser(user); setActionMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-white hover:bg-white/10"
                            >
                              <Eye className="w-3.5 h-3.5" /> {t('users.viewDetails')}
                            </button>
                            <button
                              onClick={() => { setCreditModal({ user, amount: 0, reason: '' }); setActionMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-white hover:bg-white/10"
                            >
                              <Star className="w-3.5 h-3.5" /> {t('users.adjustCredit')}
                            </button>
                            {user.status === 'active' ? (
                              <button
                                onClick={() => { handleBanUser(user); }}
                                disabled={actionLoading}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                <Ban className="w-3.5 h-3.5" /> {t('users.banUser')}
                              </button>
                            ) : (
                              <button
                                onClick={() => { handleReactivateUser(user); }}
                                disabled={actionLoading}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-mint hover:bg-mint/10 disabled:opacity-50"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" /> {t('users.reactivate')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray/30 bg-dark/30">
          <p className="text-xs text-gray-light">{t('users.showingOf', { count: filtered.length, total: users.length })}</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                p === 1 ? 'bg-primary text-white' : 'glass text-gray-light hover:bg-white/10'
              )}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md glass h-full overflow-y-auto shadow-xl border-l border-primary/30">
            <div className="sticky top-0 glass z-10 px-6 py-4 border-b border-gray/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{t('users.userDetails')}</h2>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5 text-gray-light" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-mint/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-primary">{selectedUser.nickname?.charAt(0) || '?'}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedUser.nickname || t('users.unnamed')}</h3>
                <p className="text-sm text-gray-light">{selectedUser.email}</p>
                <span className={cn('inline-block mt-2 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize', ADMIN_STATUS_COLORS[selectedUser.status])}>
                  {selectedUser.status}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('users.creditScore'), value: `${selectedUser.credit_score}`, icon: Star, color: 'text-gold' },
                  { label: t('users.mealsHosted'), value: selectedUser.total_meals_hosted, icon: Calendar, color: 'text-primary' },
                  { label: t('users.mealsJoined'), value: selectedUser.total_meals_joined, icon: UserPlus, color: 'text-mint' },
                  { label: t('users.noShows'), value: selectedUser.no_show_count, icon: AlertTriangle, color: selectedUser.no_show_count > 0 ? 'text-red-400' : 'text-gray-light' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-dark/50 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={cn('w-3.5 h-3.5', item.color)} />
                        <span className="text-[11px] text-gray-light">{item.label}</span>
                      </div>
                      <p className="text-lg font-bold text-white">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Personal Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">{t('users.personalInfo')}</h4>
                {[
                  { label: t('users.ageRange'), value: selectedUser.age_range || '-' },
                  { label: t('users.occupation'), value: selectedUser.occupation || '-' },
                  { label: t('users.languages'), value: selectedUser.languages_spoken.join(', ') || '-' },
                  { label: t('users.bio'), value: selectedUser.bio || '-' },
                  { label: t('users.joined'), value: new Date(selectedUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: t('users.lastActive'), value: new Date(selectedUser.last_active).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { label: t('users.emailVerified'), value: selectedUser.email_verified ? t('users.yes') : t('users.no') },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-start py-2 border-b border-gray/20">
                    <span className="text-xs text-gray-light">{item.label}</span>
                    <span className="text-sm text-white text-right max-w-[60%]">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setCreditModal({ user: selectedUser, amount: 0, reason: '' }); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/80 transition-colors"
                >
                  <Star className="w-4 h-4" /> {t('users.adjustCredit')}
                </button>
                {selectedUser.status === 'active' ? (
                  <button
                    onClick={() => handleBanUser(selectedUser)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" /> {t('users.ban')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivateUser(selectedUser)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-mint/20 text-mint rounded-xl text-sm font-medium hover:bg-mint/30 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" /> {t('users.reactivate')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Adjustment Modal */}
      {creditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCreditModal(null)} />
          <div className="relative glass rounded-2xl shadow-xl w-full max-w-sm p-6 border border-primary/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t('users.adjustCreditTitle')}</h3>
              <button onClick={() => setCreditModal(null)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4 text-gray-light" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-light mb-1">{t('users.userLabel')}</p>
              <p className="text-sm font-medium text-white">{creditModal.user.nickname} ({creditModal.user.credit_score})</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-light mb-1.5">{t('users.pointsAdjustment')}</label>
              <input
                type="number"
                value={creditModal.amount}
                onChange={e => setCreditModal({ ...creditModal, amount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder={t('users.pointsPlaceholder')}
              />
              <p className="text-xs text-gray-light mt-1">
                {t('users.newScore')} <span className="font-semibold text-primary">{creditModal.user.credit_score + creditModal.amount}</span>
              </p>
            </div>
            <div className="mb-5">
              <label className="block text-sm text-gray-light mb-1.5">{t('users.reason')}</label>
              <textarea
                value={creditModal.reason}
                onChange={e => setCreditModal({ ...creditModal, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-gray-light"
                placeholder={t('users.reasonPlaceholder')}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCreditModal(null)} className="flex-1 px-4 py-2.5 glass text-gray-light rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => { handleAdjustCredit(); }}
                disabled={actionLoading || creditModal.amount === 0}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/80 disabled:opacity-50 transition-colors"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
