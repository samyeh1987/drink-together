'use client';

import { useState, useMemo } from 'react';
import {
  Search, Plus, Eye, Edit3, Trash2, X, Store, Star,
  MapPin, Phone, Mail, Calendar, Tag, ChevronRight,
  Package, DollarSign, Users, Clock,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { DEMO_RESTAURANTS, CUISINE_EMOJI, type AdminRestaurant, type RestaurantDeal } from '../data';

export default function AdminRestaurantsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<RestaurantDeal | null>(null);

  const filtered = useMemo(() => {
    let list = [...DEMO_RESTAURANTS];
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
  }, [search, statusFilter]);

  const stats = useMemo(() => ({
    total: DEMO_RESTAURANTS.length,
    active: DEMO_RESTAURANTS.filter(r => r.status === 'active').length,
    pending: DEMO_RESTAURANTS.filter(r => r.status === 'pending').length,
    totalDeals: DEMO_RESTAURANTS.reduce((s, r) => s + r.total_deals, 0),
  }), []);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Restaurants</h1>
          <p className="text-sm text-gray-500 mt-1">Manage partner restaurants and their deal packages.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Restaurants', value: stats.total, icon: Store, color: 'from-[#FF6B35] to-[#FF6B6B]' },
          { label: 'Active', value: stats.active, icon: Star, color: 'from-[#2EC4B6] to-[#5DD9CE]' },
          { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
          { label: 'Active Deals', value: stats.totalDeals, icon: Package, color: 'from-purple-500 to-purple-600' },
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
            placeholder="Search restaurants..."
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

      {/* Restaurant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(restaurant => (
          <div
            key={restaurant.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
            onClick={() => setSelectedRestaurant(restaurant)}
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
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" /> {restaurant.address}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Tag className="w-3 h-3" /> {restaurant.cuisine_type}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="w-3 h-3" /> {restaurant.contact_person}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{restaurant.total_meals_hosted} meals</span>
                  <span>{restaurant.total_deals} deals</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#FF6B35] font-medium">
                  View <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Restaurant Detail Drawer */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedRestaurant(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Restaurant Details</h2>
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
                <h4 className="text-sm font-semibold text-gray-700">Contact Info</h4>
                {[
                  { icon: MapPin, label: 'Address', value: selectedRestaurant.address },
                  { icon: Phone, label: 'Phone', value: selectedRestaurant.phone },
                  { icon: Mail, label: 'Email', value: selectedRestaurant.email },
                  { icon: Users, label: 'Contact Person', value: selectedRestaurant.contact_person },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-gray-400">{item.label}</span>
                        <p className="text-sm text-gray-700">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Description */}
              {selectedRestaurant.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">About</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedRestaurant.description}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{selectedRestaurant.total_meals_hosted}</p>
                  <p className="text-xs text-gray-500">Meals Hosted</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{selectedRestaurant.total_deals}</p>
                  <p className="text-xs text-gray-500">Active Deals</p>
                </div>
              </div>

              {/* Deals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Deal Packages</h4>
                  <button
                    onClick={() => { setEditingDeal(null); setShowDealModal(true); }}
                    className="text-xs text-[#FF6B35] font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Deal
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedRestaurant.deals.map(deal => (
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
                            onClick={(e) => e.stopPropagation()}
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
                        <span className="text-gray-400">Until {new Date(deal.valid_until).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90">
                  Edit Restaurant
                </button>
                <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                  <DollarSign className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Deal Modal */}
      {showDealModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowDealModal(false); setEditingDeal(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{editingDeal ? 'Edit Deal' : 'Add Deal'}</h3>
              <button onClick={() => { setShowDealModal(false); setEditingDeal(null); }} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Deal Title</label>
                <input
                  type="text"
                  defaultValue={editingDeal?.title || ''}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                  placeholder="e.g. Group Hotpot Party"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Description</label>
                <textarea
                  defaultValue={editingDeal?.description || ''}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none"
                  placeholder="Describe the deal..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Original Price (฿)</label>
                  <input type="number" defaultValue={editingDeal?.original_price || ''} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Deal Price (฿)</label>
                  <input type="number" defaultValue={editingDeal?.deal_price || ''} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Min Pax</label>
                  <input type="number" defaultValue={editingDeal?.min_pax || ''} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Max Pax</label>
                  <input type="number" defaultValue={editingDeal?.max_pax || ''} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Valid Until</label>
                <input type="date" defaultValue={editingDeal?.valid_until || ''} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Status</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowDealModal(false); setEditingDeal(null); }} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={() => { alert('Deal saved!'); setShowDealModal(false); setEditingDeal(null); }} className="flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add Restaurant</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Name (English)</label>
                  <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" placeholder="Restaurant name" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Name (Local)</label>
                  <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" placeholder="ชื่อร้าน" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Address</label>
                <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" placeholder="Full address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Cuisine Type</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]">
                    {Object.entries(CUISINE_EMOJI).map(([k, v]) => (
                      <option key={k} value={k}>{v} {k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Phone</label>
                  <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" placeholder="+66-2-xxx-xxxx" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Email</label>
                  <input type="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" placeholder="info@restaurant.com" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Contact Person</label>
                  <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]" placeholder="Contact name" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Description</label>
                <textarea rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none" placeholder="About the restaurant..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={() => { alert('Restaurant added!'); setShowAddModal(false); }} className="flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-medium hover:bg-[#FF6B35]/90">
                Add Restaurant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
