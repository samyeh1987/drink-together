'use client';

import { useState } from 'react';
import {
  Settings, Bell, Shield, Globe, Users, CreditCard, FileText,
  Palette, Mail, MessageSquare, Clock, Save, RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    label: 'General',
    description: 'Basic platform settings',
    items: [
      { key: 'app_name', label: 'App Name', description: 'The name displayed across the platform', type: 'text', value: 'EatTogether' },
      { key: 'app_tagline', label: 'Tagline', description: 'Short description of the platform', type: 'text', value: "Don't Eat Alone" },
      { key: 'default_currency', label: 'Default Currency', description: 'Platform currency for pricing', type: 'select', value: 'THB', options: [{ label: '🇹🇭 THB - Thai Baht', value: 'THB' }, { label: '🇺🇸 USD - US Dollar', value: 'USD' }, { label: '🇨🇳 CNY - Chinese Yuan', value: 'CNY' }] },
      { key: 'timezone', label: 'Timezone', description: 'Platform default timezone', type: 'select', value: 'Asia/Bangkok', options: [{ label: 'UTC+7 Bangkok', value: 'Asia/Bangkok' }, { label: 'UTC+8 Taipei', value: 'Asia/Taipei' }, { label: 'UTC+9 Tokyo', value: 'Asia/Tokyo' }] },
      { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Temporarily disable the platform for maintenance', type: 'toggle', value: false },
    ],
  },
  credit: {
    icon: CreditCard,
    label: 'Credit System',
    description: 'Credit score parameters and rules',
    items: [
      { key: 'initial_credit', label: 'Initial Credit Score', description: 'Credit score for new users', type: 'number', value: 100 },
      { key: 'no_show_penalty', label: 'No-Show Penalty', description: 'Points deducted for each no-show', type: 'number', value: -20 },
      { key: 'host_bonus', label: 'Host Completion Bonus', description: 'Points awarded when a hosted meal is completed', type: 'number', value: 10 },
      { key: 'participant_bonus', label: 'Participant Bonus', description: 'Points awarded for attending a meal', type: 'number', value: 5 },
      { key: 'review_bonus', label: 'Review Submission Bonus', description: 'Points for submitting a review after a meal', type: 'number', value: 3 },
      { key: 'excellent_threshold', label: 'Excellent Level Threshold', description: 'Minimum score for "Excellent" level', type: 'number', value: 150 },
      { key: 'ban_threshold', label: 'Auto-Ban Threshold', description: 'Credit score below which user is suspended', type: 'number', value: 30 },
      { key: 'daily_signup_limit', label: 'Daily Signup Limit', description: 'Max new signups per day to prevent spam', type: 'number', value: 100 },
    ],
  },
  notifications: {
    icon: Bell,
    label: 'Notifications',
    description: 'Email and push notification settings',
    items: [
      { key: 'email_new_user', label: 'Welcome Email', description: 'Send welcome email to new users', type: 'toggle', value: true },
      { key: 'email_meal_reminder', label: 'Meal Reminder', description: 'Send reminder X hours before meal', type: 'toggle', value: true },
      { key: 'reminder_hours', label: 'Reminder Hours Before Meal', description: 'How many hours before to send reminder', type: 'number', value: 6 },
      { key: 'email_no_show_warning', label: 'No-Show Warning', description: 'Email users when reported for no-show', type: 'toggle', value: true },
      { key: 'email_credit_change', label: 'Credit Score Changes', description: 'Notify users about credit score adjustments', type: 'toggle', value: true },
      { key: 'push_enabled', label: 'Push Notifications', description: 'Enable browser push notifications', type: 'toggle', value: true },
      { key: 'admin_report_alert', label: 'Admin Report Alerts', description: 'Get notified about new reports immediately', type: 'toggle', value: true },
    ],
  },
  content: {
    icon: FileText,
    label: 'Content Moderation',
    description: 'Content review and moderation rules',
    items: [
      { key: 'photo_review_required', label: 'Photo Review Required', description: 'Require admin approval before photos appear in gallery', type: 'toggle', value: true },
      { key: 'meal_review_required', label: 'Meal Review Required', description: 'Require admin approval for new meals', type: 'toggle', value: false },
      { key: 'profanity_filter', label: 'Profanity Filter', description: 'Auto-filter inappropriate language in profiles and descriptions', type: 'toggle', value: true },
      { key: 'max_meals_per_day', label: 'Max Meals per User per Day', description: 'Limit meals a user can create per day', type: 'number', value: 3 },
      { key: 'max_report_threshold', label: 'Auto-Cancel Threshold', description: 'Auto-cancel meal after this many reports', type: 'number', value: 3 },
      { key: 'profile_completion_required', label: 'Profile Completion Required', description: 'Require users to complete profile before creating meals', type: 'toggle', value: false },
    ],
  },
  locale: {
    icon: Globe,
    label: 'Localization',
    description: 'Language and region settings',
    items: [
      { key: 'default_locale', label: 'Default Language', description: 'Fallback language when user locale is not available', type: 'select', value: 'en', options: [{ label: '🇬🇧 English', value: 'en' }, { label: '🇨🇳 简体中文', value: 'zh-CN' }, { label: '🇹🇭 ภาษาไทย', value: 'th' }] },
      { key: 'supported_locales', label: 'Supported Languages', description: 'Languages available on the platform', type: 'text', value: 'en, zh-CN, th' },
      { key: 'google_auth_enabled', label: 'Google OAuth Login', description: 'Enable Google Sign-In', type: 'toggle', value: true },
      { key: 'email_auth_enabled', label: 'Email/Password Login', description: 'Enable email/password authentication', type: 'toggle', value: true },
      { key: 'otp_enabled', label: 'Phone OTP Verification', description: 'Enable phone number OTP for Thai numbers', type: 'toggle', value: false },
      { key: 'min_nickname_length', label: 'Min Nickname Length', description: 'Minimum characters for user nickname', type: 'number', value: 2 },
    ],
  },
};

export default function AdminSettingsPage() {
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

  const updateValue = (key: string, value: string | number | boolean) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const initial: Record<string, string | number | boolean> = {};
    Object.values(SETTINGS).forEach(tab => {
      tab.items.forEach(item => {
        initial[item.key] = item.value;
      });
    });
    setValues(initial);
    setSaved(false);
  };

  const currentTab = SETTINGS[activeTab];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure platform parameters and preferences.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleSave}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
              saved
                ? 'bg-[#2EC4B6] text-white'
                : 'bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90'
            )}
          >
            <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-1 lg:sticky lg:top-24">
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
                      ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {activeTab === key && <ChevronRight className="w-3.5 h-3.5 ml-auto text-[#FF6B35]/60" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center">
                  {(() => { const Icon = currentTab.icon; return <Icon className="w-5 h-5 text-[#FF6B35]" />; })()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{currentTab.label}</h2>
                  <p className="text-sm text-gray-500">{currentTab.description}</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {currentTab.items.map(item => (
                <div key={item.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 sm:w-64">
                    {item.type === 'text' && (
                      <input
                        type="text"
                        value={values[item.key] as string}
                        onChange={e => updateValue(item.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                      />
                    )}
                    {item.type === 'number' && (
                      <input
                        type="number"
                        value={values[item.key] as number}
                        onChange={e => updateValue(item.key, parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                      />
                    )}
                    {item.type === 'select' && (
                      <select
                        value={values[item.key] as string}
                        onChange={e => updateValue(item.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
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
                          values[item.key] ? 'bg-[#FF6B35]' : 'bg-gray-200'
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] resize-none"
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
