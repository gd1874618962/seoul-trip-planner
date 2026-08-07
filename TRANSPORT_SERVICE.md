# TRANSPORT_SERVICE.md

Phase 2.5.2 交通服务抽象层说明。

## 1. 当前交通流程

```text
行程卡片“生成交通攻略”
        ↓
transportService.generateTransportRoute(origin, destination, { provider })
        ↓
provider = naver ? naverTransport() : estimatedTransport()
        ↓
transportEngine.buildTransportPlan（估算）
        ↓
event.transport { status, provider, origin, destination, options }
```

## 2. Provider 设计

```javascript
provider: 'estimated'   // 当前：规则估算
provider: 'naver'       // 未来：Naver Directions API（通过 Edge Function）
```

- `generateTransportRoute()` 统一入口
- naver provider 未实现时自动回退 estimated
- 结果带有 `provider` 字段，方便前端标注数据来源

## 3. API 接入位置

未来只需修改 `naverTransport()`：

```javascript
async function naverTransport(origin, destination) {
  // 调用 Supabase Edge Function /transport
  // 返回 { status, options: [...] }
}
```

前端结构与 UI 不需要改动。

## 4. 缓存策略

- 内存缓存：`Map<originId|destinationId, result>`
- key = `origin.locationId|destination.locationId`
- 交通路线变化频率低，适合缓存
- 未来迁移：同 key 存 Supabase，跨设备共享缓存

## 5. 兼容性

- 旧 event 无 `transport` 字段：不报错
- 旧 event `transport` 为字符串：继续按旧样式显示
- 生成结果写入 `transport` 对象：显示攻略卡片

## 6. Phase 2.5.3 部署与配置（Google 优先）

Edge Function 代码已就绪：`supabase/functions/transport/index.ts`

### 需要你做的步骤

1. **Google Cloud 申请密钥（推荐）**
   - 打开 https://console.cloud.google.com
   - 新建项目 → 启用 **Directions API**
   - 凭据 → 创建 API Key，并限制为“仅服务端使用”
   - 复制 API Key

   Naver 密钥可选（需要韩国实名认证，通常外国人无法申请）。

2. **部署 Edge Function（两种方式任选）**
   - Supabase 控制台：Functions → 新建/部署 `transport`，上传 `supabase/functions/transport/index.ts`
   - 或 CLI：`supabase functions deploy transport`

3. **配置 Secrets**
   - CLI：`supabase secrets set GOOGLE_MAPS_API_KEY=xxx`
   - Naver 可选：`NAVER_CLIENT_ID=xxx NAVER_CLIENT_SECRET=xxx`

4. **验证**
   - 网页里点“生成交通攻略”，如果函数和密钥正常，会返回真实公共交通线路；失败自动回退估算
