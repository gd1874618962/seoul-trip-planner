# DATA_SCHEMA_V3.md

Phase 2.2 基础信息编辑中心的数据结构说明。

## 1. 编辑中心保存格式

所有编辑通过 `saveTripEdits()` 写入 `seoul-trip-edits-v1`：

```javascript
tripEdits {
  meta: {
    title,
    dates,
    duration,
    people,
    age,
    theme,
    budgetPerPerson
  },
  flights: {
    outbound: [flight],
    return: [flight]
  },
  hotels: [hotel],
  travelers: [traveler]
}
```

## 2. 航班结构

```javascript
flight {
  date,       // "8.20 晚"
  flight,     // "MU6984"
  route,      // "上海浦东T1 → 转机"
  note        // 机场/时间备注
}
```

## 3. 酒店结构

```javascript
hotel {
  night,
  name,
  en,
  area,
  address,
  price,
  perPerson,
  features: [string],
  locationId,      // 关联地图点位，如 "loc-1"
  checkInDate,     // "2026-08-21"
  checkOutDate,    // "2026-08-22"
  checkInTime,     // "12:00 后"
  checkOutTime,    // "10:00"
  note
}
```

## 4. 成员结构

```javascript
traveler {
  id,        // "traveler-1"
  name,
  avatar,
  note
}
```

## 5. 联动规则

- 修改酒店 `address` → 首页酒店卡片同步
- 修改酒店 `locationId` / `name` / `address` → 地图对应点位同步（`getPoints()` 合并）
- 行程中 `locationId` 匹配酒店的条目 → 地址同步（`getDays()` 合并）
- 提醒页“机场时间”第一条自动显示当前酒店名称和地址（`getReminders()` 注入）
- 所有页面数据源：`store.js`

## 6. 读取入口

```text
getTripMeta()     首页基本信息
getFlights()      首页航班
getHotels()       首页住宿 + 地图/行程/提醒联动
getTravelers()    编辑中心成员
getPoints()       地图点位（含酒店联动）
getDays()         行程（含酒店地址联动）
getReminders()    提醒（含酒店名称注入）
```
