# 訂閱追蹤 / Subscription Tracker

獨立於 Crypto-Tracker 的新專案。手機及桌面可使用的靜態網站；登入、資料與推播後端使用使用者新建的 Supabase 專案。

## 目前狀態

- 可操作：訂閱清單、搜尋／排序／篩選、新增／編輯／刪除、圖片、週期與起訖日期、月／年／日期區間分析、每筆各自的付款與結束提醒設定。
- 示範模式修改只存在此瀏覽器，不會匯入正式資料。
- 雲端登入及 CRUD 程式已備妥，但尚未連接新 Supabase，未進行真實資料庫整合驗證。
- 推播前後端程式已備妥，但尚未部署或實測 iPhone 接收。設定提醒不代表裝置已允許通知。
- 尚未建立或上傳新的 GitHub repository；沒有修改 Crypto-Tracker。

## 本機預覽

在此資料夾執行 `python3 -m http.server 4173`，開啟 http://localhost:4173/ 。點「先看看示範」即可試用，不需要帳號。

## 介面架構

- 首頁僅顯示卡片清單，左上角開啟獨立菜單；摘要統計集中在支出分析。
- 菜單可選訂閱、本月、下月及類別；選完返回清單。
- 排序與搜尋收進右上角按鈕。
- 菜單可新增類別；管理入口可改名稱、顏色或刪除，空類別也會保存。
- 改名同步更新既有項目；刪除類別時，相關項目移到未分類並保留紀錄。

## 計算規則

- 僅新台幣，整數「分」儲存，最多兩位小數。
- 開始日為第一筆付款日；結束日包含當天的排定付款，之後停止。
- 31 日扣款在短月份落在月底，下個月回到原本日期；年繳 2 月 29 日同理。
- 累計花費是開始日至今天的排程推算，並非銀行實際扣款。
- 月／年／自訂分析包含區間內未來預計付款，不將年費攤成每月金額。
- 不提供歸檔功能；已結束項目仍保留歷史排程及分析紀錄。
- 每筆分別開關付款提醒與結束提醒，提前 0～365 天、台灣時間 HH:mm；沒有共用預設設定。
- 分期直接使用開始／結束日，沒有期數、剩餘本金、標籤、付款帳戶、買斷或服務搜尋模板。

## 新 Supabase 專案安裝

1. 建立獨立 Supabase 專案。不要對 crypto-tracker 專案執行這些檔案。
2. 在新專案 SQL Editor 依序執行 `backend/schema.sql`、`backend/categories.sql`、`backend/profiles.sql` 各一次，並在開放註冊前完成。它建立訂閱、類別、帳戶名稱及推播資料表與每位使用者的 RLS；註冊 trigger 建立使用者名稱及預設類別，不建立示範訂閱。
3. 在 Auth 設定 Email 登入。以網頁的「建立帳號」註冊並完成驗證；自用完成後可關閉新用戶註冊。
4. 管理者將專案 URL 及 **publishable key** 寫入 `config.js`；使用者登入頁與設定不提供後端連線欄位。這兩項是公開設定，可放前端。絕不可放 service_role、Supabase secret、VAPID 私鑰或排程密鑰。
5. 在兩個裝置登入相同帳號，建立／編輯一筆，回到另一裝置或重新整理確認同步。正式模式儲存成功才更新畫面；沒有離線寫入佇列。
6. 在 Supabase Advisors 檢查 RLS，另外用兩個測試帳號確認無法讀取或改寫彼此資料。

## 背景推播安裝

1. 用 Node 執行 `node backend/generate-keys.mjs` 一次。它將 VAPID 私鑰與排程密鑰存到被 gitignore 排除的 `backend/.push-secrets.env`，只輸出公開金鑰。保留原金鑰，重建會使既有裝置訂閱失效。
2. 將檔案內 `ST_VAPID_SUBJECT` 改成自己的 `mailto:email`。把其中四個環境變數加到新 Supabase 專案的 Edge Function Secrets。`SUPABASE_URL` 與 `SUPABASE_SERVICE_ROLE_KEY` 使用 Edge Runtime 內建值。
3. 部署 `backend/functions/send-reminders/` 為 `send-reminders`。包含 `index.ts` 與 `core.js`。JWT 驗證關閉，因函式自己驗證 `x-cron-secret`；未帶正確密鑰必須回傳 401。可使用附帶的 `backend/config.toml` 設定。
4. `core.js` 與網站根目錄的 `core.js` 必須相同；修改計算規則時同步更新並跑測試。
5. 在 Supabase Vault 建立 `st_project_url` 和 `st_cron_secret`，後者需與 `ST_CRON_SECRET` 相同；執行 `backend/schedule.sql` 一次，建立每分鐘排程。重設前先移除相同名稱舊排程。
6. 把 **ST_VAPID_PUBLIC_KEY** 填入 `config.js`；私鑰只留後端。
7. 將網站部署到 HTTPS。在 iPhone 加入主畫面，從主畫面開啟並登入，再點「開啟此裝置通知」。每個裝置各自授權。
8. 建立測試項目，把付款日設為今天、提前天數 0，提醒設為幾分鐘後，關閉網站並鎖定手機，確認收到通知、點擊到正確詳情、重跑排程不重複通知。付款與結束提醒皆需測試。

函式使用一次性紀錄與兩分鐘重試租約，避免正常重跑／併發重複送出。若程序在推播服務接受後、寫入成功紀錄前中止，仍可能再次傳送；相同通知 tag 可合併顯示，不宣稱 exactly-once。失敗提醒在 24 小時內重試；超過不補發。推播服務回傳 404／410 時刪除失效裝置。成功只是推播服務接受，不保證作業系統立即顯示。個人規模使用，資料量大時應改成資料庫預先計算佇列。

## GitHub 部署

使用**另外建立的新 repository**，建議名稱 `Subscription-Tracker`，不要覆寫 Crypto-Tracker。

此網站不需建置。Repository root 放置 index.html、app.js、core.js、styles.css、config.js、sw.js、manifest、icons 及 vendor/。GitHub Pages 從該 repository 的 main 根目錄部署；相對路徑支援 `/Subscription-Tracker/` 子目錄。原始碼及後端安裝檔可一起版控，但任何秘密金鑰不得上傳。

確認新網址後，Supabase Auth 的 Site URL／允許的 Redirect URLs 應指向新站。iPhone 背景推播需在正式 HTTPS 網址實測，本機預覽不算通過驗收。

修改與正式發布分開：先看預覽確認，再更新新的 GitHub repository。

## 驗證

`node --test tests/*.test.mjs`：日期邊界、最後一期、金額、時區與提醒計算。UI 驗證及結果記錄於 `VALIDATION.md`。

## 官方參考

- [iOS 主畫面 Web Push](https://webkit.org/blog/13878/)
- [Supabase Auth](https://supabase.com/docs/guides/auth/passwords)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [排程函式](https://supabase.com/docs/guides/functions/schedule-functions)
- [Web Push 套件](https://github.com/web-push-libs/web-push)

Supabase browser SDK 固定 2.102.0（vendor/supabase.js）；Edge Function 同版，web-push 固定 3.6.7。

付款頻率以「每［數字］［天／週／月／年］付款一次」設定。本月／下月卡片顯示所選月份內的排定付款日期，不會顯示下個月份的日期；同月多次會列日期（超過三次時縮寫），金額標為每次。全部／類別清單繼續顯示下一次付款。

## 新增項目與圖示設定

按新增直接開固定支出表單，名稱空白且沒有範例提示。名稱上方的圖示框可開啟獨立面板，操作不會清除已填的金額、日期或其他欄位。

面板由上到下為：App Store 取得區（貼連結／名稱搜尋、可選是否帶入名稱）、120 個 Emoji 格子（縮短高度，可捲動）、自行輸入或貼上單個 Emoji、上傳自訂圖片。支援家庭、膚色等組合 Emoji；非 Emoji 或一次輸入多個時顯示訊息。

名稱已填時預設保留名稱，空白時預設帶入 App 名稱。選擇 App 後回到同一表單；圖示、名稱等都在最後按儲存後才建立或更新項目。取消面板保留原圖示及其他欄位。圖片支援 PNG／JPG／WebP、最多 5 MB；換成 Emoji 或自訂圖片會移除 App Store 圖示來源。

Apple 官方 JSONP 查詢不依賴 Supabase 或代理。搜尋預設台灣商店，連結查詢依連結地區。同一查詢暫存在記憶體十分鐘；查無結果、逾時及無效連結會顯示訊息。App Store 圖示使用 Apple 圖片網址，離線不保證顯示。來源連結保留於詳情。

## 介面修正 v13

菜單採線條式 SVG 側欄圖示，圓形及關閉按鈕以固定容器置中。付款分布圖新增右側金額刻度與對應水平格線，依資料選擇尺度，零金額不畫出假柱高。從管理類別開啟新增／修改時，X、取消與 Escape 返回管理清單；儲存成功亦返回管理清單。清單上的 X 才關閉整個視窗。從菜單直接新增類別仍返回菜單。

## Crypto 配色預覽 v14

加入 `?demo=1&theme=crypto&v=14` 可看 Crypto-Tracker 配色版本，使用其 main/index.html（b0a45c6）的深藍背景 #0b1020、卡片 #121a2e、邊線 #263352、文字 #edf2ff、次要文字 #98a6c7、青藍強調色 #57d9ff。配色獨立於 theme-crypto.css，未更動 Crypto-Tracker。未帶 theme=crypto 時沿用原配色。付款圖兩種版本皆調為 160px，刻度上限貼近最大支出，固定四個等距區間。登入頁改版依使用者決定留至 Supabase 架設階段。

## 分析頁期間切換 v15

分析頁上方採置中的年／月標題與右側左右切換，下方為月、年、自定義三段按鈕。月模式切換相鄰月份，年模式切換相鄰年度，保留原本的月份供切回；自定義模式才顯示起訖日期，不顯示左右箭頭。修改期間同步更新摘要、付款圖及類別占比；日期範圍切換後保留。

## 支出分析與明細 v16

- 月、年、自定義切換保留；點自定義直接在頁面下方顯示開始／結束日期，以原生 date input 選擇日期，合法期間立即更新分析，不另開日期設定視窗或加入確認／取消按鈕。最多十年，無效期間顯示錯誤並保留原分析。
- 平均保留所選期間內全部預估付款。起算日為「所選起日」與「目前項目最早開始日」較晚者；年模式按含起訖月份的連續月份數平均，月／自定義按含起訖日的天數平均。排除開始記錄前的空白，但開始後沒有付款的月份仍計入；不是僅除以有付款的月份。沒有可計算期間時顯示破折號。
- 例如 8 月開始、查看當年全年：計算 8～12 月預估總額 ÷ 5 個月。每日平均自實際開始日起算；已在上一年開始的項目，下一年度則採完整全年。
- 點付款筆數開啟該期間明細。每筆排定付款各占一列，含日期、項目名稱、每次金額；月份由新到舊，同月日期由早到晚，每月顯示小計。筆數、總額及明細使用相同資料來源，包含未來預計付款；並非銀行實際扣款。
- 返回分析頁保留原期間，不含分享或匯出。

v18 日期互動修正：依使用者澄清，恢復頁內起訖日期，僅使用與 Crypto 相同的原生日期選擇器。保留 v16 平均與付款明細功能，載入資源版本一致更新。

## 品牌 v19

採用使用者選定 C 款的幾何 ST 標誌，淡白 #edf2ff 與青藍 #57d9ff 搭深藍 #0b1020。英文名稱 SUBSCRIPTION - TRACKER，中文訂閱追蹤。首頁置於狀態列與「全部」操作列之前，中文對齊英文起點；桌面側欄使用同款標誌的緊湊排列。菜單、單筆詳情、分析與設定不重複放大型標誌。

assets/brand-mark.svg 為透明 ST 圖標，assets/brand-lockup.svg 為圖標與英文的向量組合，英文字體採與 Crypto 相同的 Audiowide 並轉成路徑。側欄字型本地化，授權在 assets/Audiowide-OFL.txt。主畫面圖示為 icon-192.png、icon-512.png，Apple Touch 為 apple-touch-icon.png。分頁標題、manifest 與通知名稱同步更新；原有資料儲存鍵不變。

## C 款比例修正 v20

ST 外形依使用者核准的 C 款截圖取輪廓，保留 281:255 原寬高比例，不再由方形字母形狀推估切角。清除像素邊緣細碎折點後轉為向量，描線輪廓與截圖色塊約 98.9% 重疊。

首頁採「左側圖標＋右側英文／中文」同一排：英文為 assets/brand-wordmark.svg 路徑，中文在右側文字容器內左對齊。圖標高度配合兩行文字，手機隨可用寬度等比縮放，英文維持單行。側欄、分頁圖示與 PNG 使用相同修正輪廓。

## 英文字型對齊 v21

英文改用與 Crypto 相同的瀏覽器 SVG 文字策略：Audiowide、700 字重、0.5px 字距，以及 textLength／spacingAndGlyphs。TRACKER 依 Crypto 44px 字號時的 210px 字寬等比例設定，SUBSCRIPTION 依 Crypto 的 CRYPTO 壓縮比例處理。沿用本地字型；獨立 SVG 嵌入同一字型。圖標、PNG 與中文排列未變，已比對檔案雜湊。

## 本機 Crypto 排版整合 v22

此版以本機 crypto-dashboard-supabase-preview.html（2026-10-18 09:50 版）為參考，非 GitHub 或截圖估算。首頁將 C 圖標、英文及中文放入同一個 SVG，沿用本機版 100 單位高度、英文 44／基線 55、中文 18／基線 82、字重與字距設定。長英文標題延伸整體 viewBox 寬度，所有元素只透過整組 SVG 等比縮放，不再拆成圖片與 HTML 中文或另設英文 84% 寬度。C 圖形保持原稿比例，放進 Crypto 相同的圖標座標區。

桌面頂部留白 28px，560px 以下為 20px，對應本機 Crypto 的頁面設定；SVG 內部也保留原有留白。手機、iPad、筆電依可用容器寬度縮放，側欄標誌同樣採單一 SVG。已確認的圖標／PNG 檔案不變。

## GitHub 正式版品牌規格 v23

重新讀取 GitHub Crypto-Tracker 正式版 index.html（檔案 SHA cc3013e1c9146b25a968421d0d65198a4f3f94a6），改為相同 560×100 SVG、桌面最大 560px、560px 以下 84%／最大 360px。英文與中文的座標、字號、文字區寬度沿用正式版；SUBSCRIPTION 完整保留於其品牌名稱文字區。相同圖標座標區域內維持 C 原始比例，頂端 18、中心 x=50、高度 64。手機品牌區域補償與 Crypto 的頁面左右留白差距，不移動訂閱清單。所有核准的獨立 C 圖檔保持原檔。

## 白字比例修正 v24

依使用者確認，不再將完整 SUBSCRIPTION 塞入 Crypto 的 CRYPTO 固定文字寬度。以 TRACKER 的字型度量比例推算白字寬度，兩者同字號、同基線、同字形縮放比例；連字號與藍字右移，整個 viewBox 向右延伸。頁首留白及 C 圖標座標／形狀維持，桌面有空間時保留原比例，小螢幕讓整組縮入可用寬度。獨立文字與完整品牌 SVG 同步更新。

## 登入與帳戶 v26

依 GitHub Crypto-Tracker 正式版 index.html（檔案 SHA cc3013e1c9146b25a968421d0d65198a4f3f94a6）的登入卡片及帳戶表單結構製作，保留訂閱追蹤已核准的品牌圖示與文字比例。深藍／青藍為預設配色，無需額外 theme 參數。

未登入時顯示 Email、密碼及註冊入口；註冊包含 Username、Email、至少 8 字元密碼。未設定獨立 Supabase 時明示介面預覽，不會建立假帳號或宣稱登入成功，可點「先看看示範」。設定 → 帳號與資料 → 帳戶包含目前 Email、修改使用者名稱，以及舊／新／確認密碼與顯示切換。示範模式僅供互動預覽，不儲存帳戶變更。正式模式驗證舊密碼後才送出更新；關閉帳戶視窗清空密碼欄位。

尚未建立新 Supabase 或執行 SQL；真實註冊、驗證信、跨裝置登入、RLS 與修改密碼仍需獨立後端完成後實測。登入頁網址不帶 demo；帶 demo=1 為本機示範資料。


## Crypto 登入樣式對齊 v27

重新讀取 Crypto GitHub 正式版，獨立 auth.css 避免訂閱表單樣式覆蓋登入與帳戶控制項。登入保留 420px 卡片、24px 內距、12px 圓角；輸入框移除訂閱專用 46px 最小高度，採 Crypto 的 10px 內距與 16px 字號。按鈕採其 10px／13px 內距、13.333px 字號與 8px 圓角；不再額外增加手機卡片規格。示範提示移到卡片外。帳戶視窗採 680px 上限、20px 內距及 8px 圓角，表單間距、標題、說明及密碼切換按鈕依正式版對齊。保留已核准 ST 圖標與較長英文品牌。
