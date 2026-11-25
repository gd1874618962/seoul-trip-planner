# Seoul Trip Planner / Multi-City Travel Planner

移动端优先的多城市旅行攻略 Web App。目前包含首尔 2026 和吉隆坡 2027 两个独立旅行实例。

## 技术栈

- React 18 + Vite 5 + Tailwind CSS
- Leaflet 地图 + Naver 地图导航跳转
- 多城市数据层：`src/data/store.js` 根据 `tripId` 选择默认数据与独立 localStorage 命名空间
- 默认数据：首尔 `src/data/trip.js`，吉隆坡 `src/data/kualaLumpur.js`
- 城市目录：`src/data/cityTrips.js`

## 本地启动

```bash
npm install
npm run dev
```

浏览器打开 Vite 提示的本地地址（默认 http://localhost:5173）。

## 构建

```bash
npm run build
```

产物输出到 `dist/index.html`（单文件版 + `images/`）。

## 测试

```bash
node scripts/verify49.mjs
```

`verify49.mjs` 覆盖吉隆坡地点图谱、区域/类型筛选、地图联动、收藏和 7 个旅行页面；`verify48.mjs` 覆盖城市切换与云端数据隔离。

其他历史验证脚本位于 `scripts/verify*.mjs`。

## 部署（GitHub Pages）

```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

流程：构建 → 冒烟测试 → 同步部署仓库 → 推送 main → 等待 Pages 部署。

源码同步：

```powershell
powershell -ExecutionPolicy Bypass -File push-source.ps1
```

## 公网地址

https://gd1874618962.github.io/seoul-trip-planner/

## 备份与恢复

见 `backup/README.md`，关键版本使用 Git tag 标记（当前 `v1.0-final`）。
