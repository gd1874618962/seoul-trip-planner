# TRANSPORT_SYSTEM.md

Phase 2.5.1 交通攻略系统说明。

## 1. 数据结构

```javascript
event.transport = {
  status: 'estimated',           // 后续接 API 后为 'generated'
  origin: { name, lat, lng },
  destination: { name, lat, lng },
  options: [
    {
      type: 'subway' | 'taxi' | 'walking',
      duration: '约 25 分钟',
      costKRW: '约 1,450 KRW',
      steps: [
        { mode: 'walk', description: '步行至附近地铁站' },
        { mode: 'subway', line: '地铁', from: '附近地铁站', to: '目的地附近地铁站' },
        { mode: 'walk', description: '步行至目的地' }
      ]
    }
  ]
}
```

兼容旧 event：没有 `transport` 字段或字段为空时不报错。

## 2. 当前实现

- 规则引擎：`src/utils/transportEngine.js`，根据起终点坐标估算距离、时间、费用
- 生成入口：行程卡片“生成交通攻略”按钮，读取上一节点和当前节点坐标
- 展示：地铁 / 打车 / 步行三张方案卡
- 地图联动：生成的起终点在地图上画推荐连线（橙色虚线）
- 异常处理：无坐标、无网络、生成失败时显示“暂无自动路线，请使用地图导航”

## 3. API 方案（后续接入）

按 `TRANSPORT_API_ANALYSIS.md`，推荐 Naver Maps Directions API + Supabase Edge Function：

1. Naver Cloud 创建 Maps Application，获取 Client ID / Secret
2. Supabase Edge Function `transport` 调用 Naver Directions
3. 前端调用 Edge Function，把真实线路写入 `transport.options`
4. 失败回退当前估算方案

## 4. 后续扩展

- 真实线路/换乘/站名：接入 Naver 后替换 steps
- 缓存：按起终点哈希缓存到 Supabase
- 多模式比较：公交/地铁/驾车同时展示
- 与地图路线联动：真实线路坐标画到 Leaflet/Naver 地图
