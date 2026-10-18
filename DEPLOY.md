# Subscription Tracker 發布規則

## 目標

- Repository：EricTechLabs/Subscription-Tracker（使用者已確認名稱）
- Branch：main
- 入口：根目錄 index.html
- 靜態檔案不需建置；HTML、CSS、JS、assets、vendor、icons、manifest、Service Worker 必須一起提交。
- 與 EricTechLabs/Crypto-Tracker 完全獨立。

## 修改與發布分開

使用者要求修改、修正或準備上傳時，可完成本機程式、檢查及打包。建立遠端 repository、決定公開／私人、推送 commit、啟用 Pages 與發布網址，需在具體版本準備完成後取得使用者明確同意。不得自行更新 Crypto。

## 首次發布前

1. 確認新 repository 名稱、可見性與是否同時啟用 Pages。
2. 檢查遠端有無既有內容；若有，先讀取再比較，不覆寫未知工作。
3. 執行 npm test 與 npm run check:release。
4. config.js 保持空白；不提交 .env、.push-secrets.env、私鑰、個人帳戶資料或本機測試暫存。
5. 整個專案根目錄為提交範圍，不是只上傳 index.html。Supabase 原始碼保留但不執行。
6. 建議遵循 Crypto 的 main／根目錄入口方式；Pages 實際來源需在啟用時確認。準備階段不變更 Pages 設定。

## 後續發布

每次先查看遠端最新 commit，再修改與驗證。快取更新時同步 index.html、app.js 模組、manifest 及 sw.js 的資源修訂，Service Worker 只清除本 App 的舊快取，不清除同網域 Crypto 的快取。

發布後回報 repository、分支、commit SHA、訊息、檔案及部署結果。未取得 Pages 成功狀態不可宣稱網站已上線。

## 參考依據

2026-10-18 讀取 Crypto-Tracker 的 DEPLOY.md（blob cca042a5d5818bc870c4f45e8bf7fd3c43299ce3）、repository main 及根目錄結構；其規則要求修改與發布分開。Crypto 的 Pages 設定此次未能透過連接器讀取，未推測其實際設定。
