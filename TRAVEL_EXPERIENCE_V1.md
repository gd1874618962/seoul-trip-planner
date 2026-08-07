# TRAVEL_EXPERIENCE_V1.md

Phase 2.5 旅行体验优化说明。

## 1. 地点数据

每个 location 新增三个字段：

```javascript
location {
  displayName,        // 页面显示名称
  officialAddress,    // 导航用正式地址
  coordinates: { lat, lng },
  ...旧字段（name/address/lat/lng 保留兼容）
}
```

- 页面列表/标记显示 `displayName`
- 地图标记使用 `coordinates`
- Naver 导航链接使用 `officialAddress`

## 2. 交通规则自动生成

每个 event 根据 `transportMode` 自动补充：

| transportMode | 默认时间 | 默认费用 |
| --- | --- | --- |
| walking | 约 15 分钟 | 免费 |
| subway / transit | 约 25 分钟 | 约 1,450 KRW |
| taxi | 约 20 分钟 | 约 15,000 KRW |
| other | 约 20 分钟 | — |

字段：`transportEta`、`transportCostEstimate`；用户手动填写的值优先。第一版为规则估算，不接第三方导航 API。

## 3. 行程状态

```javascript
event.status = 'planned' | 'completed'
```

- 编辑模式可“标记完成 / 恢复计划”
- 已完成条目置灰、标题划线
- 当天横幅显示“已完成 x/n”

## 4. 建议出发时间

根据上一站的交通时间和本事件开始时间自动计算：

```text
建议出发时间 = 本事件开始时间 - 上一站交通时长
```

显示在事件卡片上；无数字时间的条目不显示。

## 5. 餐厅图片预留

```javascript
restaurant.imageQuery
```

每个餐厅已配置搜索词（如 `명동 감자탕 명동9길43`），供未来图片 API 使用。不爬取图片，不新增依赖。
