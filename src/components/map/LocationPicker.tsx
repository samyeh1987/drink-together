'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X, Loader2, Navigation } from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]; // Bangkok

interface LocationResult {
  lat: number;
  lng: number;
  display_name: string;
}

interface LocationPickerProps {
  address: string;
  onLocationSelect: (data: { lat: number; lng: number; address: string }) => void;
  onAddressChange: (address: string) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  locale: string;
  searchPlaceholder?: string;
  mapHeight?: string;
}

export default function LocationPicker({
  address,
  onLocationSelect,
  onAddressChange,
  initialLat,
  initialLng,
  locale,
  searchPlaceholder,
  mapHeight = '200px',
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const leaflet = await import('leaflet');
      const L = leaflet.default || leaflet;
      leafletRef.current = L;

      // Add Leaflet CSS if not present
      if (!document.getElementById('leaflet-picker-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-picker-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const center: [number, number] = (lat && lng) ? [lat, lng] : DEFAULT_CENTER;
      const zoom = (lat && lng) ? 16 : 13;

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, zoom);

      mapInstanceRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Click to place marker
      map.on('click', async (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        placeMarker(clickLat, clickLng);
        setLat(clickLat);
        setLng(clickLng);

        // Reverse geocode to get address
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': locale === 'th' ? 'th' : locale === 'zh-CN' ? 'zh' : 'en' } }
          );
          const data = await resp.json();
          if (data.display_name) {
            onAddressChange(data.display_name);
            onLocationSelect({ lat: clickLat, lng: clickLng, address: data.display_name });
          }
        } catch {
          // Still set the location even if reverse geocode fails
          onLocationSelect({ lat: clickLat, lng: clickLng, address: address });
        }
      });

      // If initial coordinates exist, place marker
      if (lat && lng) {
        placeMarker(lat, lng);
      }

      setMapReady(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeMarker = (markerLat: number, markerLng: number) => {
    if (!mapInstanceRef.current || !leafletRef.current) return;
    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    if (markerRef.current) {
      markerRef.current.setLatLng([markerLat, markerLng]);
    } else {
      const icon = L.divIcon({
        className: 'location-picker-marker',
        html: `
          <div style="position:relative;width:32px;height:40px;">
            <div style="
              width:32px;height:32px;background:#FF6B6B;border:3px solid white;
              border-radius:50% 50% 50% 0;transform:rotate(-45deg);
              box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;
            ">
              <svg style="transform:rotate(45deg)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });
      markerRef.current = L.marker([markerLat, markerLng], { icon, draggable: true }).addTo(map);

      // Drag marker to update position
      markerRef.current.on('dragend', async () => {
        const pos = markerRef.current.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': locale === 'th' ? 'th' : locale === 'zh-CN' ? 'zh' : 'en' } }
          );
          const data = await resp.json();
          if (data.display_name) {
            onAddressChange(data.display_name);
            onLocationSelect({ lat: pos.lat, lng: pos.lng, address: data.display_name });
          }
        } catch {
          onLocationSelect({ lat: pos.lat, lng: pos.lng, address: address });
        }
      });
    }
  };

  const updateMapView = useCallback((markerLat: number, markerLng: number) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([markerLat, markerLng], 16, { animate: true });
    placeMarker(markerLat, markerLng);
  }, []);

  // Search address via Nominatim
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=th&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': locale === 'th' ? 'th' : locale === 'zh-CN' ? 'zh' : 'en' } }
      );
      const data = await resp.json();
      setSearchResults(data || []);
      setShowResults((data || []).length > 0);
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleInputChange = (value: string) => {
    onAddressChange(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchAddress(value), 600);
  };

  const selectResult = (result: LocationResult) => {
    setLat(result.lat);
    setLng(result.lng);
    onAddressChange(result.display_name);
    onLocationSelect({ lat: result.lat, lng: result.lng, address: result.display_name });
    setShowResults(false);
    updateMapView(result.lat, result.lng);
  };

  const clearLocation = () => {
    setLat(null);
    setLng(null);
    onAddressChange('');
    onLocationSelect({ lat: 0, lng: 0, address: '' });
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(DEFAULT_CENTER, 13, { animate: true });
    }
  };

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-light" />
          <input
            type="text"
            className="input pl-10 pr-10"
            placeholder={searchPlaceholder || 'Search restaurant or address...'}
            value={address}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
          )}
          {!isSearching && lat && (
            <button
              type="button"
              onClick={clearLocation}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-light hover:text-coral transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-lg border border-gray-lighter/50 overflow-hidden max-h-60 overflow-y-auto"
            >
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectResult(result)}
                  className="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors border-b border-gray-lighter/30 last:border-0"
                >
                  <div className="text-sm text-dark font-medium line-clamp-1">
                    {result.display_name.split(',').slice(0, 2).join(',')}
                  </div>
                  <div className="text-xs text-gray-light line-clamp-1 mt-0.5">
                    {result.display_name}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Preview */}
      <div className="relative rounded-xl overflow-hidden border border-gray-lighter/50">
        <div ref={mapRef} className="w-full" style={{ height: mapHeight }} />
        {lat && lng && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm text-[11px] text-gray-600 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-primary" />
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        )}
        {!lat && !lng && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-cream/30">
            <div className="text-center">
              <MapPin className="w-6 h-6 text-gray-lighter mx-auto mb-1" />
              <p className="text-xs text-gray-light">
                {locale === 'zh-CN' ? '搜尋地址或點擊地圖選擇位置' :
                 locale === 'th' ? 'ค้นหาที่อยู่หรือแตะแผนที่เพื่อเลือกตำแหน่ง' :
                 'Search address or tap map to pick location'}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-light">
        {locale === 'zh-CN' ? '💡 可以搜尋地址或直接在地圖上點選位置' :
         locale === 'th' ? '💡 ค้นหาที่อยู่หรือแตะบนแผนที่เพื่อเลือกตำแหน่ง' :
         '💡 Search an address or tap on the map to pick a location'}
      </p>
    </div>
  );
}
