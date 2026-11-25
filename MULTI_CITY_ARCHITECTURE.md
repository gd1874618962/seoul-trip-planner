# Multi-City Architecture

更新时间：2026-11-25

## 1. 架构目标

项目从单城市首尔攻略升级为多旅行实例结构。每次旅行拥有独立 `tripId`，共用同一套页面、组件和同步能力，但行程、酒店、航班、成员、地点、餐厅、提醒、预算、账本和云端更新时间彼此隔离。

当前已注册：

| 旅行 | tripId | 日期 | 状态 |
| --- | --- | --- | --- |
| 首尔 | `seoul-2026` | 2026.08.21 - 08.24 | 已完成 |
| 吉隆坡 | `kuala-lumpur-2027-01` | 2027.01.08 - 01.11 | 规划中 |

## 2. 页面结构

启动后首先进入旅行城市选择页：

- 旅行档案式城市卡片
- 城市中文名、英文名、国家、日期、状态、主题
- 进入对应城市攻略
- 新增旅行城市入口（当前为预留入口）
- 返回城市选择页的“切换城市”按钮

进入城市后继续使用原有 7 个功能页：

1. 首页
2. 行程
3. 地图
4. 餐厅
5. 预算
6. 提醒
7. 账本

城市内部另有今日模式、基础资料编辑和独立代购入口。

吉隆坡地图页内部使用独立的地点图谱组件，支持区域、类型、重点餐厅和收藏筛选；首尔地图页保持原有按天筛选和路线展示。

## 3. 当前旅行选择

当前 `tripId` 保存于：

```text
stp-active-trip
```

所有旅行级读写都通过 `src/data/store.js`。页面不直接读取 `trip.js` 或 `kualaLumpur.js` 的默认数据。

数据流：

```text
城市选择
  ↓
setActiveTripId(tripId)
  ↓
store.js 选择对应默认数据与 localStorage 命名空间
  ↓
页面组件重新挂载
  ↓
Supabase 读取/写入当前 tripId
```

## 4. localStorage 隔离

首尔是兼容基线，原有存储键完全不变：

```text
seoul-timeline-edits-v1
seoul-reminder-edits-v1
seoul-budget-v1
seoul-ledger-v1
seoul-trip-edits-v1
seoul-restaurant-edits-v1
seoul-place-favorites-v1
seoul-cloud-meta
seoul-reminders-{groupId}
```

其他城市使用“原键 + `--{tripId}`”：

```text
seoul-timeline-edits-v1--kuala-lumpur-2027-01
seoul-reminder-edits-v1--kuala-lumpur-2027-01
seoul-budget-v1--kuala-lumpur-2027-01
seoul-ledger-v1--kuala-lumpur-2027-01
seoul-trip-edits-v1--kuala-lumpur-2027-01
seoul-restaurant-edits-v1--kuala-lumpur-2027-01
seoul-place-favorites-v1--kuala-lumpur-2027-01
seoul-cloud-meta--kuala-lumpur-2027-01
seoul-reminders-{groupId}--kuala-lumpur-2027-01
```

首尔历史数据不需要迁移，也不会被吉隆坡写入覆盖。

代购 DAISY / 梧桐属于独立业务模块，继续使用全局代购键，不随旅行切换。

## 5. 默认数据注册

`src/data/store.js` 内维护旅行数据集注册表：

```text
seoul-2026
  └── src/data/trip.js

kuala-lumpur-2027-01
  └── src/data/kualaLumpur.js
```

每个数据集统一提供：

```text
tripMeta
flights
hotels
travelers
days
points
restaurants
reminders
budget
```

城市卡片展示信息位于 `src/data/cityTrips.js`，进入城市后会优先读取对应旅行已保存的 `tripMeta`。

## 6. Supabase 隔离

云端按 `trips.id = tripId` 保存每次旅行：

```text
trips
  id = seoul-2026
  id = kuala-lumpur-2027-01
```

完整页面状态仍保存在 `trips.data` 的 JSONB 中，因此兼容现有同步方式。

关联表的 `id` 在写入时增加 `tripId` 前缀，例如：

```text
kuala-lumpur-2027-01:kl-loc-hotel-1
kuala-lumpur-2027-01:kl-traveler-1
```

这样即使两座城市使用相同的局部 `locationId`，也不会触发关联表主键冲突。所有关联表记录仍带真实的 `trip_id`。

同步流程：

```text
本地修改
  ↓
当前 tripId 的 localStorage 立即保存
  ↓
syncStatus = syncing
  ↓
上传当前 trips 行与关联表
  ↓
success / error
```

启动与轮询时只读取当前 `tripId` 的云端行。`updatedAt` 仍采用 last-write-wins。

## 7. 导入导出兼容

新导出格式版本为 2，包含：

- `tripId`
- 当前旅行命名空间内的数据键
- 全局代购数据
- 当前旅行提醒勾选状态

导入旧版首尔备份时，仍可使用原有首尔数据键。导入新格式时会按文件中的 `tripId` 写入对应命名空间。

## 8. 安全边界

- 首尔旧 localStorage 数据未迁移、未删改。
- 首尔 `tripId` 保持 `seoul-2026`。
- 吉隆坡编辑不会写入首尔键。
- 切换城市时主内容按 `activeTripId` 重新挂载。
- 当前 `tripId` 是编辑中心只读字段，页面不能通过普通编辑改坏数据归属。
- 地图在吉隆坡不使用 Naver Maps SDK，外部导航跳转使用通用地图链接；未接入新的付费地图 API。

## 9. 当前限制

1. 新城市仍需要在代码中注册默认数据集，城市页的“新增旅行城市”目前是预留入口。
2. Supabase RLS 仍为当前项目的公开策略，多用户认证和按用户隔离尚未接入。
3. 预算与账本货币字段仍沿用现有结构；吉隆坡正式记账前应再确定 MYR / RMB 字段策略。
4. 吉隆坡已建立地点图谱；部分餐厅分店和坐标仍需确认，未确认地点不会生成推测地图标记。

## 10. 验收结果

`scripts/verify48.mjs` 覆盖：

- 城市选择页
- 首尔旧 key 数据保留
- 首尔 7 页渲染
- 吉隆坡 7 页渲染
- 吉隆坡酒店地址编辑
- 城市切换数据隔离
- 刷新持久化
- 今日模式识别当前旅行
- 移动端和桌面端横向溢出
- 控制台页面错误

`scripts/verify49.mjs` 额外覆盖：

- 吉隆坡三人、集合、返程信息
- 六家重点正餐
- 区域与类型筛选
- 地图卡片联动
- 地点收藏持久化
- 吉隆坡和首尔地图回归
