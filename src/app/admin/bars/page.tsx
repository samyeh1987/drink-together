'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit3, Trash2, X, Star,
  MapPin, Phone, Globe, Image as ImageIcon, Loader2,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type RecommendedBar, CITY_EMOJI, CITY_LABELS } from '../data';
import { useAdminT } from '../AdminI18nProvider';
import { createClient } from '@/lib/supabase/client';

function getSupabase() {
  return createClient();
}

export default function AdminBarsPage() {
  const t = useAdminT();
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [bars, setBars] = useState<RecommendedBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBar, setEditingBar] = useState<RecommendedBar | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    name_local: '',
    address: '',
    city: 'bangkok' as RecommendedBar['city'],
    phone: '',
    description: '',
    sort_order: 0,
  });

  // Fetch bars from Supabase
  const fetchBars = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('recommended_bars')
        .select('*')
        .order('city')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBars((data || []) as RecommendedBar[]);
    } catch (err) {
      console.error('Failed to fetch bars:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBars(); }, [fetchBars]);

  // Filter bars
  const filteredBars = bars.filter(bar => {
    const matchesSearch = bar.name.toLowerCase().includes(search.toLowerCase()) ||
      bar.address.toLowerCase().includes(search.toLowerCase());
    const matchesCity = cityFilter === 'all' || bar.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  // Group by city
  const groupedBars = filteredBars.reduce((acc, bar) => {
    if (!acc[bar.city]) acc[bar.city] = [];
    acc[bar.city].push(bar);
    return acc;
  }, {} as Record<string, RecommendedBar[]>);

  // Open modal
  const openModal = (bar?: RecommendedBar) => {
    if (bar) {
      setEditingBar(bar);
      setForm({
        name: bar.name,
        name_local: bar.name_local || '',
        address: bar.address,
        city: bar.city,
        phone: bar.phone || '',
        description: bar.description || '',
        sort_order: bar.sort_order,
      });
    } else {
      setEditingBar(null);
      setForm({
        name: '',
        name_local: '',
        address: '',
        city: 'bangkok',
        phone: '',
        description: '',
        sort_order: bars.filter(b => b.city === 'bangkok').length,
      });
    }
    setShowModal(true);
  };

  // Save bar
  const handleSave = async () => {
    if (!form.name || !form.address) return;
    setSaving(true);
    try {
      const supabase = getSupabase();
      if (editingBar) {
        const { error } = await supabase
          .from('recommended_bars')
          .update({
            name: form.name,
            name_local: form.name_local,
            address: form.address,
            city: form.city,
            phone: form.phone,
            description: form.description,
            sort_order: form.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingBar.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recommended_bars')
          .insert({
            name: form.name,
            name_local: form.name_local,
            address: form.address,
            city: form.city,
            phone: form.phone,
            description: form.description,
            sort_order: form.sort_order,
            status: 'active',
          });
        if (error) throw error;
      }
      setShowModal(false);
      fetchBars();
    } catch (err) {
      console.error('Failed to save bar:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete bar
  const handleDelete = async (id: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('recommended_bars').delete().eq('id', id);
      if (error) throw error;
      setDeleteConfirm(null);
      fetchBars();
    } catch (err) {
      console.error('Failed to delete bar:', err);
    }
  };

  // Toggle status
  const toggleStatus = async (bar: RecommendedBar) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('recommended_bars')
        .update({ status: bar.status === 'active' ? 'inactive' : 'active' })
        .eq('id', bar.id);
      if (error) throw error;
      fetchBars();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🍸 推荐酒吧</h1>
          <p className="text-sm text-gray-400 mt-1">管理热门酒吧推荐，用户发局时可快速选择</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-all hover:scale-105"
        >
          <Plus size={18} />
          新增酒吧
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索酒吧..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2 bg-dark/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary"
        >
          <option value="all">所有城市</option>
          <option value="bangkok">🏙️ 曼谷</option>
          <option value="pattaya">🌴 芭堤雅</option>
          <option value="chiangmai">🏯 清邁</option>
          <option value="phuket">🏝️ 普吉島</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(['bangkok', 'pattaya', 'chiangmai', 'phuket'] as const).map((city) => (
          <div key={city} className="bg-dark/30 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{CITY_EMOJI[city]}</span>
              <span className="text-sm text-gray-400">{CITY_LABELS[city]}</span>
            </div>
            <p className="text-2xl font-bold text-white">{bars.filter(b => b.city === city).length}</p>
            <p className="text-xs text-gray-500">家酒吧</p>
          </div>
        ))}
      </div>

      {/* Bars List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredBars.length === 0 ? (
        <div className="bg-dark/30 rounded-xl p-12 border border-white/10 text-center">
          <span className="text-4xl mb-4 block">🍸</span>
          <p className="text-gray-400">还没有推荐酒吧</p>
          <button
            onClick={() => openModal()}
            className="mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-all"
          >
            添加第一个酒吧
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBars).map(([city, cityBars]) => (
            <div key={city}>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-3">
                <span>{CITY_EMOJI[city]}</span>
                <span>{CITY_LABELS[city]}</span>
                <span className="text-sm font-normal text-gray-500">({cityBars.length})</span>
              </h2>
              <div className="grid gap-3">
                {cityBars.map((bar) => (
                  <div
                    key={bar.id}
                    className={cn(
                      "bg-dark/30 rounded-xl p-4 border transition-all",
                      bar.status === 'active' ? 'border-primary/30' : 'border-white/5 opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white">{bar.name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            bar.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-gray-600 text-gray-400'
                          )}>
                            {bar.status === 'active' ? '顯示' : '隱藏'}
                          </span>
                        </div>
                        {bar.name_local && (
                          <p className="text-sm text-gray-400 mb-1">{bar.name_local}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {bar.address}
                          </span>
                          {bar.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {bar.phone}
                            </span>
                          )}
                        </div>
                        {bar.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{bar.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(bar)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            bar.status === 'active' ? 'hover:bg-mint/20 text-mint' : 'hover:bg-gray-600 text-gray-400'
                          )}
                          title={bar.status === 'active' ? '設為隱藏' : '設為顯示'}
                        >
                          {bar.status === 'active' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button
                          onClick={() => openModal(bar)}
                          className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(bar.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark border border-white/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingBar ? '編輯酒吧' : '新增酒吧'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">酒吧名稱 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：Maggie Choo's"
                  className="w-full px-4 py-2 bg-dark/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">當地名稱</label>
                <input
                  type="text"
                  value={form.name_local}
                  onChange={(e) => setForm({ ...form, name_local: e.target.value })}
                  placeholder="泰文或其他語言名稱"
                  className="w-full px-4 py-2 bg-dark/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">城市 *</label>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value as RecommendedBar['city'] })}
                  className="w-full px-4 py-2 bg-dark/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary"
                >
                  <option value="bangkok">🏙️ 曼谷</option>
                  <option value="pattaya">🌴 芭堤雅</option>
                  <option value="chiangmai">🏯 清邁</option>
                  <option value="phuket">🏝️ 普吉島</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">地址 *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="例如：Silom, Bangkok"
                  className="w-full px-4 py-2 bg-dark/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">電話</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+66 XX XXX XXXX"
                  className="w-full px-4 py-2 bg-dark/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="酒吧特色描述..."
                  rows={3}
                  className="w-full px-4 py-2 bg-dark/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">排序</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-full px-4 py-2 bg-dark/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">數字越小排序越前面</p>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.address}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingBar ? '儲存更改' : '新增酒吧'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark border border-white/20 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-white mb-2">確認刪除</h3>
            <p className="text-gray-400 mb-6">確定要刪除這個酒吧嗎？</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-all"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
