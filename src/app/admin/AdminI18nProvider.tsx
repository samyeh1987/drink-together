'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type Messages = Record<string, Record<string, string>>;

let _cachedMessages: Messages | null = null;

async function loadMessages(): Promise<Messages> {
  if (_cachedMessages) return _cachedMessages;
  const mod = await import('./messages/zh-CN.json');
  _cachedMessages = mod.default;
  return _cachedMessages;
}

// Inline Chinese fallback for instant first-render
const zhFallback: Messages = {
  common: { cancel: "取消", confirm: "確認", save: "儲存", close: "關閉" },
  layout: { adminPanel: "後台管理", viewFrontend: "查看前台", superAdmin: "超級管理員", admin: "後台" },
  nav: { dashboard: "儀表板", users: "用戶管理", meals: "飯局管理", restaurants: "餐廳管理", reports: "檢舉管理", photos: "照片牆", settings: "系統設定" },
  dashboard: { title: "儀表板", subtitle: "歡迎回來！以下是 EatTogether 平台的最新動態。", totalUsers: "總用戶數", activeMeals: "進行中飯局", mealsThisWeek: "本週飯局", newUsersToday: "今日新用戶", vsLastWeek: "較上週", confirmationRate: "出席率", cancellationRate: "取消率", partnerRestaurants: "合作餐廳", activeDealMeals: "個進行中套餐飯局", galleryPhotos: "照片牆", totalLikes: "總讚數", recentMeals: "最近飯局", newUsers: "新用戶", activityLog: "動態日誌", viewAll: "查看全部", host: "主辦人", people: "人", credits: "積分" },
  users: { title: "用戶管理", subtitle: "管理平台用戶、信用分及帳號狀態。", exportCsv: "匯出 CSV", totalUsers: "總用戶數", active: "正常", banned: "封禁", suspended: "停權", avgCredit: "平均信用分", searchPlaceholder: "搜尋姓名或郵箱...", all: "全部", user: "用戶", status: "狀態", credit: "信用分", hosted: "主辦", joined: "參與", noShow: "放鴿子", actions: "操作", unnamed: "未命名", viewDetails: "查看詳情", adjustCredit: "調整信用分", banUser: "封禁用戶", reactivate: "重新啟用", showingOf: "顯示 {count} / {total} 位用戶", userDetails: "用戶詳情", creditScore: "信用分", mealsHosted: "主辦飯局", mealsJoined: "參與飯局", noShows: "放鴿子次數", personalInfo: "個人資訊", ageRange: "年齡範圍", occupation: "職業", languages: "語言", bio: "個人簡介", lastActive: "最後活躍", emailVerified: "郵箱已驗證", yes: "是", no: "否", ban: "封禁", adjustCreditTitle: "調整信用分", userLabel: "用戶", pointsAdjustment: "積分調整 (+/-)", pointsPlaceholder: "例如 -20 或 +10", newScore: "新分數：", reason: "原因", reasonPlaceholder: "例如：放鴿子扣分、優質主辦人加分..." },
  meals: { title: "飯局管理", subtitle: "查看和管理平台上所有飯局活動。", totalMeals: "總飯局數", open: "進行中", completed: "已完成", cancelled: "已取消", reported: "被檢舉", searchPlaceholder: "搜尋飯局、餐廳、主辦人...", all: "全部", pending: "待確認", confirmed: "已確認", meal: "飯局", host: "主辦人", status: "狀態", date: "日期", pax: "人數", reports: "檢舉", actions: "操作", partner: "合作餐廳", viewDetails: "查看詳情", cancelMeal: "取消飯局", showingOf: "顯示 {count} / {total} 個飯局", mealDetails: "飯局詳情", dateTime: "日期與時間", deadline: "報名截止", participants: "參與者", location: "地點", payment: "付款方式", languages: "語言", budgetPerPerson: "每人預算", description: "描述", restaurantHosted: "餐廳承辦", created: "建立時間", unresolvedReports: "此飯局有 {count} 筆未處理的檢舉。詳見檢舉管理頁面。" },
  restaurants: { title: "餐廳管理", subtitle: "管理合作餐廳及其套餐方案。", addRestaurant: "新增餐廳", totalRestaurants: "總餐廳數", active: "營運中", pendingApproval: "待審核", activeDeals: "進行中套餐", searchPlaceholder: "搜尋餐廳...", meals: "場飯局", deals: "個套餐", view: "查看", restaurantDetails: "餐廳詳情", contactInfo: "聯絡資訊", address: "地址", phone: "電話", email: "電郵", contactPerson: "聯絡人", about: "關於", mealsHosted: "已承辦飯局", dealPackages: "套餐方案", addDeal: "新增套餐", editDeal: "編輯套餐", editRestaurant: "編輯餐廳", dealTitle: "套餐名稱", dealTitlePlaceholder: "例如：團體火鍋派對", describeDeal: "描述套餐內容...", originalPrice: "原價 (฿)", dealPrice: "套餐價 (฿)", minPax: "最少人數", maxPax: "最多人數", validUntil: "有效期至", status: "狀態", draft: "草稿", expired: "已過期", until: "至", nameEn: "名稱（英文）", nameLocal: "名稱（當地語言）", cuisineType: "菜系", descriptionField: "描述", aboutRestaurant: "關於餐廳..." },
  reports: { title: "檢舉管理", subtitle: "審核及處理用戶提交的檢舉。", totalReports: "總檢舉數", pending: "待處理", underReview: "審核中", resolved: "已處理", searchPlaceholder: "搜尋檢舉...", all: "全部", reviewing: "審核中", dismissed: "已駁回", reportDetails: "檢舉詳情", reporter: "檢舉人", reported: "被檢舉者", relatedMeal: "相關飯局", reportedAt: "檢舉時間：", resolution: "處理結果", resolutionNote: "處理說明", resolutionPlaceholder: "描述處理措施...", dismiss: "駁回", resolve: "處理", notifyReporter: "通知檢舉人" },
  photos: { title: "照片牆", subtitle: "審核及管理用戶上傳的飯局照片。", exportAll: "匯出全部", totalPhotos: "總照片數", pendingReview: "待審核", featured: "精選", totalLikes: "總讚數", searchPlaceholder: "搜尋上傳者、飯局或標題...", all: "全部", approved: "已通過", rejected: "已拒絕", demoImage: "示意圖", uploadedBy: "上傳者：", likes: "讚數", mealId: "飯局 ID", uploaded: "上傳時間", reviewedBy: "審核者", approve: "通過", reject: "拒絕", setAsFeatured: "設為精選" },
  settings: { title: "系統設定", subtitle: "設定平台參數與偏好。", reset: "重設", saveChanges: "儲存變更", saved: "已儲存！", general: "基本設定", generalDesc: "平台基本設定", creditSystem: "信用分系統", creditDesc: "信用分參數與規則", notifications: "通知設定", notificationsDesc: "郵件與推播通知設定", contentModeration: "內容審核", contentDesc: "內容審核與管理規則", localization: "在地化", localeDesc: "語言與地區設定", appName: "應用名稱", appNameDesc: "平台上顯示的名稱", tagline: "標語", taglineDesc: "平台簡短描述", defaultCurrency: "預設貨幣", defaultCurrencyDesc: "平台計價貨幣", timezone: "時區", timezoneDesc: "平台預設時區", maintenanceMode: "維護模式", maintenanceModeDesc: "暫時關閉平台進行維護", initialCredit: "初始信用分", initialCreditDesc: "新用戶的預設信用分", noShowPenalty: "放鴿子扣分", noShowPenaltyDesc: "每次放鴿子扣除的積分", hostBonus: "主辦完成獎勵", hostBonusDesc: "飯局完成後主辦人獲得的積分", participantBonus: "參與獎勵", participantBonusDesc: "參與飯局後獲得的積分", reviewBonus: "評價獎勵", reviewBonusDesc: "提交飯局評價後獲得的積分", excellentThreshold: "優秀門檻", excellentThresholdDesc: "達到「優秀」等級的最低分數", banThreshold: "自動停權門檻", banThresholdDesc: "低於此分數將自動停權", dailySignupLimit: "每日註冊上限", dailySignupLimitDesc: "每日最大新註冊數，防止垃圾註冊" },
};

// Dot-notation accessor: t('dashboard.title') => messages.dashboard.title
function getNestedValue(obj: Messages, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      // Fallback to zhFallback
      const fb = getNestedValue(zhFallback, path);
      return fb !== path ? fb : path;
    }
  }
  return typeof current === 'string' ? current : path;
}

interface AdminI18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null);

export function useAdminT() {
  const ctx = useContext(AdminI18nContext);
  if (!ctx) throw new Error('useAdminT must be used within AdminI18nProvider');
  return ctx.t;
}

export function AdminI18nProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Messages>(zhFallback);

  useEffect(() => {
    loadMessages().then(setMessages);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(messages, key);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [messages]
  );

  return (
    <AdminI18nContext.Provider value={{ t }}>
      {children}
    </AdminI18nContext.Provider>
  );
}
