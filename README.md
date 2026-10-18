# 訂閱追蹤 / Subscription Tracker

與 Crypto-Tracker 獨立的固定支出追蹤 App。深藍／青藍品牌、訂閱清單、類別、週期排程及支出分析。純靜態網站，無需建置或安裝套件。

## 目前版本

2026-10-18，前端 v30，首次公開前端預覽版。目標 repository：`EricTechLabs/Subscription-Tracker`；分支 `main`，入口根目錄 `index.html`。

- Supabase 連線設定保持空白；網頁發布狀態請以 GitHub Pages 部署結果為準。
- 登入／註冊／帳戶設定可預覽，尚不能使用真實帳號。
- 點登入頁「先看看示範」，或網址加 `?demo=1` 即可試用。
- 示範資料只存在當前瀏覽器。GitHub 同步原始碼，不會把本機新增項目同步到另一裝置。
- 推播、真實帳戶、跨裝置資料同步，待之後建立獨立 Supabase 再完成。

## 本機啟動

在 repository 根目錄執行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

開啟 `http://127.0.0.1:4173/` 看登入頁，或 `http://127.0.0.1:4173/?demo=1` 看示範。
不要直接雙擊 HTML，以免模組與 Service Worker 無法載入。

## 驗證

需要 Node.js 內建測試工具，不需要 npm install：

```sh
npm test
npm run check:release
```

目前 23 項測試涵蓋排程、閏年、提醒計算、App Store 連結、預估平均、付款明細一致性、快取隔離及 GitHub Pages 子目錄通知連結。介面／手機驗證限制見 `VALIDATION.md`。

## 主要檔案

| 檔案 | 用途 |
| --- | --- |
| index.html | 網站入口及品牌 |
| app.js / core.js | 畫面、資料操作與排程／分析 |
| auth-ui.js / auth.css | Crypto 風格登入與帳戶 |
| modal-scroll.js | 彈出視窗背景鎖定及位置恢復 |
| appstore.js | App Store 搜尋／圖示 |
| styles.css / theme-crypto.css | 版型與配色 |
| sw.js / manifest.webmanifest | 離線外殼、主畫面與未來推播 |
| config.js | 公開前端設定，目前全部空白 |
| backend/ | 未部署的獨立 Supabase 安裝來源 |
| CONTINUE.md | 換裝置接續開發 |
| DEPLOY.md | 本專案發布規則 |

所有前端資源使用相對路徑，支援 GitHub Pages repository 子目錄。`.nojekyll` 用於純靜態檔案發布。Pages 預計從 main 根目錄發布；是否已啟用及成功部署請查看 repository Settings → Pages。

## 後端稍後處理

此版本不要建立 Supabase、填入 Crypto 的 URL／金鑰、執行 SQL、部署 Edge Function 或推播排程。之後只使用訂閱追蹤自己的新 Supabase。安裝來源及過往計算、設計決策保留於 `HISTORY.md`；實施前須再核對當前設定與官方文件。

前端只可放公開金鑰；service role、secret、VAPID 私鑰及排程密鑰不可提交。
