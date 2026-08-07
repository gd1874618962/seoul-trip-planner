# DATA_SCHEMA_V2.md

Phase 2.1 数据稳定化后的数据结构说明。

## 1. 稳定 ID 规则

- 行程条目：`id: "d1-e1"` 格式（第 1 天第 1 条）
- 用户新增条目：`id: "evt-<时间戳36进制>-<随机串>"`
- 账本记录：`id: "exp-<时间戳36进制>-<随机串>"`（不再使用裸时间戳）
- 地图点位：数字 `id` + 字符串 `locationId: "loc-1"`，两者一一对应
- 餐厅：数字 `id`

## 2. 行程条目（event）

```javascript
event {
  id,                    // "d1-e1" / "evt-xxx"
  time,
  title,
  type,
  restaurantId,          // 可选，关联 restaurant
  pointIds,              // 关联 point（数组，支持一次去多个点）
  locationId,            // 单点位时使用，与 pointIds 二选一
  locationIds,           // 多点位时使用，如 ['loc-5','loc-6']
  address,
  transport,
  transportMode,         // transit | walk | taxi | other
  transportCost,
  cost,
  note,
  recommend,
  isBackup
}
```

## 3. 地图点位（location / point）

```javascript
point {
  id,                    // 1..16
  locationId,            // "loc-1".."loc-16"
  day,
  name,
  ko,
  category,
  address,
  lat,
  lng,
  naver
}
```

## 4. 餐厅（restaurant）

```javascript
restaurant {
  id,
  name,
  ko,
  type,
  day,
  address,
  price,
  priceRange,
  recommend,
  image,
  note
}
```

餐厅与行程的关联：行程餐饮条目通过 `restaurantId` 显式引用餐厅 `id`，不再通过名称匹配。

## 5. 账本记录（expense）

```javascript
expense {
  id,                    // "exp-xxx"
  date,
  type,                  // expense | income
  category,              // 餐饮/交通/购物/住宿/门票/其他
  amount,
  note,
  createdAt              // 建议后续补充
}
```

## 6. 数据读取规则

- 所有页面只通过 `src/data/store.js` 读取数据
- 新增读取入口：`getTripMeta()`、`getFlights()`、`getHotels()`、`getPoints()`、`getDays()`、`getRestaurants()`、`getBudgetState()`、`getReminders()`、`getLedgerState()`
- 页面禁止直接 import `src/data/trip.js` 中的业务数据

## 7. 旧数据迁移

- 旧 localStorage 行程条目没有 `id` 时，读取时自动补齐 `evt-<day>-<index>`
- 旧账本记录使用数字 id 仍可正常读取、编辑、删除
- 名称匹配逻辑已移除：餐厅名称始终来自餐厅记录本身
