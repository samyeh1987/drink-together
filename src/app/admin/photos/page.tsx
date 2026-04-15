'use client';

import { useState, useMemo } from 'react';
import {
  Search, Filter, Eye, X, Heart, Star, Clock,
  CheckCircle2, XCircle, Image as ImageIcon, Trash2,
  ChevronRight, MoreVertical, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_PHOTOS, ADMIN_STATUS_COLORS, type AdminPhoto } from '../data';

export default function AdminPhotosPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<AdminPhoto | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...DEMO_PHOTOS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.uploader_name.toLowerCase().includes(q) ||
        p.meal_title.toLowerCase().includes(q) ||
        p.caption?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [search, statusFilter]);

  const stats = useMemo(() => ({
    total: DEMO_PHOTOS.length,
    pending: DEMO_PHOTOS.filter(p => p.status === 'pending').length,
    featured: DEMO_PHOTOS.filter(p => p.status === 'featured').length,
    totalLikes: DEMO_PHOTOS.reduce((s, p) => s + p.likes_count, 0),
  }), []);

  const handleAction = (photo: AdminPhoto, action: 'approved' | 'rejected' | 'featured') => {
    alert(`Photo ${photo.id} ${action}`);
    setActionMenu(null);
  };

  // Photo placeholder gradient based on id
  const getPlaceholderGradient = (id: string) => {
    const gradients = [
      'from-orange-200 to-red-200',
      'from-blue-200 to-purple-200',
      'from-green-200 to-teal-200',
      'from-yellow-200 to-orange-200',
      'from-pink-200 to-rose-200',
      'from-indigo-200 to-blue-200',
      'from-teal-200 to-cyan-200',
      'from-amber-200 to-yellow-200',
    ];
    const idx = parseInt(id.replace('ph', '')) % gradients.length;
    return gradients[idx];
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Photos</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage user-uploaded meal photos for the gallery.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> Export All
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Photos', value: stats.total, icon: ImageIcon, color: 'from-purple-500 to-purple-600' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
          { label: 'Featured', value: stats.featured, icon: Star, color: 'from-[#FFD700] to-[#FFA500]' },
          { label: 'Total Likes', value: stats.totalLikes, icon: Heart, color: 'from-red-400 to-red-500' },
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
            placeholder="Search by uploader, meal, or caption..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'pending', 'approved', 'featured', 'rejected'].map(s => (
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

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(photo => (
          <div
            key={photo.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
          >
            {/* Image placeholder */}
            <div
              onClick={() => setSelectedPhoto(photo)}
              className="relative h-48 bg-gradient-to-br cursor-pointer flex items-center justify-center"
              style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br', getPlaceholderGradient(photo.id))} />
              <div className="relative flex flex-col items-center gap-2">
                <ImageIcon className="w-10 h-10 text-white/60" />
                <span className="text-white/60 text-xs">Demo Image</span>
              </div>
              {/* Status overlay */}
              <div className="absolute top-3 left-3">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', ADMIN_STATUS_COLORS[photo.status])}>
                  {photo.status}
                </span>
              </div>
              {/* Featured badge */}
              {photo.status === 'featured' && (
                <div className="absolute top-3 right-3">
                  <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Info */}
            <div className="p-3.5">
              <div className="flex items-start justify-between mb-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{photo.meal_title}</p>
                  <p className="text-[11px] text-gray-400">by {photo.uploader_name}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{photo.likes_count}</span>
                </div>
              </div>
              {photo.caption && (
                <p className="text-xs text-gray-500 line-clamp-1 mb-2">&quot;{photo.caption}&quot;</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className="text-[10px] text-gray-400">
                  {new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {photo.status === 'pending' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAction(photo, 'approved')}
                      className="p-1.5 rounded-lg hover:bg-[#2EC4B6]/10 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#2EC4B6]" />
                    </button>
                    <button
                      onClick={() => handleAction(photo, 'rejected')}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
                {photo.status === 'approved' && (
                  <button
                    onClick={() => handleAction(photo, 'featured')}
                    className="p-1.5 rounded-lg hover:bg-[#FFD700]/10 transition-colors"
                  >
                    <Star className="w-4 h-4 text-gray-400 hover:text-[#FFD700]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* Image area */}
            <div className="relative h-56">
              <div className={cn('absolute inset-0 bg-gradient-to-br', getPlaceholderGradient(selectedPhoto.id))} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-12 h-12 text-white/60" />
                <span className="text-white/60 text-sm">Demo Image</span>
              </div>
              <button onClick={() => setSelectedPhoto(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors">
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <div className="absolute top-3 left-3">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', ADMIN_STATUS_COLORS[selectedPhoto.status])}>
                  {selectedPhoto.status}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selectedPhoto.meal_title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">Uploaded by {selectedPhoto.uploader_name}</p>
              </div>

              {selectedPhoto.caption && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-gray-600 italic">&quot;{selectedPhoto.caption}&quot;</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Heart className="w-4 h-4 text-red-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{selectedPhoto.likes_count}</p>
                  <p className="text-[10px] text-gray-500">Likes</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">Meal ID</p>
                  <p className="text-sm font-medium text-gray-700">{selectedPhoto.meal_id}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">Uploaded</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(selectedPhoto.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {selectedPhoto.reviewed_at && (
                <p className="text-xs text-gray-400">
                  Reviewed by {selectedPhoto.reviewed_by} on {new Date(selectedPhoto.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedPhoto.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { handleAction(selectedPhoto, 'approved'); setSelectedPhoto(null); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2EC4B6] text-white rounded-xl text-sm font-medium hover:bg-[#2EC4B6]/90"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => { handleAction(selectedPhoto, 'rejected'); setSelectedPhoto(null); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {selectedPhoto.status === 'approved' && (
                  <button
                    onClick={() => { handleAction(selectedPhoto, 'featured'); setSelectedPhoto(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFD700]/20 text-[#B8860B] rounded-xl text-sm font-medium hover:bg-[#FFD700]/30"
                  >
                    <Star className="w-4 h-4" /> Set as Featured
                  </button>
                )}
                <button
                  onClick={() => { alert('Photo deleted'); setSelectedPhoto(null); }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
