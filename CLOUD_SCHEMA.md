# CLOUD_SCHEMA.md

Phase 2.3 Supabase 云同步说明。

## 1. 数据表

执行 `supabase/schema.sql` 后创建：

| 表 | 主要字段 |
| --- | --- |
| trips | id(tripId), title, start_date, end_date, budget, data(jsonb), created_at, updated_at |
| trip_members | id, trip_id, name, avatar |
| hotels | id, trip_id, name, address, location_id, check_in, check_out, note |
| locations | id, trip_id, name, address, lat, lng |
| flights | id, trip_id, type, flight_no, date, time |
| events | id, trip_id, date, time, title, location_id, restaurant_id |
| expenses | id, trip_id, payer, amount_krw, amount_rmb, category |

所有子表通过 `trip_id` 关联 `trips.id`；`tripId` 默认 `seoul-2026`，可在编辑中心修改。

## 2. 同步策略

- `trips.data` 保存完整可编辑状态（行程/提醒/预算/账本/基础资料），保证离线缓存和云恢复一致
- 各业务表（hotels/flights/events/expenses/trip_members）由同一份状态映射生成，供后续功能直接查询
- `updated_at` 用于判断新旧：远端较新 → 拉取覆盖本地；本地较新 → 推送覆盖云端
- localStorage 始终作为离线缓存；未配置 Supabase 时完全走本地，不报错

## 3. 启用步骤

1. 在 Supabase 创建项目
2. 打开 SQL Editor，执行 `supabase/schema.sql`
3. 复制 Project URL 和 anon key
4. 网页 → 首页 → 编辑基础资料 → 云同步（Supabase）→ 保存并连接
5. 也可写入 `.env` 的 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`

## 4. 冲突规则

当前采用 last-write-wins（按 `updated_at`）。多人同时编辑时，以最后保存的设备为准。

## 5. 安全说明

`schema.sql` 默认开启了 anon 可读写策略，适合个人旅行数据快速使用。生产环境建议改为 Supabase Auth + RLS 按用户鉴权。
