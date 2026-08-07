# TRANSPORT_API_ANALYSIS.md

自动交通攻略 API 方案分析（Phase 2.5.1 第一步，仅分析，不写业务代码）。

## 1. 候选方案对比

| 维度 | Naver Maps API | Kakao Mobility API | Google Directions API |
| --- | --- | --- | --- |
| 韩国地铁支持 | 强（本地数据，含线路/换乘/出口） | 中（Mobility 主推驾车/拼车，公共交通接口对个人不友好） | 强（Seoul 地铁数据完整） |
| 公共交通路线 | 支持 대중교통（地铁+公交+步行组合） | 有限，需企业认证 | 支持，步行+地铁组合好 |
| 步行+地铁组合 | 支持 | 支持有限 | 支持 |
| API 费用 | 有免费额度，超量计费；个人项目通常够用 | 按调用计费，个人申请门槛高 | 每月 $200 免费额度，之后按量计费，需绑卡 |
| 企业认证 | 不需要，Naver Cloud 个人账号即可 | 需要企业/事业者认证（개인 불가） | 不需要，但需 Google Cloud 绑信用卡 |
| 前端直接调用 | 不适合（Directions REST 需要 Client Secret，会暴露） | 不适合（同样需服务端密钥） | 不适合（Server Key 暴露会被盗刷） |
| 是否需要后端代理 | 需要（推荐 Supabase Edge Function） | 需要 | 需要 |
| 国内网络访问 | Naver 相对可用 | 可用性一般 | 国内不稳定，需梯子 |
| 韩国本地准确性 | 最好（韩文地址、站名、出口、实时性） | 好 | 好 |

## 2. 推荐方案

**主方案：Naver Maps Directions API + Supabase Edge Function 代理**

原因：

- 韩国地铁和公交数据最准确，站名、线路、换乘、出口信息齐全
- 个人 Naver Cloud 账号即可开通，不需要企业认证
- 免费额度对个人旅行 App 足够
- 密钥放 Edge Function 环境变量，不暴露到前端
- 已有一个 Supabase 项目，直接加一个 Edge Function 即可

**兜底方案：规则估算 + Naver 网页导航**

- 无网络 / API 失败 / 无坐标时，继续用当前规则估算（时间、费用）
- 同时提供 Naver 网页导航链接，用户一键打开真实导航
- 保证“没有自动路线时不影响使用”

## 3. 接入步骤

1. Naver Cloud 控制台注册：https://www.ncloud.com
2. Services → Maps（지도/Map）→ 创建 Application，复制 Client ID 和 Client Secret
3. Supabase → Functions → 新建 Edge Function `transport`
4. 把 Naver Client ID / Secret 存为 Edge Function 环境变量（Secret）
5. Edge Function 接收 origin/destination 坐标，调用 Naver Directions（대중교통），把结果规范化为前端 transport 结构
6. 前端调用 `supabase.functions.invoke('transport', ...)`，失败时回退规则估算
7. 结果可缓存在 Supabase（按起终点哈希），减少重复调用和配额消耗

## 4. 风险与对策

| 风险 | 对策 |
| --- | --- |
| 密钥暴露 | 密钥只放 Edge Function 环境变量，前端永不接触 |
| CORS | 由 Edge Function 服务端调用，无浏览器 CORS 问题 |
| 配额超限 | 结果缓存 + 规则兜底 + 显示“使用地图导航” |
| API 返回异常/无坐标 | 显示“暂无自动路线，请使用地图导航”，不影响页面 |
| 冷启动延迟 | Edge Function 首次调用较慢，前端显示加载态并兜底 |
| 费用失控 | 个人免费额度内使用；可设调用频率限制 |

## 5. 结论

- 不推荐前端直连任何 Directions API
- 推荐 Naver + Supabase Edge Function：数据最准、门槛最低、密钥安全
- 若以后需要多国行程，再考虑 Google Directions（通过同一 Edge Function 抽象切换）

## 6. 后续数据结构（开发阶段参考）

```javascript
event.transport = {
  status: 'generated' | 'manual' | 'fallback',
  origin: { name, lat, lng },
  destination: { name, lat, lng },
  options: [
    { type: 'subway', duration, costKRW, steps: [...] },
    { type: 'taxi', duration, costKRW },
    { type: 'walking', duration, distanceM }
  ]
}
```
