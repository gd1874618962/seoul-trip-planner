# PROJECT_ARCHITECTURE.md

## 1. 项目基本信息

- 项目名称：Seoul Trip Planner 2026
- 定位：移动端优先的旅行执行攻略 Web App（首尔 8.21-8.24）
- 技术栈：
  - React 18.3.1（JavaScript，未使用 TypeScript）
  - Vite 5.4.21
  - Tailwind CSS 3.4.19
  - Leaflet 1.9.4 + react-leaflet 4.2.1（地图）
  - lucide-react 0.436.0（图标）
  - vite-plugin-singlefile 2.3.3（单文件构建）
  - Node.js 24 LTS / npm 11（本地开发环境）
- 部署：GitHub Pages（main 分支自动发布），公网地址 https://gd1874618962.github.io/seoul-trip-planner/

## 2. 项目目录结构

```text
seoul-trip-planner/
├── src/
│   ├── components/        # 公共组件（底部导航、页头、地图）
│   │   ├── BottomNav.jsx
│   │   ├── PageHeader.jsx
│   │   └── TripMap.jsx
│   ├── data/              # 默认数据 + 统一读写层
│   │   ├── trip.js        # 默认行程内容（静态 JSON 风格数据）
│   │   └── store.js       # 状态读写/同步/导出导入
│   ├── pages/             # 7 个页面
│   │   ├── Home.jsx
│   │   ├── Timeline.jsx
│   │   ├── MapPage.jsx
│   │   ├── Restaurants.jsx
│   │   ├── Budget.jsx
│   │   ├── Reminders.jsx
│   │   └── Ledger.jsx
│   ├── App.jsx            # 页面路由（tab 切换）
│   ├── main.jsx           # 入口，初始化远程同步
│   └── index.css          # Tailwind + Leaflet 样式
├── public/images/         # 图片素材（构建时复制到 dist/images）
├── scripts/               # 构建辅助与自动测试
│   ├── make_images.py
│   └── verify*.mjs
├── dist/                  # 构建产物（单文件 HTML + images）
├── deploy/                # GitHub 部署镜像仓库（main 分支）
├── backup/                # 备份说明
├── server.mjs             # 本地局域网服务 + /api/state 同步
├── deploy.ps1             # 一键部署脚本
├── push-source.ps1        # 源码推送脚本
├── AGENTS.md              # 开发规则
├── ARCHITECTURE.md        # 简短架构扩展点
├── README.md              # 启动/部署说明
└── package.json
```

## 3. 页面架构

| 页面 | 文件 | 功能 | 数据来源 |
| --- | --- | --- | --- |
| 首页 | `src/pages/Home.jsx` | 概览：航班、住宿、预算、4日速览、导出导入 | `store.js` + `trip.js` 默认值 |
| 行程 | `src/pages/Timeline.jsx` | 每日时间线，编辑/排序/顺延时间 | `trip.js` days + `store.js` 覆盖 |
| 地图 | `src/pages/MapPage.jsx` | 16 个点位、按天筛选、Naver 导航、路线连线 | `trip.js` points + 编辑后行程顺序 |
| 餐厅 | `src/pages/Restaurants.jsx` | 4 家餐厅卡片 | `trip.js` restaurants + 行程餐饮节点联动 |
| 预算 | `src/pages/Budget.jsx` | 已支出/计划分配/剩余预算，可编辑 | `store.js` budget 状态 |
| 提醒 | `src/pages/Reminders.jsx` | 分类清单、打勾、整块/条目排序 | `trip.js` reminders + `store.js` 覆盖 |
| 账本 | `src/pages/Ledger.jsx` | 手动收支记账、分类汇总 | `store.js` ledger 状态 |

说明：当前没有独立的“购物”页面，购物信息包含在行程条目和餐厅/地图点位中。

## 4. 组件架构

公共组件：

- `BottomNav.jsx`：底部导航，页面切换，可复用
- `PageHeader.jsx`：页头（标题/副标题），可复用
- `TripMap.jsx`：Leaflet 地图封装，支持按天筛选、点位弹窗、路线连线，可复用

目前没有独立的 Card / TimelineItem / ExpenseItem 组件，相关卡片逻辑写在各自页面内。后续若出现重复卡片样式，可抽取为公共组件。

## 5. 数据流说明

```text
默认数据 src/data/trip.js
        ↓
用户覆盖 localStorage / 远程 /api/state
        ↓
统一读写层 src/data/store.js（getters + save）
        ↓
页面组件在渲染时读取
        ↓
UI 显示
```

- 默认数据：集中存放在 `src/data/trip.js`（对象/数组）
- 用户编辑：保存在 localStorage（键：`seoul-timeline-edits-v1`、`seoul-reminder-edits-v1`、`seoul-budget-v1`、`seoul-ledger-v1`）
- 局域网同步：`server.mjs` 提供 `/api/state`，多设备约 5 秒轮询同步
- 未使用 Context / Redux；页面靠 tab 切换重新挂载读取最新数据，远程变化触发 App 级 tick 重渲染
- 导出/导入：`exportAllState()` / `importAllState()` 打包全部状态

## 6. 部署流程

```text
修改代码
   ↓
vite build（单文件 dist/index.html）
   ↓
Playwright 冒烟测试 scripts/verify3.mjs
   ↓
同步 deploy 镜像仓库（fetch + reset 到 origin/main）
   ↓
git commit + git push origin main
   ↓
GitHub Pages 自动构建发布
   ↓
公网访问 https://gd1874618962.github.io/seoul-trip-planner/
```

源码另存到 `source` 分支（`push-source.ps1`）。

## 7. 当前技术债务分析

### 数据是否集中管理

- 部分集中：默认数据集中在 `trip.js`，编辑覆盖统一走 `store.js`
- 缺口：酒店、航班、基本信息（人数/日期/总预算）目前仍只有默认值，还没有可编辑 UI（Phase 2 待做）

### 是否适合接入数据库

- `store.js` 已抽象 getter/save 接口，适合替换为 Supabase/Firebase 适配器
- 当前数据均为 JSON 兼容结构，可直接迁移
- 需要补：统一的 `tripId`、`userId`、`updatedAt` 字段

### 是否适合多人同步

- 局域网同步可用；公网仍是各设备 localStorage，需云数据库
- 冲突策略未实现（当前为“整份覆盖”），接入云同步后需按时间戳合并

### 是否适合增加 API（OCR/图片）

- 适合：新增 `src/services/` 目录存放 OCR、图片 API 客户端即可
- 注意：小票图片不要存入 localStorage，应上传对象存储后保存 URL

### 建议重构点

1. 把“默认值 + 覆盖值”合并逻辑收敛到 `store.js`，页面不直接 import `trip.js`
2. 为所有实体补齐稳定 id（当前行程条目用数组下标，账本用时间戳）
3. 页面间联动（行程→餐厅/地图）已实现，但依赖名称前缀解析，建议改为显式 `restaurantId`/`pointId` 引用
4. 引入轻量 schema 校验（前端可先用纯函数，后续可接 zod）

### 可直接扩展点

- 新增数据域：在 `store.js` 加 key + getter/save，加入 `DATA_KEYS` 即可自动支持导出导入和局域网同步
- 新页面：`src/pages/` 新建文件，注册到 `App.jsx` tabs
- 云同步：替换 `store.js` 的 remote 读写实现
