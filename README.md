# Seoul Trip Planner 2026

首尔 8.21-8.24 旅行执行攻略 Web App，移动端优先。

## 技术栈

- React 18 + Vite 5 + Tailwind CSS
- Leaflet 地图 + Naver 地图导航跳转
- 数据层：`src/data/trip.js`（默认内容）+ `src/data/store.js`（统一读写/同步）

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
node scripts/verify3.mjs
```

其他验证脚本位于 `scripts/verify*.mjs`。

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
