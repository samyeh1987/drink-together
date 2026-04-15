'use client';

import { useState, useMemo } from 'react';
import {
  Search, Filter, Eye, X, UtensilsCrossed, Users, Clock,
  AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  MoreVertical, MapPin, Calendar, CreditCard, Globe,
  Ban,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { DEMO_MEALS, ADMIN_STATUS_COLORS, CUISINE_EMOJI, type AdminMeal } from '../data';

type SortField = 'datetime' | 'current_participants' | 'created_at' | 'reports_count';
type SortDir = 'asc' | 'desc';

export default function AdminMealsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('datetime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedMeal, setSelectedMeal] = useState<AdminMeal | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const cuisines = useMemo(() => {
    const set = new Set(DEMO_MEALS.map(m => m.cuisine_type));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    let list = [...DEMO_MEALS];
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
  }, [search, statusFilter, cuisineFilter, sortBy, sortDir]);

  const stats = useMemo(() => ({
    total: DEMO_MEALS.length,
    open: DEMO_MEALS.filter(m => m.status === 'open').length,
    completed: DEMO_MEALS.filter(m => m.status === 'completed').length,
    cancelled: DEMO_MEALS.filter(m => m.status === 'cancelled').length,
    reported: DEMO_MEALS.filter(m => m.reports_count > 0).length,
  }), []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[#FF6B35]" /> : <ChevronDown className="w-3 h-3 text-[#FF6B35]" />;
  };

  const formatDatetime = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Meals</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all dining events on the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Meals', value: stats.total, icon: UtensilsCrossed, color: 'from-[#FF6B35] to-[#FF6B6B]' },
          { label: 'Open', value: stats.open, icon: Clock, color: 'from-blue-500 to-blue-600' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'from-[#2EC4B6] to-[#5DD9CE]' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'from-red-500 to-red-600' },
          { label: 'Reported', value: stats.reported, icon: AlertTriangle, color: 'from-yellow-500 to-yellow-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search meals, restaurants, hosts..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'open', 'confirmed', 'completed', 'cancelled', 'pending'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize',
                statusFilter === s ? 'bg-[#FF6B35] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-gray-500 flex-shrink-0">Cuisine:</span>
        {['all', ...cuisines].map(c => (
          <button
            key={c}
            onClick={() => setCuisineFilter(c)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 capitalize',
              cuisineFilter === c ? 'bg-[#FF6B35] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {c !== 'all' && <span>{CUISINE_EMOJI[c] || ''}</span>}
            {c}
          </button>
        ))}
      </div>

      {/* Meal Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Meal</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Host</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => { if (sortBy === 'datetime') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy('datetime'); setSortDir('desc'); } }}>
                  <div className="flex items-center gap-1">Date <SortIcon field="datetime" /></div>
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Pax</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => { if (sortBy === 'reports_count') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy('reports_count'); setSortDir('desc'); } }}>
                  <div className="flex items-center gap-1">Reports <SortIcon field="reports_count" /></div>
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(meal => (
                <tr key={meal.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-xl flex-shrink-0">{CUISINE_EMOJI[meal.cuisine_type] || '🍴'}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{meal.title}</p>
                        <p className="text-[11px] text-gray-400 truncate">{meal.restaurant_name}</p>
                      </div>
                      {meal.is_restaurant_hosted && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFD700]/20 text-[#B8860B] uppercase tracking-wider">
                          Partner
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">{meal.creator_name}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full capitalize', ADMIN_STATUS_COLORS[meal.status])}>
                      {meal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-gray-600">{formatDatetime(meal.datetime)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className={cn(
                        'text-sm font-medium',
                        meal.current_participants >= meal.max_participants ? 'text-red-500' : meal.current_participants >= meal.min_participants ? 'text-[#2EC4B6]' : 'text-gray-600'
                      )}>
                        {meal.current_participants}/{meal.max_participants}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {meal.reports_count > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                        <AlertTriangle className="w-3 h-3" /> {meal.reports_count}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActionMenu(actionMenu === meal.id ? null : meal.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {actionMenu === meal.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                          <button
                            onClick={() => { setSelectedMeal(meal); setActionMenu(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                          {meal.status !== 'cancelled' && meal.status !== 'completed' && (
                            <button
                              onClick={() => { alert(`Meal "${meal.title}" cancelled`); setActionMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Ban className="w-3.5 h-3.5" /> Cancel Meal
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {DEMO_MEALS.length} meals</p>
        </div>
      </div>

      {/* Meal Detail Drawer */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedMeal(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Meal Details</h2>
              <button onClick={() => setSelectedMeal(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{CUISINE_EMOJI[selectedMeal.cuisine_type] || '🍴'}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{selectedMeal.title}</h3>
                    <p className="text-sm text-gray-500">{selectedMeal.restaurant_name}</p>
                    <span className={cn('inline-block mt-1 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize', ADMIN_STATUS_COLORS[selectedMeal.status])}>
                      {selectedMeal.status}
                    </span>
                    {selectedMeal.is_restaurant_hosted && (
                      <span className="inline-block ml-2 text-[9px] font-bold px-2 py-0.5 rounded bg-[#FFD700]/20 text-[#B8860B] uppercase tracking-wider">
                        Restaurant Hosted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Calendar, label: 'Date & Time', value: formatDatetime(selectedMeal.datetime), color: 'text-blue-500' },
                  { icon: Clock, label: 'Deadline', value: formatDatetime(selectedMeal.deadline), color: 'text-yellow-500' },
                  { icon: Users, label: 'Participants', value: `${selectedMeal.current_participants} / ${selectedMeal.max_participants}`, color: 'text-[#2EC4B6]' },
                  { icon: MapPin, label: 'Location', value: selectedMeal.restaurant_address, color: 'text-red-400' },
                  { icon: CreditCard, label: 'Payment', value: selectedMeal.payment_method.replace(/([A-Z])/g, ' $1').trim(), color: 'text-purple-500' },
                  { icon: Globe, label: 'Languages', value: selectedMeal.meal_languages.join(', ').toUpperCase(), color: 'text-[#FF6B35]' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={cn('w-3.5 h-3.5', item.color)} />
                        <span className="text-[11px] text-gray-500">{item.label}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 break-words">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Budget */}
              {selectedMeal.budget_min && (
                <div className="bg-[#FFF8F0] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Budget per person</p>
                  <p className="text-lg font-bold text-[#FF6B35]">
                    {formatCurrency(selectedMeal.budget_min ?? 0)} - {formatCurrency(selectedMeal.budget_max ?? 0)}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedMeal.description}</p>
              </div>

              {/* Host Info */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Host</h4>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-[#FF6B6B]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#FF6B35]">{selectedMeal.creator_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{selectedMeal.creator_name}</p>
                    <p className="text-xs text-gray-400">Created {new Date(selectedMeal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Reports */}
              {selectedMeal.reports_count > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h4 className="text-sm font-semibold text-red-600">Reports ({selectedMeal.reports_count})</h4>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600">
                    This meal has {selectedMeal.reports_count} unresolved report(s). Check Reports page for details.
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


