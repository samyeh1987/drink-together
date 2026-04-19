'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, Eye, X, Heart, Star, Clock,
  CheckCircle2, XCircle, Image as ImageIcon, Trash2,
  Download, Loader2, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_STATUS_COLORS, type AdminPhoto } from '../data';
import { useAdminT } from '../AdminI18nProvider';

export default function AdminPhotosPage() {
  const t = useAdminT();
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<AdminPhoto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadPhotos() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data, error } = await supabase
          .from('meal_photos')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Enrich with uploader names and meal titles
          const userIds = [...new Set(data.map((p: any) => p.user_id).filter(Boolean))];
          const mealIds = [...new Set(data.map((p: any) => p.meal_id).filter(Boolean))];

          let profileMap: Record<string, { nickname: string | null; email: string | null }> = {};
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, nickname, email')
              .in('id', userIds);
            if (profiles) {
              profileMap = profiles.reduce((acc, p: any) => {
                acc[p.id] = { nickname: p.nickname, email: p.email };
                return acc;
              }, {} as Record<string, { nickname: string | null; email: string | null }>);
            }
          }

          let mealMap: Record<string, string> = {};
          if (mealIds.length > 0) {
            const { data: meals } = await supabase
              .from('meals')
              .select('id, title')
              .in('id', mealIds);
            if (meals) {
              mealMap = meals.reduce((acc, m: any) => {
                acc[m.id] = m.title;
                return acc;
              }, {} as Record<string, string>);
            }
          }

          const mapped: AdminPhoto[] = data.map((p: any) => ({
            id: p.id,
            meal_id: p.meal_id || '',
            meal_title: p.meal_id ? (mealMap[p.meal_id] || 'Unknown Meal') : '',
            uploader_name: p.user_id ? (profileMap[p.user_id]?.nickname || 'Unknown') : 'Unknown',
            uploader_email: p.user_id ? (profileMap[p.user_id]?.email || '') : '',
            url: p.url || p.photo_url || '',
            caption: p.caption || null,
            likes_count: p.likes_count || 0,
            status: p.status || 'approved',
            created_at: p.created_at,
            reviewed_at: p.reviewed_at || null,
            reviewed_by: p.reviewed_by || null,
          }));

          setPhotos(mapped);
        }
      } catch (err) {
        console.error('Failed to load photos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPhotos();
  }, []);

  const filtered = useMemo(() => {
    let list = [...photos];
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
  }, [photos, search, statusFilter]);

  const stats = useMemo(() => ({
    total: photos.length,
    pending: photos.filter(p => p.status === 'pending').length,
    featured: photos.filter(p => p.status === 'featured').length,
    totalLikes: photos.reduce((s, p) => s + p.likes_count, 0),
  }), [photos]);

  const handleAction = async (photo: AdminPhoto, action: 'approved' | 'rejected' | 'featured') => {
    setActionLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase
        .from('meal_photos')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', photo.id);
      if (error) throw error;
      setPhotos(prev => prev.map(p => p.id === photo.id ? {
        ...p,
        status: action,
        reviewed_at: new Date().toISOString(),
      } : p));
      setSelectedPhoto(null);
    } catch (err) {
      console.error('Failed to update photo:', err);
      alert('Failed to update photo status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePhoto = async (photo: AdminPhoto) => {
    if (!confirm('Delete this photo permanently?')) return;
    setActionLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase
        .from('meal_photos')
        .delete()
        .eq('id', photo.id);
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setSelectedPhoto(null);
    } catch (err) {
      console.error('Failed to delete photo:', err);
      alert('Failed to delete photo');
    } finally {
      setActionLoading(false);
    }
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
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('photos.title')}</h1>
          <p className="text-sm text-gray-light mt-1">{t('photos.subtitle')}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors">
          <Download className="w-4 h-4" /> {t('photos.exportAll')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('photos.totalPhotos'), value: stats.total, icon: ImageIcon, color: 'from-coral to-pink-400' },
          { label: t('photos.pendingReview'), value: stats.pending, icon: Clock, color: 'from-gold to-yellow-400' },
          { label: t('photos.featured'), value: stats.featured, icon: Star, color: 'from-gold to-yellow-400' },
          { label: t('photos.totalLikes'), value: stats.totalLikes, icon: Heart, color: 'from-coral to-red-400' },
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
              <p className="text-xl font-bold text-white">{loading ? '...' : s.value}</p>
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
            placeholder={t('photos.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white placeholder:text-gray-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Loading photos...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && photos.length === 0 && (
        <div className="text-center py-16">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No photos yet</p>
          <p className="text-gray-400 text-xs mt-1">Photos will appear here when users upload them</p>
        </div>
      )}

      {/* Photo Grid */}
      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(photo => (
            <div
              key={photo.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Image */}
              <div
                onClick={() => setSelectedPhoto(photo)}
                className="relative h-48 bg-gradient-to-br cursor-pointer flex items-center justify-center"
              >
                {photo.url ? (
                  <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className={cn('absolute inset-0 bg-gradient-to-br', getPlaceholderGradient(photo.id))} />
                    <div className="relative flex flex-col items-center gap-2">
                      <ImageIcon className="w-10 h-10 text-white/60" />
                      <span className="text-white/60 text-xs">{t('photos.demoImage')}</span>
                    </div>
                  </>
                )}
                {/* Status overlay */}
                <div className="absolute top-3 left-3">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', ADMIN_STATUS_COLORS[photo.status])}>
                    {photo.status}
                  </span>
                </div>
                {photo.status === 'featured' && (
                  <div className="absolute top-3 right-3">
                    <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" />
                  </div>
                )}
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
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg hover:bg-[#2EC4B6]/10 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#2EC4B6]" />
                      </button>
                      <button
                        onClick={() => handleAction(photo, 'rejected')}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                  {photo.status === 'approved' && (
                    <button
                      onClick={() => handleAction(photo, 'featured')}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg hover:bg-[#FFD700]/10 transition-colors disabled:opacity-50"
                    >
                      <Star className="w-4 h-4 text-gray-400 hover:text-[#FFD700]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* Image area */}
            <div className="relative h-56">
              {selectedPhoto.url ? (
                <img src={selectedPhoto.url} alt={selectedPhoto.caption || ''} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className={cn('absolute inset-0 bg-gradient-to-br', getPlaceholderGradient(selectedPhoto.id))} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="w-12 h-12 text-white/60" />
                    <span className="text-white/60 text-sm">{t('photos.demoImage')}</span>
                  </div>
                </>
              )}
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
                <p className="text-sm text-gray-500 mt-0.5">{t('photos.uploadedBy')} {selectedPhoto.uploader_name}</p>
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
                  <p className="text-[10px] text-gray-500">{t('photos.likes')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">{t('photos.mealId')}</p>
                  <p className="text-sm font-medium text-gray-700">{selectedPhoto.meal_id}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 mb-1">{t('photos.uploaded')}</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(selectedPhoto.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {selectedPhoto.reviewed_at && (
                <p className="text-xs text-gray-400">
                  {t('photos.reviewedBy')} {selectedPhoto.reviewed_by || 'Admin'} on {new Date(selectedPhoto.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedPhoto.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedPhoto, 'approved')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2EC4B6] text-white rounded-xl text-sm font-medium hover:bg-[#2EC4B6]/90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> {t('photos.approve')}
                    </button>
                    <button
                      onClick={() => handleAction(selectedPhoto, 'rejected')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> {t('photos.reject')}
                    </button>
                  </>
                )}
                {selectedPhoto.status === 'approved' && (
                  <button
                    onClick={() => handleAction(selectedPhoto, 'featured')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFD700]/20 text-[#B8860B] rounded-xl text-sm font-medium hover:bg-[#FFD700]/30 disabled:opacity-50"
                  >
                    <Star className="w-4 h-4" /> {t('photos.setAsFeatured')}
                  </button>
                )}
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto)}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
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
