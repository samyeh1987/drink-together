'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Demo meals with Bangkok coordinates
const DEMO_MAP_MEALS = [
  {
    id: '1',
    title: 'Friday Night Izakaya 🍶',
    restaurant: 'Ninja Izakaya, Thonglor',
    lat: 13.7314,
    lng: 100.5714,
    current: 4,
    max: 8,
    status: 'open',
    cuisineEmoji: '🍣',
    datetime: '2026-04-18T19:00:00',
  },
  {
    id: '2',
    title: 'Weekend Hotpot Feast 🫕',
    restaurant: 'Haidilao, Siam Paragon',
    lat: 13.7465,
    lng: 100.5327,
    current: 2,
    max: 10,
    status: 'open',
    cuisineEmoji: '🫕',
    datetime: '2026-04-19T18:30:00',
  },
  {
    id: '3',
    title: 'Best Pad Thai in Town 🍜',
    restaurant: 'Thipsamai, Old Town',
    lat: 13.7563,
    lng: 100.5018,
    current: 5,
    max: 6,
    status: 'confirmed',
    cuisineEmoji: '🍜',
    datetime: '2026-04-17T12:00:00',
  },
  {
    id: '4',
    title: 'Korean BBQ Night 🔥',
    restaurant: 'Maple House, Ari',
    lat: 13.7804,
    lng: 100.5404,
    current: 3,
    max: 8,
    status: 'open',
    cuisineEmoji: '🍖',
    datetime: '2026-04-20T19:30:00',
  },
  {
    id: '5',
    title: 'Italian Wine Dinner 🍷',
    restaurant: 'Appia, Ekkamai',
    lat: 13.7273,
    lng: 100.5826,
    current: 6,
    max: 8,
    status: 'closed',
    cuisineEmoji: '🍝',
    datetime: '2026-04-16T19:00:00',
  },
  {
    id: '6',
    title: 'Dim Sum Brunch 🥟',
    restaurant: 'Tim Ho Wan, Central Embassy',
    lat: 13.7462,
    lng: 100.5373,
    current: 2,
    max: 6,
    status: 'open',
    cuisineEmoji: '🥟',
    datetime: '2026-04-21T10:30:00',
  },
];

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]; // Bangkok

interface NearbyMapProps {
  mapTitle: string;
  mapSubtitle: string;
  viewDetailsText: string;
  openMealsText: string;
  locale: string;
}

export default function NearbyMap({ mapTitle, mapSubtitle, viewDetailsText, openMealsText, locale }: NearbyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import leaflet (SSR-safe)
    let L: any = null;
    let map: any = null;

    const initMap = async () => {
      const leaflet = await import('leaflet');
      L = leaflet.default || leaflet;

      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView(DEFAULT_CENTER, 13);

      mapInstanceRef.current = map;

      // Add zoom control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 13);

            // Add user location marker (blue dot)
            const userIcon = L.divIcon({
              className: 'user-location-dot',
              html: `<div style="width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            L.marker([pos.coords.latitude, pos.coords.longitude], { icon: userIcon }).addTo(map);
          },
          () => {
            // Location denied - stay at default center
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      }

      // Add meal markers
      DEMO_MAP_MEALS.forEach((meal) => {
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

        L.marker([meal.lat, meal.lng], { icon })
          .addTo(map)
          .bindPopup(popup);
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locale, viewDetailsText]);

  const openMealsCount = DEMO_MAP_MEALS.filter((m) => m.status === 'open').length;

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
        </div>

        {/* Map Legend */}
        <div className="flex items-center gap-4 px-4 mt-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
            <span className="text-[11px] text-gray">
              {locale === 'zh-CN' ? '报名中' : locale === 'th' ? 'เปิดรับสมัคร' : 'Open'}
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
