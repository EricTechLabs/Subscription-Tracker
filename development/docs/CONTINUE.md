# 換裝置接續開發

## 目前交接

- 專案：訂閱追蹤 / SUBSCRIPTION - TRACKER。
- 目標：EricTechLabs/Subscription-Tracker，main 分支，根目錄 index.html。
- 使用者已確認建立公開 repository 並啟用網頁預覽；是否已成功發布，須以 GitHub 最新 commit／Pages 狀態確認。
- 最新前端修訂 v31；Supabase 完全未設定。請勿使用 Crypto 後端。
- 日期自定義維持頁內開始／結束欄位，點欄位使用原生日期選擇器，不另開整個日期視窗。
- 年／月／自定義分析保留未來預估；起算排除記錄開始前的空白時間；付款筆數可下鑽到按月明細。
- ST Logo 已核准，保留圖形輪廓與長寬比例；長英文不能硬塞到 CRYPTO 的固定文字框。
- 登入／帳戶尺寸參考 Crypto 正式原始碼；設定頁保留標題，移除麵包屑、E 頭像、英文裝飾與副標題。
- 所有彈出視窗共用背景鎖定；巢狀圖示視窗關閉後直到最後一個視窗關閉才恢復頁面位置。

## 明天的操作

1. 登入有權限的 GitHub 帳號，確認 repository 已上傳成功。
2. 將 repository clone 到公司裝置，或下載 ZIP 解壓。
3. 在 Codex 開啟該資料夾，先讀 根目錄 DEPLOY.md、development/AGENTS.md、development/docs/DEVELOPMENT.md 與本文件。
4. 用 DEVELOPMENT.md 的 HTTP server 指令啟動；?demo=1 即可操作，不需要 Supabase。
5. 修改前先和使用者確認範圍；完成後先提供預覽，再取得 GitHub 發布同意。

GitHub 帶走的是原始碼與本文件。Codex 目前聊天紀錄不在 repository；瀏覽器內的示範新增項目也不會跨裝置同步。另一台裝置將使用內建示範資料。若需要 GitHub 網站預覽，另確認 Pages 已啟用及部署成功。

可在新對話貼上：

> 請讀取這個 repository 的 DEPLOY.md、development/AGENTS.md、development/docs/DEVELOPMENT.md、development/docs/CONTINUE.md，接續訂閱追蹤專案。目前先完成前端，Supabase 之後再做。修改前先確認，不要自動發布 GitHub。先核對目前分支及版本，再和我確認下一步。

正式 index.html 由 development/ 來源建置。先修改來源再 build；README 已刪除。
