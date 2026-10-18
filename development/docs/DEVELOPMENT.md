# 開發與正式版

根目錄保留正式 index.html、manifest.json、sw.js、三個 PNG 與 DEPLOY.md。README 已刪除，GitHub 首頁不顯示長篇說明。

development/ 保存可編輯 JS／CSS／HTML 模板、字型、套件、測試、工具、後端來源與 docs/ 說明。正式網頁不載入此資料夾；這是公開 repository，這些來源仍公開可存取，不可放機密。

## 換裝置啟動

Clone 或下載整個 repository，在根目錄執行：

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

開啟 http://127.0.0.1:4173/，?demo=1 為示範。Supabase 未設定，真實帳戶與跨裝置資料同步尚未開放。

## 修改、建置與驗證

```sh
cd development
npm run build
npm test
npm run check:release
```

只需要 Node.js，不需 npm install。編輯 index.template.html 及各 JS／CSS，再建置根目錄 index.html；不要直接修改產物。來源與產物一起提交。

建置工具只處理本專案具名 export／import，新增模組或特殊語法須同步更新工具，不支援時停止建置。Supabase 公開設定編輯 config.js，現在全部留空。

測試與說明保留供之後維護，不載入使用者網頁。日後可另產生只含正式檔案的發布包，無需刪除 repository 內的原始碼與測試。

品牌字型與 SDK 已內嵌；Google 中文字型、Apple 搜尋與圖片仍需要網路。原始設計與安裝歷史見 HISTORY.md，當前操作以本文件及根目錄 DEPLOY.md 為準。

## 驗證

23 項 Node 測試涵蓋排程、平均、App Store 與 Service Worker；直接執行正式 HTML 的 DOM 檢查涵蓋登入、清單、分析、類別返回、帳戶及巢狀視窗鎖定。手機／iPad 實際畫面待裝置確認。
