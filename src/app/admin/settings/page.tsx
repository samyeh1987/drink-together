'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Bell, Globe, CreditCard, FileText,
  Save, RotateCcw,
  ChevronRight, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminT } from '../AdminI18nProvider';

type TabKey = 'general' | 'credit' | 'notifications' | 'content' | 'locale';

interface SettingItem {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'textarea';
  value: string | number | boolean;
  options?: { label: string; value: string }[];
}

const SETTINGS: Record<TabKey, { icon: typeof Settings; label: string; description: string; items: SettingItem[] }> = {
  general: {
    icon: Settings,
    label: '基本設定',
    description: '平台基本設定',
    items: [
      { key: 'app_name', label: '應用名稱', description: '平台上顯示的名稱', type: 'text', value: 'DrinkTogether' },
      { key: 'app_tagline', label: '標語', description: '平台的簡短描述', type: 'text', value: '不要一個人喝酒' },
      { key: 'default_currency', label: '預設貨幣', description: '平台計價貨幣', type: 'select', value: 'THB', options: [{ label: '🇹🇭 THB - 泰銖', value: 'THB' }, { label: '🇺🇸 USD - 美元', value: 'USD' }, { label: '🇨🇳 CNY - 人民幣', value: 'CNY' }] },
      { key: 'timezone', label: '時區', description: '平台預設時區', type: 'select', value: 'Asia/Bangkok', options: [{ label: 'UTC+7 曼谷', value: 'Asia/Bangkok' }, { label: 'UTC+8 台北', value: 'Asia/Taipei' }, { label: 'UTC+9 東京', value: 'Asia/Tokyo' }] },
      { key: 'maintenance_mode', label: '維護模式', description: '暫時關閉平台進行維護', type: 'toggle', value: false },
    ],
  },
  credit: {
    icon: CreditCard,
    label: '信用分系統',
    description: '信用分參數與規則',
    items: [
      { key: 'initial_credit', label: '初始信用分', description: '新用戶的預設信用分', type: 'number', value: 100 },
      { key: 'no_show_penalty', label: '放鴿子扣分', description: '每次放鴿子扣除的積分', type: 'number', value: -20 },
      { key: 'host_bonus', label: '主辦完成獎勵', description: '飯局完成後主辦人獲得的積分', type: 'number', value: 10 },
      { key: 'participant_bonus', label: '參與獎勵', description: '參與飯局後獲得的積分', type: 'number', value: 5 },
      { key: 'review_bonus', label: '評價獎勵', description: '提交飯局評價後獲得的積分', type: 'number', value: 3 },
      { key: 'excellent_threshold', label: '優秀門檻', description: '達到「優秀」等級的最低分數', type: 'number', value: 150 },
      { key: 'ban_threshold', label: '自動停權門檻', description: '低於此分數將自動停權', type: 'number', value: 30 },
      { key: 'daily_signup_limit', label: '每日註冊上限', description: '每日最大新註冊數，防止垃圾註冊', type: 'number', value: 100 },
    ],
  },
  notifications: {
    icon: Bell,
    label: '通知設定',
    description: '郵件與推播通知設定',
    items: [
      { key: 'email_new_user', label: '歡迎郵件', description: '向新用戶發送歡迎郵件', type: 'toggle', value: true },
      { key: 'email_meal_reminder', label: '飯局提醒', description: '在飯局開始前發送提醒', type: 'toggle', value: true },
      { key: 'reminder_hours', label: '提醒時數', description: '飯局開始前多少小時發送提醒', type: 'number', value: 6 },
      { key: 'email_no_show_warning', label: '放鴿子警告', description: '當被舉報放鴿子時通知用戶', type: 'toggle', value: true },
      { key: 'email_credit_change', label: '信用分變動通知', description: '通知用戶信用分調整', type: 'toggle', value: true },
      { key: 'push_enabled', label: '推播通知', description: '啟用瀏覽器推播通知', type: 'toggle', value: true },
      { key: 'admin_report_alert', label: '檢舉提醒', description: '收到新檢舉時立即通知', type: 'toggle', value: true },
    ],
  },
  content: {
    icon: FileText,
    label: '內容審核',
    description: '內容審核與管理規則',
    items: [
      { key: 'photo_review_required', label: '照片需審核', description: '照片需管理員審核後才顯示在相冊', type: 'toggle', value: true },
      { key: 'meal_review_required', label: '飯局需審核', description: '新飯局需管理員審核', type: 'toggle', value: false },
      { key: 'profanity_filter', label: '髒話過濾器', description: '自動過濾個人資料和描述中的不當語言', type: 'toggle', value: true },
      { key: 'max_meals_per_day', label: '每日飯局上限', description: '限制用戶每天可建立的飯局數量', type: 'number', value: 3 },
      { key: 'max_report_threshold', label: '自動取消門檻', description: '收到此數量的檢舉後自動取消飯局', type: 'number', value: 3 },
      { key: 'profile_completion_required', label: '需完成個人資料', description: '用戶需完成個人資料才能建立飯局', type: 'toggle', value: false },
    ],
  },
  locale: {
    icon: Globe,
    label: '在地化',
    description: '語言與地區設定',
    items: [
      { key: 'default_locale', label: '預設語言', description: '當用戶語言不可用時的備用語言', type: 'select', value: 'zh-CN', options: [{ label: '🇬🇧 English', value: 'en' }, { label: '🇨🇳 简体中文', value: 'zh-CN' }, { label: '🇹🇭 ภาษาไทย', value: 'th' }] },
      { key: 'supported_locales', label: '支援語言', description: '平台上可用的語言', type: 'text', value: 'en, zh-CN, th' },
      { key: 'google_auth_enabled', label: 'Google 登入', description: '啟用 Google 登入', type: 'toggle', value: true },
      { key: 'email_auth_enabled', label: '信箱登入', description: '啟用信箱/密碼登入', type: 'toggle', value: true },
      { key: 'otp_enabled', label: '手機驗證', description: '啟用泰國手機號碼 OTP 驗證', type: 'toggle', value: false },
      { key: 'min_nickname_length', label: '暱稱最少字數', description: '用戶暱稱的最少字元數', type: 'number', value: 2 },
    ],
  },
};

export default function AdminSettingsPage() {
  const t = useAdminT();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => {
    const initial: Record<string, string | number | boolean> = {};
    Object.values(SETTINGS).forEach(tab => {
      tab.items.forEach(item => {
        initial[item.key] = item.value;
      });
    });
    return initial;
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings from Supabase on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('platform_settings')
          .select('key, value');

        if (!error && data && data.length > 0) {
          const dbValues: Record<string, string | number | boolean> = {};
          for (const row of data) {
            dbValues[row.key] = row.value;
          }
          setValues(prev => ({ ...prev, ...dbValues }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const updateValue = (key: string, value: string | number | boolean) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Upsert all settings
      const rows = Object.entries(values).map(([key, value]) => ({
        key,
        value,
      }));

      // Use upsert with onConflict on 'key'
      const { error } = await supabase
        .from('platform_settings')
        .upsert(rows, { onConflict: 'key' });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const initial: Record<string, string | number | boolean> = {};
    Object.values(SETTINGS).forEach(tab => {
      tab.items.forEach(item => {
        initial[item.key] = item.value;
      });
    });
    setValues(initial);
    setSaved(false);
    // Also reset DB
    setSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const rows = Object.entries(initial).map(([key, value]) => ({ key, value }));
      await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' });
    } catch (err) {
      console.error('Failed to reset settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentTab = SETTINGS[activeTab];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
          <p className="text-sm text-gray-light mt-1">{t('settings.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> {t('settings.reset')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50',
              saved
                ? 'bg-mint text-white'
                : 'bg-primary text-white hover:bg-primary/80'
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? t('settings.saved') : t('settings.saveChanges')}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="card glass p-2 space-y-1 lg:sticky lg:top-24">
            {(Object.keys(SETTINGS) as TabKey[]).map(key => {
              const tab = SETTINGS[key];
              const Icon = tab.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    activeTab === key
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-light hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {activeTab === key && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary/60" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="glass rounded-2xl border border-gray/30">
            <div className="px-6 py-5 border-b border-gray/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {(() => { const Icon = currentTab.icon; return <Icon className="w-5 h-5 text-primary" />; })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{currentTab.label}</h2>
                  <p className="text-sm text-gray-light">{currentTab.description}</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray/30">
              {currentTab.items.map(item => (
                <div key={item.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-light mt-0.5">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 sm:w-64">
                    {item.type === 'text' && (
                      <input
                        type="text"
                        value={values[item.key] as string}
                        onChange={e => updateValue(item.key, e.target.value)}
                        className="w-full px-3 py-2 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    )}
                    {item.type === 'number' && (
                      <input
                        type="number"
                        value={values[item.key] as number}
                        onChange={e => updateValue(item.key, parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    )}
                    {item.type === 'select' && (
                      <select
                        value={values[item.key] as string}
                        onChange={e => updateValue(item.key, e.target.value)}
                        className="w-full px-3 py-2 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {item.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                    {item.type === 'toggle' && (
                      <button
                        onClick={() => updateValue(item.key, !(values[item.key] as boolean))}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          values[item.key] ? 'bg-primary' : 'bg-gray-600'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                            values[item.key] ? 'translate-x-6' : 'translate-x-1'
                          )}
                        />
                      </button>
                    )}
                    {item.type === 'textarea' && (
                      <textarea
                        value={values[item.key] as string}
                        onChange={e => updateValue(item.key, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-dark/50 border border-gray/30 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
