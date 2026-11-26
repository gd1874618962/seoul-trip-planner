# 小韩之旅 / Multi-Trip Travel PWA

移动端优先的旅行攻略 PWA。支持 iPhone Safari、Android Chrome、添加到主屏幕、离线查看、多份旅行计划、单份只读分享，以及可选 Supabase 云同步。现有首尔 2026 和吉隆坡 2027 攻略完整保留。

## 技术栈

- React 18 + Vite 5 + Tailwind CSS
- Leaflet 地图 + Naver 地图导航跳转
- 多城市数据层：`src/data/store.js` 根据 `tripId` 选择默认数据与独立 localStorage 命名空间
- 默认数据：首尔 `src/data/trip.js`，吉隆坡 `src/data/kualaLumpur.js`
- 旅行目录：默认数据 + 浏览器内的自定义旅行注册表
- PWA：manifest、service worker、主屏幕图标和 Apple 启动图
- 分享：URL 片段中的压缩只读快照

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

产物输出到 `dist/`，应用主体为单文件 `index.html`，同时包含 PWA 图标、启动图、图片和分享/离线资源。

公网云同步建议在构建前配置：

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

## 测试

```bash
npm run audit:design
npm run verify:guide
npm run verify:pwa
npm run verify:cloud
```

验收前需启动本地预览服务。`verify:cloud` 使用模拟 Supabase 后端验证“电脑修改 → 手机拉取”；真实公网同步仍要求 Supabase 表、RLS 和网络配置正确。

## 部署（GitHub Pages）

```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

流程：构建 → 冒烟测试 → 同步部署仓库 → 推送 main → 等待 Pages 部署。

PWA 必须通过 HTTPS 访问。GitHub Pages 默认提供 HTTPS；局域网 `http://192.168...` 地址不能安装到手机主屏幕。

完整的 PWA、分享链接公开边界、手机安装和后续权限升级方案见 [`PWA_SHARING.md`](./PWA_SHARING.md)。

源码同步：

```powershell
powershell -ExecutionPolicy Bypass -File push-source.ps1
```

## 公网地址

https://gd1874618962.github.io/seoul-trip-planner/

## 备份与恢复

见 `backup/README.md`，关键版本使用 Git tag 标记（当前 `v1.0-final`）。
