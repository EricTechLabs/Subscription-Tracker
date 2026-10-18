# Subscription Tracker Deployment Instructions

## Project

- Project: Subscription Tracker
- Repository: `EricTechLabs/Subscription-Tracker`
- Production branch: `main`
- Production entry file: `index.html`

## Workflow

修改與發布是兩個獨立步驟。

當使用者要求「幫我修改 XXX」時：
- 可以修改網站並提供預覽或測試版本。
- 不得更新 GitHub 正式版本。
- 不得自行 Commit 正式版本。
- 不得自行發布網站。
- 即使修改完成，也必須等待使用者確認。

只有當使用者明確說「更新 GitHub」，或非常明確表示要將目前已確認的版本發布到 GitHub 時，才允許更新正式網站。

## Pre-deployment safety check

發布前必須確認：

- Repository: `EricTechLabs/Subscription-Tracker`
- Branch: `main`
- Target file: `index.html`

發布前先讀取 GitHub 現有的 `main/index.html`，確認目前版本與目標檔案。

若 Repository、Branch 或 Target 與上述資料不符，停止發布並詢問使用者，不得猜測。

若開發期間使用其他檔名（例如 `subscription-tracker.html`），發布時應將使用者已確認的最新版完整 HTML 內容更新至 `index.html`，不要另外建立 `subscription-tracker.html` 作為正式網站入口。

## Deployment rules

- 不得自行建立新的 Repository。
- 不得自行修改 GitHub Pages 設定。
- 不得自行更換網站網址。
- 不得因「幫我修改」而視為已獲得發布授權。

## After deployment

更新完成後，回報：

- Repository
- Branch
- 更新的檔案
- Commit SHA
- Commit 訊息
- 更新是否成功
- GitHub Pages 將依既有設定自動重新部署
