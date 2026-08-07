# DATA_SCHEMA.md

## 1. 当前数据结构分析

| 数据 | 位置 | 说明 |
| --- | --- | --- |
| 行程 | `src/data/trip.js` 的 `days` | 4 天，每天含 entries |
| 餐厅 | `trip.js` 的 `restaurants` | 4 家，含推荐菜 |
| 地图 | `trip.js` 的 `points` | 16 个点位，含坐标与 Naver 搜索词 |
| 预算 | `trip.js` 的 `budget` + `store.js` 覆盖 | 已支出/计划分配 |
| 提醒 | `trip.js` 的 `reminders` + 覆盖 | 分组清单 |
| 账本 | `store.js` 的 `seoul-ledger-v1` | 手动收支记录 |
| 航班/住宿 | `trip.js` 的 `flights` / `hotels` | 目前仅默认值，未做编辑 UI |

## 2. 推荐统一数据模型

```javascript
trip {
  id,                     // 如 "seoul-2026-0821"
  title,
  destination,
  dates: {
    start,                // "2026-08-21"
    end,                  // "2026-08-24"
    nights
  },
  travelers: [userId],
  budget: {
    perPerson,
    spent: [expenseId],
    planned: [plannedItem]
  },
  accommodation: [hotel],
  itinerary: [day],
  locations: [location],
  restaurants: [restaurant],
  expenses: [expense],
  transportPlans: [transport],
  updatedAt
}
```

## 3. 日期结构

```javascript
day {
  id,                       // "day-1"
  date,                     // "2026-08-21"
  title,                    // "弘大生活感 + 圣水设计路线"
  events: [event]
}

event {
  id,
  time,                     // "12:30 - 13:40" 或 "备用"/"晚上"
  title,
  locationId,               // 关联 location
  restaurantId,             // 可选，关联 restaurant
  transport: {
    mode,                   // transit | walk | taxi | other
    description,
    cost
  },
  cost,
  notes,
  orderIndex
}
```

## 4. 地点数据结构

```javascript
location {
  id,                       // "loc-1"
  name,
  category,                 // 住宿/餐厅/街区/购物/演出/机场
  address,
  coordinates: {
    lat,
    lng
  },
  openingHours,             // 可选 "12:00-19:30"
  photos: [url],
  naverQuery,               // Naver 地图搜索词
  notes
}
```

## 5. 餐厅数据结构

```javascript
restaurant {
  id,                       // "rest-1"
  name,
  address,
  pricePerPerson,           // "150-200 RMB"
  recommendedDishes: [string],
  openingHours,
  locationId,               // 关联 location
  photos: [url]
}
```

## 6. 交通数据结构

```javascript
transport {
  id,
  from: locationId,
  to: locationId,
  options: {
    subway: { line, exit, durationMin, costKRW, costRMB },
    walking: { durationMin, distanceM, cost },
    taxi: { durationMin, estimatedCostKRW, estimatedCostRMB, note }
  },
  chosenMode,               // subway | walking | taxi
  notes
}
```

## 7. 消费账本数据结构

```javascript
expense {
  id,
  date,                     // "2026-08-22"
  category,                 // 餐饮/交通/购物/住宿/门票/其他
  merchant,                 // 商家或备注
  amountKRW,                // 韩元金额（用于原始记录）
  amountRMB,                // 人民币金额（用于预算展示）
  payer: userId,            // 谁付的，用于 AA
  participants: [userId],   // 参与分摊的人
  receiptImage: url,        // OCR 识别的小票图片（未来）
  createdAt,
  updatedAt
}
```

## 8. 用户结构

```javascript
user {
  id,                       // "user-gd1874618962"
  name,
  avatar,
  role                      // owner | traveler
}
```

AA 计算建议：

```javascript
aaResult {
  expenseId,
  payer,
  participants: [userId],
  perPersonRMB,
  settlement: [
    { from: userId, to: userId, amountRMB }
  ]
}
```

## 9. 数据库迁移建议

### 接入 Firebase / Supabase 前需要做的事

1. 所有实体补稳定 `id`（当前行程条目用数组下标、账本用时间戳）
2. 所有记录补 `tripId`、`createdAt`、`updatedAt`
3. 把“默认值 + 覆盖值”合并为一份完整 trip 文档，数据库存合并后结果或增量补丁
4. 图片（小票/餐厅照片）存对象存储（Firebase Storage / Supabase Storage），数据库只存 URL
5. 同步冲突策略：按 `updatedAt` 合并，或每字段级 last-write-wins
6. 认证：Supabase Auth / Firebase Auth 生成 `userId`，游客可先匿名登录

### 建议表结构（Supabase 风格）

```text
trips       (id, title, destination, dates, budget, updated_at)
days        (id, trip_id, date, title, order_index)
events      (id, day_id, time, title, location_id, transport, cost, notes, order_index)
locations   (id, trip_id, name, category, address, lat, lng, opening_hours, photos)
restaurants (id, trip_id, name, address, price_per_person, recommended_dishes, location_id)
expenses    (id, trip_id, user_id, date, category, merchant, amount_krw, amount_rmb, payer, participants, receipt_image_url)
users       (id, name, avatar, role)
trip_users  (trip_id, user_id, role)
```

### 兼容性结论

当前数据结构与上述模型大部分兼容，无需推倒重来。需要优先做的是：**补 id、补时间戳、把页面直接读取默认数据的调用收敛到 `store.js`**。
