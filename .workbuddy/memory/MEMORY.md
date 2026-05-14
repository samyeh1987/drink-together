---
updated: 2026-05-14
---

# 工作背景
用戶為台灣工程師，任職騰訊，透過 WorkBuddy 接收任務指派，擔任前端工程師負責修復 HiGoGO Travel（higogotravel.com）普吉島旅遊網站 bug。主導三個專案：ThaiShop 泰國電商獨立站（靜態 HTML + Tailwind CDN + Supabase + Chart.js + Vercel，中/英/泰三語，Mobile-first，支援 COD、PromptPay QR、信用卡；DB 含 product_categories, promotions, products, users, addresses, cart_items, orders, order_items）、HiGoGO Travel（Supabase 專案 ID: jtzqnvnsvcnqmujeaduj / URL: https://jtzqnvnsvcnqmujeaduj.supabase.co；Vercel 部署專案名: higogotravel；含 diving_packages 深潛套餐表、圖片以 JSONB 存儲）、以及「不要一個人喝酒」社交飲酒 App（第三方開放平台連接酒吧與消費者，金幣經濟：酒吧人員手動發放→用戶兌換合作商家套餐/優惠券，投資方在曼谷&吉隆坡擁有多家酒吧作首批合作據點，目前為 Web/H5 架構，計畫完成後轉為 APP 上架應用商店）。

# 個人背景
用戶慣用繁體中文溝通，偏好 AI 直接操控電腦執行指令而非僅提供文字說明，直接讀取檔案而非使用 grep 分析。提供參考連結/圖片後期望 AI 直接實作無需額外解說；提供詳細業務邏輯與上下文後才要求規劃，期望 AI 做綜合評估並給出結構化選項供決策。工作風格重視細節：不動已完成功能、要求完整成品並主動測試、期望核心功能在 App 結構中突出展示並優先呈現。報告進度時偏好 ✅⚠️❌ 結構化格式，輸出需指定檔案路徑與技術規格。任務量大時採分段逐步處理；任務中斷後期望 AI 繼續執行無需重新說明上下文。

# 「不要一個人喝酒」App 已確認規則摘要（v1.2）

**部署**：https://drink-together.vercel.app/

**語言**：簡體中文 / English / ภาษาไทย

**等級制度**：Lv.1新手酒友→Lv.2入門喝客(3場)→Lv.3熟客酒鬼(10場+5篇動態)→Lv.4派對達人(25場+3次發起+評分≥4.2)→Lv.5傳奇酒神(50場+推薦10次+帳號≥90天)

**核心規則**：
- 年齡：自填18歲以上 + 未成年飲酒提醒
- 違規：前期人工審核；封鎖10次標記待審；舉報5次功能限制
- 酒局：Lv.2發起；人數範圍設定；同場最多申請2次；桌長不可轉讓
- 信用分：初始100，退出-1~-8，完成+2，月恢復上限10
- 金幣：系統任務每日上限300幣；酒吧發放不計入；永久有效；不可退幣
- 私信：互相關注OR同場酒局；無已讀；後端永久/客戶端180天
- 動態：預設公開；支援泰文；純舉報審圖
- 酒吧：平台建檔；開放評分；簽到500m；吉隆坡隨時可展開
- 通知：接入Web Push + Email；暫不接LINE

**文件**：`docs/功能邏輯規劃.md` v1.2（2026-05-09）

# 當前關注
- 「不要一個人喝酒」App v2 DB migration 全部上線完成，前端功能已全部完成
- ✅ v2 DB migration 全部上線 Supabase + pg_cron 排程完成
- HiGoGO Travel（higogotravel.com）bug 修復持續進行中
- ThaiShop 功能完整度維護持續推進

# 技術進度（Drink Together）
- ✅ v2 DB migration 全部上線 Supabase：`supabase/migrations/012_drinktogether_v2_schema.sql`（16 新表 + 45 RLS + 20 Functions + 15 Triggers），分 3 Batch 執行完成
- ✅ TypeScript 型別更新完成：`src/types/index.ts`（完整對齊 v2 schema）
- ✅ 酒吧系統：bars 列表頁 + 詳情頁（打卡/評分/營業時間/導航）+ bar-store + TabBar 整合
- ✅ 金幣系統：coins 總覽頁（餘額/簽到/任務/交易記錄）+ 商城頁（兌換/訂單/QR）+ coin-store + Profile 入口
- ✅ 動態牆：moments 時間軸（圖片網格/全螢幕瀏覽/點讚動畫/心情標籤）+ 發布 Modal（圖片上傳/隱私設定）+ 留言 Bottom-sheet（巢狀回覆）+ moment-store + 無限滾動
- ✅ 私信系統：messages 列表頁 + 聊天室頁（文字/圖片/酒局邀請/商品分享 4 種訊息類型）+ chat-store + TabBar 整合
- ✅ 社交關係：user profile 頁（follow/unfollow/block/report/message/view moments）+ followers/following/moments 列表頁 + social-store + Profile 頁入口整合
- ✅ TabBar 整合：Home/酒吧/發起/Drinks/Messages/Profile 6 tab + 子頁面自動隱藏
- ✅ Build 69 頁面全部通過
