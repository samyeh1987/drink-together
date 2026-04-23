'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Save,
  Camera,
  User,
  MapPin,
  MessageCircle,
  Heart,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { updateProfile } from '@/lib/api';

function useBodyScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [lock]);
}

const AGE_OPTIONS = ['18-24', '25-30', '31-35', '36-40', '40+'];
const OCCUPATION_OPTIONS = [
  'Technology', 'Design', 'Marketing', 'Finance', 'Education',
  'Healthcare', 'Food & Beverage', 'Consulting', 'Freelance',
  'Student', 'Entrepreneur', 'Digital Nomad', 'Other',
];
const LANGUAGE_OPTIONS = ['en', 'zh', 'th', 'ja', 'ko'];
const ZODIAC_OPTIONS = [
  { key: 'aries', label: '♈ Aries 牡羊' },
  { key: 'taurus', label: '♉ Taurus 金牛' },
  { key: 'gemini', label: '♊ Gemini 雙子' },
  { key: 'cancer', label: '♋ Cancer 巨蟹' },
  { key: 'leo', label: '♌ Leo 獅子' },
  { key: 'virgo', label: '♍ Virgo 處女' },
  { key: 'libra', label: '♎ Libra 天秤' },
  { key: 'scorpio', label: '♏ Scorpio 天蠍' },
  { key: 'sagittarius', label: '♐ Sagittarius 射手' },
  { key: 'capricorn', label: '♑ Capricorn 摩羯' },
  { key: 'aquarius', label: '♒ Aquarius 水瓶' },
  { key: 'pisces', label: '♓ Pisces 雙魚' },
];

const CITY_OPTIONS = ['Bangkok', 'Pattaya', 'Chiang Mai', 'Phuket', 'Other'];

const languageFlags: Record<string, string> = {
  zh: '🇨🇳', en: '🇬🇧', th: '🇹🇭', ja: '🇯🇵', ko: '🇰🇷',
};

// Tab types
type TabKey = 'basic' | 'body' | 'contact';

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileForm({ isOpen, onClose }: ProfileFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { user, fetchUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [isSaving, setIsSaving] = useState(false);

  // Lock body scroll when modal opens
  useBodyScrollLock(isOpen);

  // Basic
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [occupation, setOccupation] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [zodiac, setZodiac] = useState('');

  // Body
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [birthday, setBirthday] = useState('');

  // Contact
  const [lineId, setLineId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [contactVisible, setContactVisible] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setNickname(user.nickname || '');
      setBio(user.bio || '');
      setAgeRange(user.age_range || '');
      setOccupation((user as any).occupation || '');
      setLanguages(user.languages_spoken || []);
      setCity((user as any).city || '');
      setZodiac((user as any).zodiac || '');
      setHeight((user as any).height ? String((user as any).height) : '');
      setWeight((user as any).weight ? String((user as any).weight) : '');
      setBirthday((user as any).birthday || '');
      setLineId((user as any).line_id || '');
      setWhatsapp((user as any).whatsapp || '');
      setContactVisible((user as any).contact_visible || false);
    }
  }, [isOpen, user]);

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang],
    );
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);

    try {
      const { error } = await updateProfile({
        id: user.id,
        nickname,
        bio,
        age_range: ageRange || null,
        occupation: occupation || null,
        languages_spoken: languages,
        city: city || null,
        zodiac: zodiac || null,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
        birthday: birthday || null,
        line_id: lineId || null,
        whatsapp: whatsapp || null,
        contact_visible: contactVisible,
      } as any);

      if (error) {
        alert(error);
      } else {
        await fetchUser();
        onClose();
      }
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'basic', label: locale === 'zh-CN' ? '基本資料' : 'Basic', icon: <User className="w-4 h-4" /> },
    { key: 'body', label: locale === 'zh-CN' ? '身體資訊' : 'Body', icon: <Heart className="w-4 h-4" /> },
    { key: 'contact', label: locale === 'zh-CN' ? '聯繫方式' : 'Contact', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal - Full screen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-dark flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
              <h2 className="font-bold text-white">{t('profile.editProfile')}</h2>
              <button
                onClick={handleSave}
                disabled={isSaving || !nickname.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('common.save')}
              </button>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-white/10 flex-shrink-0">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-coral flex items-center justify-center overflow-hidden">
                  {user?.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {(user?.nickname || '?').charAt(0)}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-dark">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-gray">
                  {user?.email_verified
                    ? (locale === 'zh-CN' ? '✓ 已驗證' : '✓ Verified')
                    : (locale === 'zh-CN' ? '未驗證' : 'Not verified')}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 flex-shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="px-5 py-4 space-y-5">

                {/* ===== BASIC TAB ===== */}
                {activeTab === 'basic' && (
                  <>
                    {/* Nickname */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-1.5 block">
                        {t('profile.nickname')} *
                      </label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        maxLength={30}
                        placeholder={locale === 'zh-CN' ? '輸入你的暱稱' : 'Enter your nickname'}
                        className="input w-full py-2.5 text-sm bg-white/5 border-white/20 text-white placeholder:text-gray"
                      />
                      <p className="text-[10px] text-gray mt-1">{nickname.length}/30</p>
                    </div>

                    {/* Age Range */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-2 block">
                        {t('profile.ageRange')}
                      </label>
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {AGE_OPTIONS.map((age) => (
                          <button
                            key={age}
                            onClick={() => setAgeRange(ageRange === age ? '' : age)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm transition-all ${
                              ageRange === age
                                ? 'bg-primary/20 text-primary font-medium border border-primary/40'
                                : 'glass border-white/20 text-gray hover:border-white/40'
                            }`}
                          >
                            {age}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Occupation */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-2 block">
                        {t('profile.occupation')}
                      </label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        list="occupations"
                        placeholder={locale === 'zh-CN' ? '例如：工程師、設計師' : 'e.g., Engineer, Designer'}
                        className="input w-full py-2.5 text-sm bg-white/5 border-white/20 text-white placeholder:text-gray"
                      />
                      <datalist id="occupations">
                        {OCCUPATION_OPTIONS.map((o) => (
                          <option key={o} value={o} />
                        ))}
                      </datalist>
                    </div>

                    {/* City */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-2 block">
                        <MapPin className="w-3.5 h-3.5 inline mr-1" />
                        {locale === 'zh-CN' ? '所在城市' : 'City'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {CITY_OPTIONS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setCity(city === c ? '' : c)}
                            className={`px-3 py-2 rounded-xl text-sm transition-all ${
                              city === c
                                ? 'bg-primary/20 text-primary font-medium border border-primary/40'
                                : 'glass border-white/20 text-gray hover:border-white/40'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Zodiac */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-2 block">
                        {locale === 'zh-CN' ? '星座' : 'Zodiac'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {ZODIAC_OPTIONS.map((z) => (
                          <button
                            key={z.key}
                            onClick={() => setZodiac(zodiac === z.key ? '' : z.key)}
                            className={`px-2 py-2 rounded-xl text-xs transition-all text-center ${
                              zodiac === z.key
                                ? 'bg-primary/20 text-primary font-medium border border-primary/40'
                                : 'glass border-white/20 text-gray hover:border-white/40'
                            }`}
                          >
                            {z.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-1.5 block">
                        {t('profile.bio')}
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={200}
                        rows={3}
                        placeholder={locale === 'zh-CN' ? '介紹一下自己吧...' : 'Tell others about yourself...'}
                        className="input w-full py-2.5 text-sm resize-none bg-white/5 border-white/20 text-white placeholder:text-gray"
                      />
                      <p className="text-[10px] text-gray mt-1">{bio.length}/200</p>
                    </div>

                    {/* Languages */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-2 block">
                        {t('profile.languagesSpoken')}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => toggleLanguage(lang)}
                            className={`px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-all ${
                              languages.includes(lang)
                                ? 'bg-primary/20 text-primary font-medium border border-primary/40'
                                : 'glass border-white/20 text-gray hover:border-white/40'
                            }`}
                          >
                            {languageFlags[lang]} {t(`language.${lang}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ===== BODY TAB ===== */}
                {activeTab === 'body' && (
                  <>
                    <p className="text-xs text-gray">
                      {locale === 'zh-CN'
                        ? '這些資料只會顯示在你的個人資料頁，讓酒友更認識你'
                        : 'These details appear on your profile to help friends know you better'}
                    </p>

                    {/* Height & Weight */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray mb-1.5 block">
                          {locale === 'zh-CN' ? '身高 (cm)' : 'Height (cm)'}
                        </label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          min={100}
                          max={250}
                          placeholder="170"
                          className="input w-full py-2.5 text-sm bg-white/5 border-white/20 text-white placeholder:text-gray"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray mb-1.5 block">
                          {locale === 'zh-CN' ? '體重 (kg)' : 'Weight (kg)'}
                        </label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          min={30}
                          max={200}
                          placeholder="65"
                          className="input w-full py-2.5 text-sm bg-white/5 border-white/20 text-white placeholder:text-gray"
                        />
                      </div>
                    </div>

                    {/* Birthday */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-1.5 block">
                        {locale === 'zh-CN' ? '生日' : 'Birthday'}
                      </label>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="input w-full py-2.5 text-sm bg-white/5 border-white/20 text-white"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>

                    {/* Preview card */}
                    {(height || weight || birthday) && (
                      <div className="glass rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-gray mb-2">
                          {locale === 'zh-CN' ? '預覽顯示效果' : 'Preview'}
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          {height && (
                            <span className="tag bg-primary/20 text-primary text-xs">
                              📏 {height} cm
                            </span>
                          )}
                          {weight && (
                            <span className="tag bg-cyan/20 text-cyan-300 text-xs">
                              ⚖️ {weight} kg
                            </span>
                          )}
                          {birthday && (
                            <span className="tag bg-gold/20 text-gold text-xs">
                              🎂 {new Date(birthday).toLocaleDateString(locale === 'zh-CN' ? 'zh-TW' : 'en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ===== CONTACT TAB ===== */}
                {activeTab === 'contact' && (
                  <>
                    {/* Privacy notice */}
                    <div className="glass rounded-xl p-4 border border-white/10">
                      <p className="text-xs text-white font-medium mb-1">
                        🔒 {locale === 'zh-CN' ? '隱私保護' : 'Privacy Protection'}
                      </p>
                      <p className="text-xs text-gray leading-relaxed">
                        {locale === 'zh-CN'
                          ? '聯繫方式僅在酒局確認後，對同場酒局的成員可見。陌生人無法查看。'
                          : 'Contact info is only visible to confirmed participants of the same drink session. Strangers cannot see it.'}
                      </p>
                    </div>

                    {/* LINE ID */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-1.5 block">
                        LINE ID
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 text-sm font-bold">L</span>
                        <input
                          type="text"
                          value={lineId}
                          onChange={(e) => setLineId(e.target.value)}
                          placeholder="your_line_id"
                          className="input w-full py-2.5 text-sm pl-8 bg-white/5 border-white/20 text-white placeholder:text-gray"
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="text-xs font-semibold text-gray mb-1.5 block">
                        WhatsApp
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">📱</span>
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+66 812345678"
                          className="input w-full py-2.5 text-sm pl-8 bg-white/5 border-white/20 text-white placeholder:text-gray"
                        />
                      </div>
                    </div>

                    {/* Visibility toggle */}
                    <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/10">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {locale === 'zh-CN' ? '顯示聯繫方式' : 'Show contact info'}
                        </p>
                        <p className="text-xs text-gray mt-0.5">
                          {locale === 'zh-CN' ? '僅對確認參與的酒友可見' : 'Only visible to confirmed drink buddies'}
                        </p>
                      </div>
                      <button
                        onClick={() => setContactVisible(!contactVisible)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          contactVisible ? 'bg-primary' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            contactVisible ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}

              </div>
              {/* Bottom safe area */}
              <div className="h-6 safe-bottom" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
