'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Save,
  Camera,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { updateProfile } from '@/lib/api';

const AGE_OPTIONS = ['18-24', '25-34', '35-44', '45-54', '55+'];
const GENDER_OPTIONS = [
  { key: 'male', emoji: '👨' },
  { key: 'female', emoji: '👩' },
  { key: 'prefer_not_to_say', emoji: '✨' },
];
const OCCUPATION_OPTIONS = [
  'Technology', 'Design', 'Marketing', 'Finance', 'Education',
  'Healthcare', 'Food & Beverage', 'Consulting', 'Freelance',
  'Student', 'Entrepreneur', 'Digital Nomad', 'Other',
];
const LANGUAGE_OPTIONS = ['en', 'zh', 'th', 'ja', 'ko'];

const languageFlags: Record<string, string> = {
  zh: '🇨🇳', en: '🇬🇧', th: '🇹🇭', ja: '🇯🇵', ko: '🇰🇷',
};

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileForm({ isOpen, onClose }: ProfileFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { user, fetchUser } = useAuthStore();

  const [isSaving, setIsSaving] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [occupation, setOccupation] = useState('');
  const [gender, setGender] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      setNickname(user.nickname || '');
      setBio(user.bio || '');
      setAgeRange(user.age_range || '');
      setOccupation((user as any).occupation || '');
      setGender((user as any).gender || '');
      setLanguages(user.languages_spoken || []);
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
        gender: gender || null,
        languages_spoken: languages,
      });

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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-lighter rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-lighter/50">
              <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-xl hover:bg-light transition-colors">
                <X className="w-5 h-5 text-dark" />
              </button>
              <h2 className="font-bold text-dark">{t('profile.editProfile')}</h2>
              <button
                onClick={handleSave}
                disabled={isSaving || !nickname.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('common.save')}
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-coral flex items-center justify-center overflow-hidden">
                    {user?.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {(user?.nickname || '?').charAt(0)}
                      </span>
                    )}
                  </div>
                  {/* Avatar upload button (placeholder - Phase 2) */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">{user?.email}</p>
                  <p className="text-xs text-gray-light">
                    {user?.email_verified
                      ? (locale === 'zh-CN' ? '已驗證' : 'Verified')
                      : (locale === 'zh-CN' ? '未驗證' : 'Not verified')}
                  </p>
                </div>
              </div>

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
                  className="input w-full py-2.5 text-sm"
                />
                <p className="text-[10px] text-gray-light mt-1">{nickname.length}/30</p>
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-semibold text-gray mb-2 block">
                  {t('profile.gender')}
                </label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.key}
                      onClick={() => setGender(gender === g.key ? '' : g.key)}
                      className={`flex-1 py-2.5 rounded-xl text-sm text-center transition-all ${
                        gender === g.key
                          ? 'bg-primary/10 text-primary font-medium border border-primary/30'
                          : 'bg-light text-gray hover:bg-gray-lighter'
                      }`}
                    >
                      {g.emoji} {t(`profile.${g.key === 'prefer_not_to_say' ? 'preferNotToSay' : g.key}`)}
                    </button>
                  ))}
                </div>
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
                          ? 'bg-primary/10 text-primary font-medium border border-primary/30'
                          : 'bg-light text-gray hover:bg-gray-lighter'
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
                  className="input w-full py-2.5 text-sm"
                />
                <datalist id="occupations">
                  {OCCUPATION_OPTIONS.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
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
                  className="input w-full py-2.5 text-sm resize-none"
                />
                <p className="text-[10px] text-gray-light mt-1">{bio.length}/200</p>
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
                          ? 'bg-primary/10 text-primary font-medium border border-primary/30'
                          : 'bg-light text-gray hover:bg-gray-lighter'
                      }`}
                    >
                      {languageFlags[lang]} {t(`language.${lang}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom safe area */}
            <div className="h-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
