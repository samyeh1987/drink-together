'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowLeft,
  X,
  ChevronRight,
  ChevronLeft,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  User,
} from 'lucide-react';

// Demo gallery data
const GALLERY_CATEGORIES = ['all', 'recent', 'popular'] as const;
type CategoryKey = typeof GALLERY_CATEGORIES[number];

interface GalleryPhoto {
  id: string;
  url: string;
  mealTitle: string;
  restaurant: string;
  author: string;
  likes: number;
  timestamp: string;
}

const DEMO_PHOTOS: GalleryPhoto[] = [
  {
    id: '1',
    url: 'https://picsum.photos/seed/gallery1/600/600',
    mealTitle: 'Friday Night Izakaya 🍶',
    restaurant: 'Ninja Izakaya, Thonglor',
    author: 'Sarah K.',
    likes: 12,
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    url: 'https://picsum.photos/seed/gallery2/600/600',
    mealTitle: 'Weekend Hotpot Feast 🫕',
    restaurant: 'Haidilao, Siam Paragon',
    author: 'Alex W.',
    likes: 24,
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    url: 'https://picsum.photos/seed/gallery3/600/600',
    mealTitle: 'Best Pad Thai in Town 🍜',
    restaurant: 'Thipsamai, Old Town',
    author: 'Somchai P.',
    likes: 8,
    timestamp: '1 day ago',
  },
  {
    id: '4',
    url: 'https://picsum.photos/seed/gallery4/600/600',
    mealTitle: 'Korean BBQ Night 🔥',
    restaurant: 'Maple House, Ari',
    author: 'Mike L.',
    likes: 18,
    timestamp: '1 day ago',
  },
  {
    id: '5',
    url: 'https://picsum.photos/seed/gallery5/600/600',
    mealTitle: 'Sunday Brunch & Coffee ☕',
    restaurant: 'Roast, Thonglor',
    author: 'Emma T.',
    likes: 31,
    timestamp: '2 days ago',
  },
  {
    id: '6',
    url: 'https://picsum.photos/seed/gallery6/600/600',
    mealTitle: 'Dim Sum Morning 🥟',
    restaurant: 'Tim Ho Wan, CentralWorld',
    author: 'David C.',
    likes: 15,
    timestamp: '3 days ago',
  },
  {
    id: '7',
    url: 'https://picsum.photos/seed/gallery7/600/600',
    mealTitle: 'Tacos & Margaritas Night 🌮',
    restaurant: 'La Monita, Sukhumvit',
    author: 'Carlos R.',
    likes: 9,
    timestamp: '3 days ago',
  },
  {
    id: '8',
    url: 'https://picsum.photos/seed/gallery8/600/600',
    mealTitle: 'Thai Home Cooking Class 🍛',
    restaurant: 'Silom Cooking Studio',
    author: 'Noy S.',
    likes: 22,
    timestamp: '4 days ago',
  },
  {
    id: '9',
    url: 'https://picsum.photos/seed/gallery9/600/600',
    mealTitle: 'Italian Wine Dinner 🍷',
    restaurant: 'Appia, Ekkamai',
    author: 'Marco B.',
    likes: 6,
    timestamp: '5 days ago',
  },
  {
    id: '10',
    url: 'https://picsum.photos/seed/gallery10/600/600',
    mealTitle: 'Sushi Omakase Night 🍣',
    restaurant: 'Sushi Masato, Chit Lom',
    author: 'Yuki T.',
    likes: 42,
    timestamp: '1 week ago',
  },
  {
    id: '11',
    url: 'https://picsum.photos/seed/gallery11/600/600',
    mealTitle: 'Street Food Adventure 🛵',
    restaurant: 'Yaowarat (Chinatown)',
    author: 'Sarah K.',
    likes: 35,
    timestamp: '1 week ago',
  },
  {
    id: '12',
    url: 'https://picsum.photos/seed/gallery12/600/600',
    mealTitle: 'Vegan Brunch Party 🥗',
    restaurant: 'Broccoli Revolution, Sukhumvit 49',
    author: 'Lisa M.',
    likes: 11,
    timestamp: '2 weeks ago',
  },
];

export default function GalleryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set(['2', '5', '10']));

  // Filter and sort photos
  const displayPhotos = activeCategory === 'popular'
    ? [...DEMO_PHOTOS].sort((a, b) => b.likes - a.likes)
    : DEMO_PHOTOS;

  const openPhoto = (photo: GalleryPhoto, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
  };

  const toggleLike = (photoId: string) => {
    setLikedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen pb-20 bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href={`/${locale}`}
            className="p-2 -ml-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark" />
          </Link>
          <h1 className="text-base font-semibold text-dark">
            {t('gallery.title')}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Category Tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray hover:bg-gray-50 border border-gray-lighter/50'
              }`}
            >
              {t(`gallery.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray">
          {DEMO_PHOTOS.length} {t('gallery.photosCount')}
        </p>
      </div>

      {/* Photo Grid - Masonry style */}
      <div className="px-4">
        <div className="columns-2 gap-2.5 space-y-2.5">
          {displayPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="break-inside-avoid"
            >
              <button
                onClick={() => openPhoto(photo, index)}
                className="w-full text-left"
              >
                <div className="card overflow-hidden p-0 cursor-pointer group">
                  {/* Photo - varying heights for masonry effect */}
                  <div className={`relative overflow-hidden ${index % 3 === 0 ? 'aspect-[3/4]' : index % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.mealTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Like badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                      <Heart
                        className={`w-3 h-3 ${likedPhotos.has(photo.id) ? 'text-coral fill-coral' : 'text-white'}`}
                        fill={likedPhotos.has(photo.id) ? 'currentColor' : 'none'}
                      />
                      <span className="text-[10px] text-white font-medium">
                        {photo.likes + (likedPhotos.has(photo.id) ? 0 : 0)}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-dark truncate">{photo.mealTitle}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-primary">{photo.author.charAt(0)}</span>
                        </div>
                        <span className="text-[10px] text-gray truncate">{photo.author}</span>
                      </div>
                      <span className="text-[10px] text-gray-light">{photo.timestamp}</span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            {selectedPhotoIndex > 0 && (
              <button
                onClick={() => {
                  const newIndex = selectedPhotoIndex - 1;
                  setSelectedPhotoIndex(newIndex);
                  setSelectedPhoto(displayPhotos[newIndex]);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {selectedPhotoIndex < displayPhotos.length - 1 && (
              <button
                onClick={() => {
                  const newIndex = selectedPhotoIndex + 1;
                  setSelectedPhotoIndex(newIndex);
                  setSelectedPhoto(displayPhotos[newIndex]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <motion.div
                key={selectedPhoto.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.mealTitle}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </motion.div>
            </div>

            {/* Bottom info */}
            <div className="bg-white rounded-t-3xl p-5 pb-8 safe-bottom">
              <h3 className="font-bold text-dark text-base mb-1">{selectedPhoto.mealTitle}</h3>
              <p className="text-sm text-gray mb-3 flex items-center gap-1">
                📍 {selectedPhoto.restaurant}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-coral/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{selectedPhoto.author.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">{selectedPhoto.author}</p>
                    <p className="text-[10px] text-gray">{selectedPhoto.timestamp}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleLike(selectedPhoto.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-light transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${likedPhotos.has(selectedPhoto.id) ? 'text-coral fill-coral' : 'text-gray'}`}
                    fill={likedPhotos.has(selectedPhoto.id) ? 'currentColor' : 'none'}
                  />
                  <span className={`text-sm font-medium ${likedPhotos.has(selectedPhoto.id) ? 'text-coral' : 'text-gray'}`}>
                    {selectedPhoto.likes}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
