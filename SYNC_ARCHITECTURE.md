# SYNC_ARCHITECTURE.md

## 1. 当前同步架构

```text
用户修改
   ↓
store.js save*()
   ↓
localStorage（立即保存，离线缓存）
   ↓
scheduleCloudPush（1.5s 防抖）
   ↓
Supabase REST（upsert trips + 子表）
   ↓
syncStatus: syncing → success / error
```

```text
启动 / 每 5 秒轮询
   ↓
读取本地缓存
   ↓
请求 Supabase trips?id=eq.{tripId}
   ↓
比较 updated_at
   ↓
远端新 → 拉取覆盖本地；本地新 → 推送覆盖远端
```

## 2. 数据流

- 页面 → `store.js` getters → localStorage（即时渲染）
- `store.js` → `supabase.js` → Supabase REST（后台同步）
- Supabase 返回的 `trips.data`（JSONB）是完整状态快照，用于跨设备恢复

## 3. localStorage 作用

- 离线缓存：无网或未配置 Supabase 时应用完全可用
- 即时响应：所有编辑先写本地，不等待网络
- 兼容旧数据：读取时自动补 id，旧键名继续生效

## 4. Supabase 作用

- 云端持久化：跨设备共享数据
- 关系表：trips / trip_members / hotels / locations / flights / events / expenses
- 时间戳：`updated_at` 作为冲突依据

## 5. 冲突解决策略

- last-write-wins：按 `updated_at` 比较，较新的一方覆盖
- 多人同时编辑时以最后保存设备为准
- 失败时保留本地数据，不覆盖

## 6. 环境变量配置

复制 `.env.example` 为 `.env.local`：

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

代码读取 `import.meta.env.VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`；网页编辑中心的“云同步（Supabase）”手动配置优先于环境变量。真实 key 不写入源码。

## 7. 部署注意事项

- GitHub Pages 构建时需在 CI 注入 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- 本地手动配置会保存在浏览器 localStorage，不上传到代码仓库
- 公网版未配置云同步时使用 localStorage，各设备数据独立
- 配置云同步后，公网版所有设备共享同一 Supabase 数据

## 8. syncStatus

| 状态 | 含义 |
| --- | --- |
| idle | 待同步 |
| syncing | 正在同步 |
| success | 已同步 |
| error | 同步失败，使用本地缓存 |
| offline | 未配置云同步/离线模式 |
