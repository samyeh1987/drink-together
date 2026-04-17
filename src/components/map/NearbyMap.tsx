'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { fetchOpenMeals } from '@/lib/api';

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]; // Bangkok

const CUISINE_EMOJI: Record<string, string> = {
  japanese: '🍣', thai: '🍜', chinese: '🥡', korean: '🍖', italian: '🍕',
  western: '🥩', hotpot: '🫕', bbq: '🔥', buffet: '🍽️', seafood: '🦐',
  dimsum: '🥟', vegetarian: '🥗', other: '🍴',
};

interface NearbyMapProps {
  mapTitle: string;
  mapSubtitle: string;
  viewDetailsText: string;
  openMealsText: string;
  locale: string;
}

interface MapMeal {
  id: string;
  title: string;
  restaurant: string;
  lat: number;
  lng: number;
  current: number;
  max: number;
  min: number;
  status: string;
  cuisineEmoji: string;
  datetime: string;
}

export default function NearbyMap({ mapTitle, mapSubtitle, viewDetailsText, openMealsText, locale }: NearbyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const router = useRouter();
  const [locating, setLocating] = useState(true);
  const [locateError, setLocateError] = useState(false);
  const [meals, setMeals] = useState<MapMeal[]>([]);
  const markersRef = useRef<any[]>([]);

  // Load meals from Supabase
  useEffect(() => {
    async function loadMeals() {
      try {
        const data = await fetchOpenMeals();
        const mapMeals: MapMeal[] = data
          .filter((m: any) => m.latitude && m.longitude)
          .map((m: any) => ({
            id: m.id,
            title: m.title,
            restaurant: m.restaurant_name,
            lat: m.latitude,
            lng: m.longitude,
            current: m._currentParticipants ?? m.participants?.length ?? 1,
            max: m.max_participants,
            min: m.min_participants,
            status: m.status,
            cuisineEmoji: m._cuisineEmoji || CUISINE_EMOJI[m.cuisine_type] || '🍴',
            datetime: m.datetime,
          }));
        setMeals(mapMeals);
      } catch (err) {
        console.error('Failed to load meals for map:', err);
      }
    }
    loadMeals();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let L: any = null;
    let map: any = null;

    const initMap = async () => {
      const leaflet = await import('leaflet');
      L = leaflet.default || leaflet;
      leafletRef.current = L;

      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Add Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView(DEFAULT_CENTER, 13);

      mapInstanceRef.current = map;

      // Add tile layer (map background)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocating(false);
            map.setView([pos.coords.latitude, pos.coords.longitude], 14);

            // Add user location marker (blue dot with pulse ring)
            const userIcon = L.divIcon({
              className: 'user-location-dot',
              html: `
                <div style="position:relative;width:40px;height:40px;">
                  <div style="position:absolute;inset:0;background:rgba(59,130,246,0.15);border-radius:50%;animation:userPulse 2s ease-out infinite;"></div>
                  <div style="position:absolute;top:12px;left:12px;width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            });
            L.marker([pos.coords.latitude, pos.coords.longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

            // Add pulse animation style
            const style = document.createElement('style');
            style.textContent = `
              @keyframes userPulse {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          },
          () => {
            setLocating(false);
            setLocateError(true);
            // Stay at default center (Bangkok)
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      } else {
        setLocating(false);
        setLocateError(true);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locale, viewDetailsText]);

  // Update meal markers when meals change
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;

    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    meals.forEach((meal) => {
      const isOpen = meal.status === 'open';
      const isConfirmed = meal.status === 'confirmed';
      const pinColor = isOpen ? '#FF6B6B' : isConfirmed ? '#22C55E' : '#9CA3AF';

      const icon = L.divIcon({
        className: 'meal-pin',
        html: `
          <div style="
            width: 36px; height: 36px;
            background: ${pinColor};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
          ">
            <span style="transform: rotate(45deg)">${meal.cuisineEmoji}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const timeStr = new Date(meal.datetime).toLocaleDateString(
        locale === 'th' ? 'th-TH' : locale, {
          month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }
      );

      const popup = L.popup({
        closeButton: false,
        className: 'meal-popup',
        offset: [0, 0],
      }).setContent(`
        <div style="min-width:200px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
          <div style="font-size:14px;font-weight:700;margin-bottom:4px;color:#1a1a2e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${meal.title}</div>
          <div style="font-size:12px;color:#666;margin-bottom:6px">📍 ${meal.restaurant}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;color:#888">
            <span>📅 ${timeStr}</span>
            <span>👥 ${meal.current}/${meal.max}</span>
          </div>
          <a href="/${locale}/meals/${meal.id}" style="
            display:block;text-align:center;padding:6px 0;
            background:${isOpen ? '#FF6B6B' : '#e5e7eb'};
            color:white;border-radius:8px;font-size:12px;font-weight:600;
            text-decoration:none;cursor:pointer;
          ">${viewDetailsText}</a>
        </div>
      `);

      const marker = L.marker([meal.lat, meal.lng], { icon })
        .addTo(map)
        .bindPopup(popup);

      markersRef.current.push(marker);
    });
  }, [meals, locale, viewDetailsText]);

  const openMealsCount = meals.filter((m) => m.status === 'open').length;

  return (
    <div className="mb-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {/* Section Header */}
        <div className="flex items-center justify-between px-4 mb-3">
          <div>
            <h2 className="text-lg font-bold text-dark">{mapTitle}</h2>
            <p className="text-xs text-gray mt-0.5">{mapSubtitle}</p>
          </div>
          <span className="tag text-[11px] bg-coral/10 text-coral">
            {openMealsCount} {openMealsText}
          </span>
        </div>

        {/* Map Container */}
        <div className="mx-4 rounded-2xl overflow-hidden shadow-sm border border-gray-lighter/50">
          <div
            ref={mapRef}
            className="w-full"
            style={{ height: '280px' }}
          />
          {/* Location Status Overlay */}
          {locating && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-xs text-gray-600 flex items-center gap-1.5 z-[1000] pointer-events-none">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {locale === 'zh-CN' ? '定位中...' : locale === 'th' ? 'กำลังหาตำแหน่ง...' : 'Locating...'}
            </div>
          )}
          {locateError && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-xs text-gray-500 z-[1000] pointer-events-none">
              {locale === 'zh-CN' ? '📍 使用預設位置（曼谷）' : locale === 'th' ? '📍 ใช้ตำแหน่งเริ่มต้น (กรุงเทพฯ)' : '📍 Using default location (Bangkok)'}
            </div>
          )}
        </div>

        {/* Map Legend */}
        <div className="flex items-center gap-4 px-4 mt-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
            <span className="text-[11px] text-gray">
              {locale === 'zh-CN' ? '報名中' : locale === 'th' ? 'เปิดรับสมัคร' : 'Open'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
            <span className="text-[11px] text-gray">
              {locale === 'zh-CN' ? '已成立' : locale === 'th' ? 'ยืนยันแล้ว' : 'Confirmed'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]" />
            <span className="text-[11px] text-gray">
              {locale === 'zh-CN' ? '已截止' : locale === 'th' ? 'ปิดรับสมัคร' : 'Closed'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] border border-white" />
            <span className="text-[11px] text-gray">
              {locale === 'zh-CN' ? '我的位置' : locale === 'th' ? 'ตำแหน่งของฉัน' : 'You'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
