# 可扩展 Web App 架构

## 现状

- 前端：React 18 + Vite 5 + Tailwind CSS，移动端优先
- 入口：`src/main.jsx`，页面切换：`src/App.jsx`
- 页面：`src/pages/`（首页、行程、地图、餐厅、预算、提醒、账本）
- 通用组件：`src/components/`（底部导航、地图、页头）
- 数据：`src/data/`（默认行程内容）与 `src/data/store.js`（统一读写层）
- 数据持久化：浏览器 localStorage；局域网模式下通过 `/api/state` 同步
- 构建产物：`dist/index.html` 单文件版，推送到 GitHub main 分支后由 Pages 自动部署
- 源码分支：GitHub `source` 分支

## 扩展点

| 未来功能 | 接入位置 |
| --- | --- |
| 云同步 | `src/data/store.js` 增加云后端适配器；局域网同步已用相同接口 |
| 地图升级 | `src/components/TripMap.jsx` 可替换为 Naver/Google 地图 |
| 旅行账本 | 已完成，`src/pages/Ledger.jsx`，数据在 `store.js` |
| OCR 识别 | 新增 `src/services/ocr.js`，在账本/行程页上传图片识别小票 |
| 图片 API | 新增 `src/services/images.js`，供餐厅/地点卡片拉取实拍图 |
| 多人协作 | 保留 `store.js` 的统一状态接口，云端可换 Firebase/Supabase |

## 开发流程（自动化）

1. 修改 `src/` 或数据文件
2. `deploy.ps1`：构建 + 冒烟测试 + 推送 GitHub Pages + 等待部署完成
3. `push-source.ps1`：提交源码并推送到 `source` 分支
4. 测试脚本：`scripts/verify*.mjs`，全部使用本机 Chrome 无头验证

## 规则

- 不把 `node_modules`、`dist`、`deploy`、zip、上传文件夹提交到源码分支
- 新增数据字段先更新 `src/data/trip.js`，再在页面中消费
- 新页面先注册到 `src/App.jsx` 的 `tabs`
- 所有持久化写入统一走 `store.js`，方便后续切云同步
