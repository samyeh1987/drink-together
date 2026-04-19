'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, Eye, Edit3, Trash2, X, Store, Star,
  MapPin, Phone, Mail, Calendar, Tag, ChevronRight,
  Package, DollarSign, Users, Clock, Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { CUISINE_EMOJI, type AdminRestaurant, type RestaurantDeal } from '../data';
import { useAdminT } from '../AdminI18nProvider';

// Supabase helpers (admin pages run server-side via middleware, so use browser client)
import { createClient } from '@/lib/supabase/client';

function getSupabase() {
  return createClient();
}

export default function AdminRestaurantsPage() {
  const t = useAdminT();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<(AdminRestaurant & { deals?: RestaurantDeal[] }) | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<RestaurantDeal | null>(null);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [addForm, setAddForm] = useState({
    name: '', name_local: '', address: '', cuisine_type: 'thai',
    phone: '', email: '', contact_person: '', description: '',
  });

  // Fetch restaurants from Supabase
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants((data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        name_local: r.name_local || '',
        address: r.address || '',
        cuisine_type: r.cuisine_type,
        phone: r.phone || '',
        email: r.email || '',
        contact_person: r.contact_person || '',
        latitude: r.latitude || 0,
        longitude: r.longitude || 0,
        rating: r.rating || 0,
        status: r.status,
        joined_at: r.created_at,
        total_meals_hosted: r.total_meals_hosted || 0,
        total_deals: r.total_deals || 0,
        description: r.description || '',
        avatar_url: r.avatar_url,
        deals: [],
      })));
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  // Fetch deals for selected restaurant
  const fetchDeals = useCallback(async (restaurantId: string) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('restaurant_deals')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description || '',
        original_price: d.original_price || 0,
        deal_price: d.deal_price || 0,
        min_pax: d.min_pax || 1,
        max_pax: d.max_pax || 10,
        valid_until: d.valid_until || '',
        status: d.status,
      }));
    } catch (err) {
      console.error('Failed to fetch deals:', err);
      return [];
    }
  }, []);

  const handleSelectRestaurant = async (restaurant: AdminRestaurant) => {
    const deals = await fetchDeals(restaurant.id);
    setSelectedRestaurant({ ...restaurant, deals });
  };

  // Add restaurant
  const handleAddRestaurant = async () => {
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('restaurants')
        .insert({
          name: addForm.name,
          name_local: addForm.name_local || null,
          address: addForm.address || null,
          cuisine_type: addForm.cuisine_type,
          phone: addForm.phone || null,
          email: addForm.email || null,
          contact_person: addForm.contact_person || null,
          description: addForm.description || null,
          status: 'active',
        });

      if (error) throw error;
      setShowAddModal(false);
      setAddForm({
        name: '', name_local: '', address: '', cuisine_type: 'thai',
        phone: '', email: '', contact_person: '', description: '',
      });
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to add restaurant:', err);
      alert('Failed to add restaurant: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Edit restaurant (open add modal with pre-filled data)
  const [editingRestaurant, setEditingRestaurant] = useState<AdminRestaurant | null>(null);

  const handleEditRestaurant = (restaurant: AdminRestaurant) => {
    setEditingRestaurant(restaurant);
    setAddForm({
      name: restaurant.name,
      name_local: restaurant.name_local,
      address: restaurant.address,
      cuisine_type: restaurant.cuisine_type,
      phone: restaurant.phone,
      email: restaurant.email,
      contact_person: restaurant.contact_person,
      description: restaurant.description,
    });
    setShowAddModal(true);
  };

  const handleSaveEditRestaurant = async () => {
    if (!editingRestaurant || !addForm.name.trim()) return;
    setSaving(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: addForm.name,
          name_local: addForm.name_local || null,
          address: addForm.address || null,
          cuisine_type: addForm.cuisine_type,
          phone: addForm.phone || null,
          email: addForm.email || null,
          contact_person: addForm.contact_person || null,
          description: addForm.description || null,
        })
        .eq('id', editingRestaurant.id);

      if (error) throw error;
      setShowAddModal(false);
      setEditingRestaurant(null);
      setAddForm({
        name: '', name_local: '', address: '', cuisine_type: 'thai',
        phone: '', email: '', contact_person: '', description: '',
      });
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to update restaurant:', err);
      alert('Failed to update restaurant: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Delete restaurant
  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('restaurants').delete().eq('id', id);
      if (error) throw error;
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to delete restaurant:', err);
    }
  };

  // Delete deal
  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Delete this deal?')) return;
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('restaurant_deals').delete().eq('id', dealId);
      if (error) throw error;
      if (selectedRestaurant) {
        const deals = (selectedRestaurant.deals || []).filter(d => d.id !== dealId);
        setSelectedRestaurant({ ...selectedRestaurant, deals });
      }
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to delete deal:', err);
      alert('Failed to delete deal');
    }
  };

  // Save deal
  const handleSaveDeal = async (dealData: {
    title: string; description: string; original_price: number; deal_price: number;
    min_pax: number; max_pax: number; valid_until: string; status: string;
  }) => {
    if (!selectedRestaurant || !dealData.title.trim()) return;
    setSaving(true);
    try {
      const supabase = getSupabase();
      if (editingDeal) {
        const { error } = await supabase
          .from('restaurant_deals')
          .update(dealData)
          .eq('id', editingDeal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('restaurant_deals')
          .insert({ ...dealData, restaurant_id: selectedRestaurant.id });
        if (error) throw error;
      }
      setShowDealModal(false);
      setEditingDeal(null);
      const deals = await fetchDeals(selectedRestaurant.id);
      setSelectedRestaurant({ ...selectedRestaurant, deals });
      fetchRestaurants();
    } catch (err) {
      console.error('Failed to save deal:', err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...restaurants];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.name_local.toLowerCase().includes(q) ||
        r.contact_person.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    return list;
  }, [restaurants, search, statusFilter]);

  const stats = useMemo(() => ({
    total: restaurants.length,
    active: restaurants.filter(r => r.status === 'active').length,
    pending: restaurants.filter(r => r.status === 'pending').length,
    totalDeals: restaurants.reduce((s, r) => s + r.total_deals, 0),
  }), [restaurants]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('restaurants.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('restaurants.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('restaurants.addRestaurant')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('restaurants.totalRestaurants'), value: stats.total, icon: Store, color: 'from-[#FF6B35] to-[#FF6B6B]' },
          { label: t('restaurants.active'), value: stats.active, icon: Star, color: 'from-[#2EC4B6] to-[#5DD9CE]' },
          { label: t('restaurants.pendingApproval'), value: stats.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
          { label: t('restaurants.activeDeals'), value: stats.totalDeals, icon: Package, color: 'from-purple-500 to-purple-600' },
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

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('restaurants.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'pending', 'inactive'].map(s => (
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Loading restaurants...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && restaurants.length === 0 && (
        <div className="text-center py-16">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No restaurants yet</p>
          <p className="text-gray-400 text-xs mb-4">Add your first restaurant to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90"
          >
            <Plus className="w-4 h-4" /> {t('restaurants.addRestaurant')}
          </button>
        </div>
      )}

      {/* Restaurant Cards */}
      {!loading && restaurants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(restaurant => (
            <div
              key={restaurant.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
              onClick={() => handleSelectRestaurant(restaurant)}
            >
              {/* Header with placeholder image area */}
              <div className="h-32 bg-gradient-to-br from-[#FF6B35]/10 to-[#FF6B6B]/10 flex items-center justify-center relative">
                <span className="text-5xl">{CUISINE_EMOJI[restaurant.cuisine_type] || '🍴'}</span>
                <span className={cn(
                  'absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                  restaurant.status === 'active' ? 'bg-[#2EC4B6]/20 text-[#2EC4B6]' :
                  restaurant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {restaurant.status}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">{restaurant.name}</h3>
                    <p className="text-xs text-gray-400">{restaurant.name_local}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700]" />
                    <span className="text-sm font-semibold text-gray-700">{restaurant.rating}</span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {restaurant.address && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" /> {restaurant.address}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Tag className="w-3 h-3" /> {restaurant.cuisine_type}
                  </div>
                  {restaurant.contact_person && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Phone className="w-3 h-3" /> {restaurant.contact_person}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{restaurant.total_meals_hosted} {t('restaurants.meals')}</span>
                    <span>{restaurant.total_deals} {t('restaurants.deals')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#FF6B35] font-medium">
                    {t('restaurants.view')} <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restaurant Detail Drawer */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedRestaurant(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{t('restaurants.restaurantDetails')}</h2>
              <button onClick={() => setSelectedRestaurant(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B35]/10 to-[#FF6B6B]/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-4xl">{CUISINE_EMOJI[selectedRestaurant.cuisine_type] || '🍴'}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">{selectedRestaurant.name}</h3>
                <p className="text-sm text-gray-400">{selectedRestaurant.name_local}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                  <span className="text-sm font-semibold">{selectedRestaurant.rating}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700">{t('restaurants.contactInfo')}</h4>
                {selectedRestaurant.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-gray-400">{t('restaurants.address')}</span>
                      <p className="text-sm text-gray-700">{selectedRestaurant.address}</p>
                    </div>
                  </div>
                )}
                {selectedRestaurant.phone && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-gray-400">{t('restaurants.phone')}</span>
                      <p className="text-sm text-gray-700">{selectedRestaurant.phone}</p>
                    </div>
                  </div>
                )}
                {selectedRestaurant.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-gray-400">{t('restaurants.email')}</span>
                      <p className="text-sm text-gray-700">{selectedRestaurant.email}</p>
                    </div>
                  </div>
                )}
                {selectedRestaurant.contact_person && (
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-gray-400">{t('restaurants.contactPerson')}</span>
                      <p className="text-sm text-gray-700">{selectedRestaurant.contact_person}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedRestaurant.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('restaurants.about')}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedRestaurant.description}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{selectedRestaurant.total_meals_hosted}</p>
                  <p className="text-xs text-gray-500">{t('restaurants.mealsHosted')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{selectedRestaurant.total_deals}</p>
                  <p className="text-xs text-gray-500">{t('restaurants.activeDeals')}</p>
                </div>
              </div>

              {/* Deals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">{t('restaurants.dealPackages')}</h4>
                  <button
                    onClick={() => { setEditingDeal(null); setShowDealModal(true); }}
                    className="text-xs text-[#FF6B35] font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> {t('restaurants.addDeal')}
                  </button>
                </div>
                <div className="space-y-3">
                  {(selectedRestaurant.deals || []).length > 0 ? (selectedRestaurant.deals || []).map(deal => (
                    <div key={deal.id} className="border border-gray-100 rounded-xl p-4 hover:border-[#FF6B35]/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="text-sm font-semibold text-gray-800">{deal.title}</h5>
                          <span className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full capitalize',
                            deal.status === 'active' ? 'bg-[#2EC4B6]/10 text-[#2EC4B6]' :
                            deal.status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-gray-100 text-gray-400'
                          )}>
                            {deal.status}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingDeal(deal); setShowDealModal(true); }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }}
                            className="p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{deal.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-400 line-through">{formatCurrency(deal.original_price)}</span>
                        <span className="text-[#FF6B35] font-bold">{formatCurrency(deal.deal_price)}</span>
                        <span className="text-gray-500">{deal.min_pax}-{deal.max_pax} pax</span>
                        {deal.valid_until && (
                          <span className="text-gray-400">Until {new Date(deal.valid_until).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-4">No deals yet</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleEditRestaurant(selectedRestaurant)} className="flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90">
                  {t('restaurants.editRestaurant')}
                </button>
                <button
                  onClick={() => handleDeleteRestaurant(selectedRestaurant.id)}
                  className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Deal Modal */}
      {showDealModal && (
        <DealModal
          t={t}
          editingDeal={editingDeal}
          saving={saving}
          onSave={handleSaveDeal}
          onClose={() => { setShowDealModal(false); setEditingDeal(null); }}
        />
      )}

      {/* Add/Edit Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setEditingRestaurant(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{editingRestaurant ? t('restaurants.editRestaurant') : t('restaurants.addRestaurant')}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingRestaurant(null); }} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.nameEn')} <span className="text-red-500">*</span></label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                    placeholder="Restaurant name"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.nameLocal')}</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                    placeholder="ชื่อร้าน"
                    value={addForm.name_local}
                    onChange={e => setAddForm(f => ({ ...f, name_local: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Address</label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                  placeholder="Full address"
                  value={addForm.address}
                  onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.cuisineType')}</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                    value={addForm.cuisine_type}
                    onChange={e => setAddForm(f => ({ ...f, cuisine_type: e.target.value }))}
                  >
                    {Object.entries(CUISINE_EMOJI).map(([k, v]) => (
                      <option key={k} value={k}>{v} {k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Phone</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                    placeholder="+66-2-xxx-xxxx"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                    placeholder="info@restaurant.com"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Contact Person</label>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                    placeholder="Contact name"
                    value={addForm.contact_person}
                    onChange={e => setAddForm(f => ({ ...f, contact_person: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.descriptionField')}</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none"
                  placeholder="About the restaurant..."
                  value={addForm.description}
                  onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowAddModal(false); setEditingRestaurant(null); }} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={editingRestaurant ? handleSaveEditRestaurant : handleAddRestaurant}
                disabled={saving || !addForm.name.trim()}
                className={`flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90 ${!addForm.name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                {editingRestaurant ? 'Save Changes' : 'Add Restaurant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Deal Modal Component ────────────────────────────────
function DealModal({ t, editingDeal, saving, onSave, onClose }: {
  t: (key: string) => string;
  editingDeal: RestaurantDeal | null;
  saving: boolean;
  onSave: (data: {
    title: string; description: string; original_price: number; deal_price: number;
    min_pax: number; max_pax: number; valid_until: string; status: string;
  }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: editingDeal?.title || '',
    description: editingDeal?.description || '',
    original_price: editingDeal?.original_price?.toString() || '',
    deal_price: editingDeal?.deal_price?.toString() || '',
    min_pax: editingDeal?.min_pax?.toString() || '1',
    max_pax: editingDeal?.max_pax?.toString() || '10',
    valid_until: editingDeal?.valid_until || '',
    status: editingDeal?.status || 'draft',
  });

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      title: form.title,
      description: form.description,
      original_price: parseFloat(form.original_price) || 0,
      deal_price: parseFloat(form.deal_price) || 0,
      min_pax: parseInt(form.min_pax) || 1,
      max_pax: parseInt(form.max_pax) || 10,
      valid_until: form.valid_until,
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">{editingDeal ? t('restaurants.editDeal') : t('restaurants.addDeal')}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.dealTitle')}</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              placeholder="e.g. Group Hotpot Party"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.describeDeal')}</label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none"
              placeholder="Describe the deal..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.originalPrice')}</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                value={form.original_price}
                onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.dealPrice')}</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                value={form.deal_price}
                onChange={e => setForm(f => ({ ...f, deal_price: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.minPax')}</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                value={form.min_pax}
                onChange={e => setForm(f => ({ ...f, min_pax: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.maxPax')}</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                value={form.max_pax}
                onChange={e => setForm(f => ({ ...f, max_pax: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.validUntil')}</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              value={form.valid_until}
              onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">{t('restaurants.status')}</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'expired' | 'draft' }))}
            >
              <option value="draft">{t('restaurants.draft')}</option>
              <option value="active">Active</option>
              <option value="expired">{t('restaurants.expired')}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className={`flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90 ${!form.title.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
