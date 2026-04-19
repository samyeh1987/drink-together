'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, Eye, X, UtensilsCrossed, Users, Clock,
  AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  MoreVertical, MapPin, Calendar, CreditCard, Globe,
  Ban,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { ADMIN_STATUS_COLORS, CUISINE_EMOJI, type AdminMeal } from '../data';
import { useAdminT } from '../AdminI18nProvider';

type SortField = 'datetime' | 'current_participants' | 'created_at' | 'reports_count';
type SortDir = 'asc' | 'desc';

export default function AdminMealsPage() {
  const t = useAdminT();
  const [meals, setMeals] = useState<AdminMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('datetime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedMeal, setSelectedMeal] = useState<AdminMeal | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const handleCancelMeal = async (meal: AdminMeal) => {
    if (!confirm(`Cancel meal "${meal.title}"?`)) return;
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase
        .from('meals')
        .update({ status: 'cancelled' })
        .eq('id', meal.id);
      if (error) throw error;
      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, status: 'cancelled' } : m));
      setSelectedMeal(null);
      setActionMenu(null);
    } catch (err) {
      console.error('Failed to cancel meal:', err);
      alert('Failed to cancel meal');
    }
  };

  useEffect(() => {
    async function loadMeals() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data, error } = await supabase
          .from('meals')
          .select(`
            *,
            creator:profiles!meals_creator_id_fkey(nickname)
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Get participant counts
          const mealIds = data.map(m => m.id);
          const { data: participants } = await supabase
            .from('meal_participants')
            .select('meal_id, status')
            .in('meal_id', mealIds);

          const countMap: Record<string, number> = {};
          if (participants) {
            for (const p of participants) {
              if (p.status === 'approved') {
                countMap[p.meal_id] = (countMap[p.meal_id] || 0) + 1;
              }
            }
          }

          const mapped: AdminMeal[] = data.map(m => ({
            id: m.id,
            title: m.title,
            restaurant_name: m.restaurant_name,
            restaurant_address: m.restaurant_address || '',
            cuisine_type: m.cuisine_type,
            meal_languages: m.meal_languages || [],
            datetime: m.datetime,
            deadline: m.deadline,
            min_participants: m.min_participants,
            max_participants: m.max_participants,
            payment_method: m.payment_method,
            budget_min: m.budget_min,
            budget_max: m.budget_max,
            description: m.description || '',
            status: m.status,
            created_at: m.created_at,
            creator_name: m.creator?.nickname || 'Unknown',
            current_participants: countMap[m.id] || 0,
            reports_count: 0,
            is_restaurant_hosted: false,
          }));

          setMeals(mapped);
        }
      } catch (err) {
        console.error('Failed to load meals:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMeals();
  }, []);

  const cuisines = useMemo(() => {
    const set = new Set(meals.map(m => m.cuisine_type));
    return Array.from(set);
  }, [meals]);

  const filtered = useMemo(() => {
    let list = [...meals];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.restaurant_name.toLowerCase().includes(q) ||
        m.creator_name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(m => m.status === statusFilter);
    if (cuisineFilter !== 'all') list = list.filter(m => m.cuisine_type === cuisineFilter);
    list.sort((a, b) => {
      if (sortBy === 'datetime' || sortBy === 'created_at') {
        const aVal = new Date(a[sortBy]).getTime();
        const bVal = new Date(b[sortBy]).getTime();
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aVal = a[sortBy] as number;
      const bVal = b[sortBy] as number;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [meals, search, statusFilter, cuisineFilter, sortBy, sortDir]);

  const stats = useMemo(() => ({
    total: meals.length,
    open: meals.filter(m => m.status === 'open').length,
    completed: meals.filter(m => m.status === 'completed').length,
    cancelled: meals.filter(m => m.status === 'cancelled').length,
    reported: meals.filter(m => m.reports_count > 0).length,
  }), [meals]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronDown className="w-3 h-3 text-gray-light" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const formatDatetime = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('meals.title')}</h1>
        <p className="text-sm text-gray-light mt-1">{t('meals.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: t('meals.totalMeals'), value: stats.total, icon: UtensilsCrossed, color: 'from-primary to-pink-400' },
          { label: t('meals.open'), value: stats.open, icon: Clock, color: 'from-mint to-cyan-400' },
          { label: t('meals.completed'), value: stats.completed, icon: CheckCircle2, color: 'from-mint to-cyan-400' },
          { label: t('meals.cancelled'), value: stats.cancelled, icon: XCircle, color: 'from-red-500 to-red-600' },
          { label: t('meals.reported'), value: stats.reported, icon: AlertTriangle, color: 'from-gold to-yellow-400' },
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
            placeholder={t('meals.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white placeholder:text-gray-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-light hover:text-white" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-light" />
          {['all', 'open', 'confirmed', 'completed', 'cancelled', 'pending'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize',
                statusFilter === s ? 'bg-primary text-white' : 'glass text-gray-light hover:bg-white/10'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-gray-light flex-shrink-0">Cuisine:</span>
        {['all', ...cuisines].map(c => (
          <button
            key={c}
            onClick={() => setCuisineFilter(c)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 capitalize',
              cuisineFilter === c ? 'bg-primary text-white' : 'glass text-gray-light hover:bg-white/10'
            )}
          >
            {c !== 'all' && <span>{CUISINE_EMOJI[c] || ''}</span>}
            {c}
          </button>
        ))}
      </div>

      {/* Meal Table */}
      <div className="card glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray/30">
                <th className="text-left text-xs font-semibold text-gray-light px-5 py-3">{t('meals.meal')}</th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3">{t('meals.host')}</th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3">{t('meals.status')}</th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3 cursor-pointer hover:text-white" onClick={() => { if (sortBy === 'datetime') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy('datetime'); setSortDir('desc'); } }}>
                  <div className="flex items-center gap-1">{t('meals.date')} <SortIcon field="datetime" /></div>
                </th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3">{t('meals.pax')}</th>
                <th className="text-left text-xs font-semibold text-gray-light px-4 py-3 cursor-pointer hover:text-white" onClick={() => { if (sortBy === 'reports_count') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy('reports_count'); setSortDir('desc'); } }}>
                  <div className="flex items-center gap-1">{t('meals.reports')} <SortIcon field="reports_count" /></div>
                </th>
                <th className="text-right text-xs font-semibold text-gray-light px-5 py-3">{t('meals.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray/20">
              {filtered.map(meal => (
                <tr key={meal.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-xl flex-shrink-0">{CUISINE_EMOJI[meal.cuisine_type] || '🍸'}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{meal.title}</p>
                        <p className="text-[11px] text-gray-light truncate">{meal.restaurant_name}</p>
                      </div>
                      {meal.is_restaurant_hosted && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold uppercase tracking-wider">
                          {t('meals.partner')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-light">{meal.creator_name}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full capitalize', ADMIN_STATUS_COLORS[meal.status])}>
                      {meal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-light">{formatDatetime(meal.datetime)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-light" />
                      <span className={cn(
                        'text-sm font-medium',
                        meal.current_participants >= meal.max_participants ? 'text-red-400' : meal.current_participants >= meal.min_participants ? 'text-mint' : 'text-gray-light'
                      )}>
                        {meal.current_participants}/{meal.max_participants}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {meal.reports_count > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-400">
                        <AlertTriangle className="w-3 h-3" /> {meal.reports_count}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActionMenu(actionMenu === meal.id ? null : meal.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-light" />
                      </button>
                      {actionMenu === meal.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 glass rounded-xl shadow-lg border border-gray/30 py-1 z-20">
                          <button
                            onClick={() => { setSelectedMeal(meal); setActionMenu(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-white hover:bg-white/10"
                          >
                            <Eye className="w-3.5 h-3.5" /> {t('meals.viewDetails')}
                          </button>
                          {meal.status !== 'cancelled' && meal.status !== 'completed' && (
                            <button
                              onClick={() => { handleCancelMeal(meal); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                            >
                              <Ban className="w-3.5 h-3.5" /> {t('meals.cancelMeal')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray/30 bg-dark/30">
          <p className="text-xs text-gray-light">{t('meals.showingOf', { count: filtered.length, total: meals.length })}</p>
        </div>
      </div>

      {/* Meal Detail Drawer */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMeal(null)} />
          <div className="relative w-full max-w-lg glass h-full overflow-y-auto shadow-xl border-l border-primary/30">
            <div className="sticky top-0 glass z-10 px-6 py-4 border-b border-gray/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{t('meals.mealDetails')}</h2>
              <button onClick={() => setSelectedMeal(null)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5 text-gray-light" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{CUISINE_EMOJI[selectedMeal.cuisine_type] || '🍸'}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{selectedMeal.title}</h3>
                    <p className="text-sm text-gray-light">{selectedMeal.restaurant_name}</p>
                    <span className={cn('inline-block mt-1 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize', ADMIN_STATUS_COLORS[selectedMeal.status])}>
                      {selectedMeal.status}
                    </span>
                    {selectedMeal.is_restaurant_hosted && (
                      <span className="inline-block ml-2 text-[9px] font-bold px-2 py-0.5 rounded bg-gold/20 text-gold uppercase tracking-wider">
                        {t('meals.restaurantHosted')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Calendar, label: t('meals.dateTime'), value: formatDatetime(selectedMeal.datetime), color: 'text-mint' },
                  { icon: Clock, label: t('meals.deadline'), value: formatDatetime(selectedMeal.deadline), color: 'text-gold' },
                  { icon: Users, label: t('meals.participants'), value: `${selectedMeal.current_participants} / ${selectedMeal.max_participants}`, color: 'text-primary' },
                  { icon: MapPin, label: t('meals.location'), value: selectedMeal.restaurant_address, color: 'text-coral' },
                  { icon: CreditCard, label: t('meals.payment'), value: selectedMeal.payment_method.replace(/([A-Z])/g, ' $1').trim(), color: 'text-coral' },
                  { icon: Globe, label: t('meals.languages'), value: selectedMeal.meal_languages.join(', ').toUpperCase(), color: 'text-primary' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-dark/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={cn('w-3.5 h-3.5', item.color)} />
                        <span className="text-[11px] text-gray-light">{item.label}</span>
                      </div>
                      <p className="text-sm font-medium text-white break-words">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Budget */}
              {selectedMeal.budget_min && (
                <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
                  <p className="text-xs text-gray-light mb-1">{t('meals.budgetPerPerson')}</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(selectedMeal.budget_min ?? 0)} - {formatCurrency(selectedMeal.budget_max ?? 0)}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">{t('meals.description')}</h4>
                <p className="text-sm text-gray-light leading-relaxed">{selectedMeal.description}</p>
              </div>

              {/* Host Info */}
              <div className="border-t border-gray/30 pt-4">
                <h4 className="text-sm font-semibold text-white mb-2">{t('meals.host')}</h4>
                <div className="flex items-center gap-3 bg-dark/50 rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-mint/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{selectedMeal.creator_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedMeal.creator_name}</p>
                    <p className="text-xs text-gray-light">{t('meals.created')} {new Date(selectedMeal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Reports */}
              {selectedMeal.reports_count > 0 && (
                <div className="border-t border-gray/30 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <h4 className="text-sm font-semibold text-red-400">Reports ({selectedMeal.reports_count})</h4>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-3 text-sm text-red-400">
                    {t('meals.unresolvedReports', { count: selectedMeal.reports_count })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


