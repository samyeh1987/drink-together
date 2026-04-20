'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Wine,
  MapPin,
  Calendar,
  Clock,
  Users,
  CreditCard,
  Globe,
  MessageCircle,
  Sparkles,
  Loader2,
  Star,
} from 'lucide-react';
import {
  CUISINE_TYPES,
  MEAL_LANGUAGES,
  PAYMENT_METHODS,
  MEAL_TAGS,
} from '@/lib/constants';
import { useLocale } from 'next-intl';
import { createMeal } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false });

type PaymentKey = 'hostTreats' | 'splitBill';

interface MealForm {
  title: string;
  restaurant: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  cuisine: string;
  dateTime: string;
  deadline: string;
  minParticipants: number;
  maxParticipants: number;
  payment: PaymentKey;
  budget: string;
  languages: string[];
  note: string;
  tags: string[];
}

const initialForm: MealForm = {
  title: '',
  restaurant: '',
  address: '',
  latitude: null,
  longitude: null,
  cuisine: '',
  dateTime: '',
  deadline: '',
  minParticipants: 2,
  maxParticipants: 8,
  payment: 'splitBill',
  budget: '',
  languages: ['en'],
  note: '',
  tags: [],
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ─── Step 1: Basic Info (stable component) ─────────
function Step1({ form, updateField, t }: {
  form: MealForm;
  updateField: <K extends keyof MealForm>(key: K, value: MealForm[K]) => void;
  t: (key: string) => string;
}) {
  const locale = useLocale();

  // Popular bars by city
  const popularBars = {
    bangkok: [
      { name: 'Maggie Choo\'s', address: 'Silom, Bangkok' },
      { name: 'Above Riva', address: 'Riverside, Bangkok' },
      { name: 'Sky Bar', address: 'Sathorn, Bangkok' },
    ],
    pattaya: [
      { name: 'Lucifer Bar', address: 'Walking Street, Pattaya' },
      { name: 'The Rock House', address: 'North Pattaya' },
    ],
    chiangmai: [
      { name: 'The Good View Bar', address: 'Charoenrat, Chiang Mai' },
      { name: 'Warm Up Cafe', address: 'Nimmanhaemin, Chiang Mai' },
    ],
    phuket: [
      { name: 'Bangla Boxing Stadium', address: 'Patong, Phuket' },
      { name: 'Illuzion Phuket', address: 'Bangla Road, Patong' },
    ],
  };

  const handleSelectBar = (bar: { name: string; address: string }) => {
    updateField('restaurant', bar.name);
    updateField('address', bar.address);
  };

  return (
    <div className="space-y-5">
      {/* Popular Bars Recommendation */}
      <div className="bg-gradient-to-r from-primary/10 to-mint/10 rounded-xl p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
          <Star size={16} className="text-primary" />
          {t('home.popularBars')}
        </h3>
        <p className="text-xs text-gray-light mb-3">{t('home.popularBarsDesc')}</p>
        <div className="space-y-2">
          {/* Bangkok */}
          <div>
            <p className="text-xs font-semibold text-primary mb-1">🏙️ Bangkok</p>
            <div className="flex flex-wrap gap-1">
              {popularBars.bangkok.map((bar) => (
                <button
                  key={bar.name}
                  type="button"
                  onClick={() => handleSelectBar(bar)}
                  className="px-2 py-1 text-xs bg-dark/50 hover:bg-primary/20 border border-primary/30 rounded-lg text-white transition-all hover:scale-105"
                >
                  {bar.name}
                </button>
              ))}
            </div>
          </div>
          {/* Pattaya */}
          <div>
            <p className="text-xs font-semibold text-coral mt-2 mb-1">🌴 Pattaya</p>
            <div className="flex flex-wrap gap-1">
              {popularBars.pattaya.map((bar) => (
                <button
                  key={bar.name}
                  type="button"
                  onClick={() => handleSelectBar(bar)}
                  className="px-2 py-1 text-xs bg-dark/50 hover:bg-coral/20 border border-coral/30 rounded-lg text-white transition-all hover:scale-105"
                >
                  {bar.name}
                </button>
              ))}
            </div>
          </div>
          {/* Chiang Mai */}
          <div>
            <p className="text-xs font-semibold text-mint mt-2 mb-1">🏯 Chiang Mai</p>
            <div className="flex flex-wrap gap-1">
              {popularBars.chiangmai.map((bar) => (
                <button
                  key={bar.name}
                  type="button"
                  onClick={() => handleSelectBar(bar)}
                  className="px-2 py-1 text-xs bg-dark/50 hover:bg-mint/20 border border-mint/30 rounded-lg text-white transition-all hover:scale-105"
                >
                  {bar.name}
                </button>
              ))}
            </div>
          </div>
          {/* Phuket */}
          <div>
            <p className="text-xs font-semibold text-gold mt-2 mb-1">🏝️ Phuket</p>
            <div className="flex flex-wrap gap-1">
              {popularBars.phuket.map((bar) => (
                <button
                  key={bar.name}
                  type="button"
                  onClick={() => handleSelectBar(bar)}
                  className="px-2 py-1 text-xs bg-dark/50 hover:bg-gold/20 border border-gold/30 rounded-lg text-white transition-all hover:scale-105"
                >
                  {bar.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <Wine size={16} className="text-primary" />
          {t('meal.title')}
        </label>
        <input
          type="text"
          className="input"
          placeholder={locale === 'zh-CN' ? '例如：週五夜狂歡！' : locale === 'th' ? 'เช่น คืนศุกร์สนุก!' : 'e.g. Friday Night Fun!'}
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
        />
      </div>

      {/* Bar Name */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <Wine size={16} className="text-primary" />
          {t('meal.restaurant')}
        </label>
        <input
          type="text"
          className="input"
          placeholder={locale === 'zh-CN' ? '搜尋酒吧名稱...' : locale === 'th' ? 'ค้นหาชื่อบาร์...' : 'Search bar name...'}
          value={form.restaurant}
          onChange={(e) => updateField('restaurant', e.target.value)}
        />
      </div>

      {/* Location Picker - Address Search + Map (with auto bar name fill) */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <MapPin size={16} className="text-mint" />
          {t('meal.restaurantAddress')}
        </label>
        <LocationPicker
          address={form.address}
          onLocationSelect={(data) => {
            updateField('latitude', data.lat);
            updateField('longitude', data.lng);
            // Auto-fill bar name from place selection
            if (data.placeName && !form.restaurant) {
              updateField('restaurant', data.placeName);
            }
          }}
          onAddressChange={(addr) => updateField('address', addr)}
          initialLat={form.latitude}
          initialLng={form.longitude}
          locale={locale}
          searchPlaceholder={locale === 'zh-CN' ? '搜尋酒吧名或地址...' : locale === 'th' ? 'ค้นหาชื่อบาร์หรือที่อยู่...' : 'Search bar name or address...'}
          restaurantName={form.restaurant}
          onRestaurantNameChange={(name) => updateField('restaurant', name)}
        />
        <p className="text-xs text-gray-light mt-1">
          {locale === 'zh-CN' ? '💡 選擇地點後會自動帶入酒吧名稱' :
           locale === 'th' ? '💡 เลือกสถานที่จะกรอกชื่อบาร์อัตโนมัติ' :
           '💡 Bar name auto-fills when you select a place'}
        </p>
      </div>

      {/* Bar Type - Horizontal scroll */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <Sparkles size={16} className="text-primary" />
          {t('meal.cuisineType')}
        </label>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {CUISINE_TYPES.map((cuisine) => (
            <button
              key={cuisine.key}
              type="button"
              onClick={() => updateField('cuisine', cuisine.key)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                form.cuisine === cuisine.key
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-gray-lighter bg-white hover:border-primary/40'
              }`}
            >
              <span className="text-xl">{cuisine.emoji}</span>
              <span className="text-xs font-medium text-dark whitespace-nowrap">
                {t(`cuisine.${cuisine.key}`)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Detailed Settings (stable component) ───
function Step2({ form, updateField, toggleArrayItem, t }: {
  form: MealForm;
  updateField: <K extends keyof MealForm>(key: K, value: MealForm[K]) => void;
  toggleArrayItem: (key: 'languages' | 'tags', item: string) => void;
  t: (key: string) => string;
}) {
  const locale = useLocale();

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-5">
      {/* Date & Time */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <Calendar size={16} className="text-primary" />
          {t('meal.dateTime')}
        </label>
        <input
          type="datetime-local"
          className="input"
          min={getMinDateTime()}
          value={form.dateTime}
          onChange={(e) => updateField('dateTime', e.target.value)}
        />
      </div>

      {/* Deadline (optional) */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <Clock size={16} className="text-coral" />
          {t('meal.deadline')}
          <span className="text-xs font-normal text-gray-light">
            ({locale === 'zh-CN' ? '選填' : locale === 'th' ? 'ไม่จำเป็น' : 'optional'})
          </span>
        </label>
        <input
          type="datetime-local"
          className="input"
          min={getMinDateTime()}
          max={form.dateTime || undefined}
          value={form.deadline}
          onChange={(e) => updateField('deadline', e.target.value)}
        />
        <p className="text-xs text-gray-light mt-1">{t('meal.deadlineDefault')}</p>
      </div>

      {/* Min / Max Participants */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
            <Users size={16} className="text-mint" />
            {t('meal.minParticipants')}
          </label>
          <input
            type="number"
            className="input text-center"
            min={2}
            max={form.maxParticipants}
            value={form.minParticipants}
            onChange={(e) => {
              const val = Math.max(2, parseInt(e.target.value) || 2);
              updateField('minParticipants', Math.min(val, form.maxParticipants));
            }}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
            <Users size={16} className="text-primary" />
            {t('meal.maxParticipants')}
          </label>
          <input
            type="number"
            className="input text-center"
            min={form.minParticipants}
            max={12}
            value={form.maxParticipants}
            onChange={(e) => {
              const val = Math.min(12, parseInt(e.target.value) || 2);
              updateField('maxParticipants', Math.max(val, form.minParticipants));
            }}
          />
        </div>
      </div>

      {/* Payment Method - Card style */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <CreditCard size={16} className="text-primary" />
          {t('meal.paymentMethod')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.key}
              type="button"
              onClick={() => updateField('payment', pm.key as PaymentKey)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                form.payment === pm.key
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-gray-lighter bg-white hover:border-primary/40'
              }`}
            >
              <span className="text-2xl">{pm.emoji}</span>
              <span className="text-xs font-semibold text-dark text-center leading-tight">
                {t(`payment.${pm.key}`)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <span className="text-lg">฿</span>
          {t('meal.budget')}
        </label>
        <input
          type="text"
          className="input"
          placeholder="e.g. 300-500"
          value={form.budget}
          onChange={(e) => updateField('budget', e.target.value)}
        />
      </div>

      {/* Language Selection - Multi-select tags */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <Globe size={16} className="text-primary" />
          {t('meal.mealLanguage')}
        </label>
        <p className="text-xs text-gray-light mb-2">{t('meal.mealLanguageDesc')}</p>
        <div className="flex flex-wrap gap-2">
          {MEAL_LANGUAGES.map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => toggleArrayItem('languages', lang.key)}
              className={`tag cursor-pointer ${form.languages.includes(lang.key) ? 'tag-active' : ''}`}
            >
              <span>{lang.flag}</span>
              <span>{t(`language.${lang.key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <Sparkles size={16} className="text-gold" />
          {t('meal.tags')}
        </label>
        <div className="flex flex-wrap gap-2">
          {MEAL_TAGS.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={() => toggleArrayItem('tags', tag.key)}
              className={`tag cursor-pointer ${form.tags.includes(tag.key) ? 'tag-active' : ''}`}
            >
              <span>{tag.emoji}</span>
              <span>{t(`tag.${tag.key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note / Description */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
          <MessageCircle size={16} className="text-primary" />
          {t('meal.note')}
        </label>
        <textarea
          className="textarea"
          rows={3}
          placeholder={t('meal.notePlaceholder')}
          value={form.note}
          onChange={(e) => updateField('note', e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Step 3: Confirm & Submit (stable component) ────
function Step3({ form, onSubmit, isSubmitting, submitError, t }: {
  form: MealForm;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  t: (key: string) => string;
}) {
  const selectedCuisine = CUISINE_TYPES.find((c) => c.key === form.cuisine);
  const selectedPayment = PAYMENT_METHODS.find((p) => p.key === form.payment);

  const SummaryRow = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-lighter/50 last:border-0">
      <div className="mt-0.5 text-gray-light">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-light">{label}</p>
        <p className="text-sm font-medium text-dark break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="text-base font-bold text-dark mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          {t('meal.create')}
        </h3>

        <SummaryRow
          icon={<Wine size={16} />}
          label={t('meal.title')}
          value={form.title}
        />
        <SummaryRow
          icon={<MapPin size={16} />}
          label={t('meal.restaurant')}
          value={`${form.restaurant}${form.address ? ` · ${form.address}` : ''}`}
        />
        {selectedCuisine && (
          <SummaryRow
            icon={<span>{selectedCuisine.emoji}</span>}
            label={t('meal.cuisineType')}
            value={`${selectedCuisine.emoji} ${t(`cuisine.${selectedCuisine.key}`)}`}
          />
        )}
        <SummaryRow
          icon={<Calendar size={16} />}
          label={t('meal.dateTime')}
          value={form.dateTime ? new Date(form.dateTime).toLocaleString() : '—'}
        />
        {form.deadline && (
          <SummaryRow
            icon={<Clock size={16} />}
            label={t('meal.deadline')}
            value={new Date(form.deadline).toLocaleString()}
          />
        )}
        <SummaryRow
          icon={<Users size={16} />}
          label={`${t('meal.minParticipants')} / ${t('meal.maxParticipants')}`}
          value={`${form.minParticipants} – ${form.maxParticipants} ${t('common.next') === 'Next' ? 'people' : '人'}`}
        />
        {selectedPayment && (
          <SummaryRow
            icon={<span>{selectedPayment.emoji}</span>}
            label={t('meal.paymentMethod')}
            value={`${selectedPayment.emoji} ${t(`payment.${selectedPayment.key}`)}`}
          />
        )}
        {form.budget && (
          <SummaryRow
            icon={<span className="text-sm font-bold">฿</span>}
            label={t('meal.budget')}
            value={`฿${form.budget}`}
          />
        )}
        <SummaryRow
          icon={<Globe size={16} />}
          label={t('meal.mealLanguage')}
          value={form.languages
            .map((l) => {
              const lang = MEAL_LANGUAGES.find((ml) => ml.key === l);
              return lang ? `${lang.flag} ${t(`language.${l}`)}` : l;
            })
            .join(', ')}
        />
        {form.tags.length > 0 && (
          <SummaryRow
            icon={<Sparkles size={16} />}
            label={t('meal.tags')}
            value={form.tags
              .map((tag) => {
                const found = MEAL_TAGS.find((mt) => mt.key === tag);
                return found ? `${found.emoji} ${t(`tag.${tag}`)}` : tag;
              })
              .join(' · ')}
          />
        )}
        {form.note && (
          <SummaryRow
            icon={<MessageCircle size={16} />}
            label={t('meal.note')}
            value={form.note}
          />
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
      >
        {isSubmitting ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Check size={20} />
        )}
        {isSubmitting ? (t('common.submitting') || 'Creating...') : t('common.submit')}
      </button>
      {submitError && (
        <p className="text-sm text-coral text-center mt-2">{submitError}</p>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────
export default function CreateMealPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<MealForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/meals/create`)}`);
    }
  }, [user, isLoading, router, locale]);

  const updateField = useCallback(<K extends keyof MealForm>(key: K, value: MealForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayItem = useCallback((key: 'languages' | 'tags', item: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter((v) => v !== item)
        : [...prev[key], item],
    }));
  }, []);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    // Parse budget range
    let budgetMin: number | null = null;
    let budgetMax: number | null = null;
    if (form.budget) {
      const parts = form.budget.split(/[-–~]/).map(s => parseInt(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        budgetMin = parts[0];
        budgetMax = parts[1];
      } else if (parts.length === 1 && !isNaN(parts[0])) {
        budgetMin = parts[0];
        budgetMax = parts[0];
      }
    }

    // Validate required fields
    if (!form.title.trim()) {
      setSubmitError('Please enter a title');
      return;
    }
    if (!form.restaurant.trim()) {
      setSubmitError('Please enter restaurant name');
      return;
    }
    if (!form.cuisine) {
      setSubmitError('Please select cuisine type');
      return;
    }
    if (!form.dateTime) {
      setSubmitError('Please select date and time');
      return;
    }
    if (!form.languages.length) {
      setSubmitError('Please select at least one language');
      return;
    }

    // Validate date formats — deadline defaults to datetime if not set
    const dateObj = new Date(form.dateTime);
    if (isNaN(dateObj.getTime())) {
      setSubmitError('Please select date and time');
      return;
    }
    const deadlineObj = form.deadline ? new Date(form.deadline) : dateObj;
    if (form.deadline && isNaN(deadlineObj.getTime())) {
      setSubmitError('Invalid deadline selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createMeal({
        title: form.title,
        restaurant_name: form.restaurant,
        restaurant_address: form.address,
        cuisine_type: form.cuisine,
        meal_languages: form.languages,
        datetime: dateObj.toISOString(),
        deadline: deadlineObj.toISOString(),
        min_participants: form.minParticipants,
        max_participants: form.maxParticipants,
        payment_method: form.payment,
        budget_min: budgetMin,
        budget_max: budgetMax,
        description: form.note,
        note: form.note,
        tags: form.tags,
        latitude: form.latitude,
        longitude: form.longitude,
      });

      if (result.success) {
        router.push(`/${locale}/meals/${result.mealId}`);
      } else {
        setSubmitError(result.error || 'Failed to create meal');
      }
    } catch (err) {
      console.error('[CreateMeal] Exception:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Progress Bar ────────────────────────────────────
  const ProgressBar = () => (
    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-primary' : 'bg-gray-lighter'
              }`}
            />
          </div>
          <p
            className={`text-xs mt-1 text-center transition-colors duration-300 ${
              s <= step ? 'text-primary font-medium' : 'text-gray-light'
            }`}
          >
            {s === 1 && t('meal.title')}
            {s === 2 && t('meal.dateTime')}
            {s === 3 && t('common.submit')}
          </p>
        </div>
      ))}
    </div>
  );

  // ─── Page Render ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={goBack}
            className="btn-ghost p-2 -ml-2"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-dark">{t('meal.create')}</h1>
        </div>
        <ProgressBar />
      </div>

      {/* Step Content */}
      <div className="px-4 pt-4">
        {step === 1 && (
          <Step1 form={form} updateField={updateField} t={t} />
        )}
        {step === 2 && (
          <Step2 form={form} updateField={updateField} toggleArrayItem={toggleArrayItem} t={t} />
        )}
        {step === 3 && (
          <Step3 form={form} onSubmit={handleSubmit} isSubmitting={isSubmitting} submitError={submitError} t={t} />
        )}
      </div>

      {/* Bottom Actions (Step 1 & 2) */}
      {step < 3 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom bg-dark border-t border-gray-lighter/50 px-4 py-3 flex gap-3">
          {step > 1 && (
            <button type="button" onClick={goBack} className="btn-secondary flex-1">
              {t('common.back')}
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}
