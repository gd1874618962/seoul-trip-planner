# TODAY_MODE_V2.md

Phase 2.6.1 最近地铁站映射 + 今日模式增强。

## 1. 最近地铁站映射

文件：`src/data/locationStationMap.js`

```javascript
{
  locationId: 'loc-5',
  station: {
    name: '성수역',
    line: '2号线',
    exit: '3号出口'
  },
  walkingMinutes: 5
}
```

- 优先按 `locationId` 关联，不依赖中文名称匹配
- 覆盖：Sophie House、延南洞、弘大各店、YG、明洞、圣水、MUUT 汉南、金浦机场、高阳、仁川机场

## 2. 交通步骤增强

生成路线时自动加入：

```text
🚶 步行8分钟到 홍대입구역 9号出口
🚇 2号线 홍대입구 → 성수
🚶 步行5分钟到达（성수역 3号出口）
```

未收录地点回退“步行至附近地铁站”通用步骤。

## 3. 今日模式逻辑

- 根据当前时间高亮“正在进行”
- 顶部显示“下一步”大卡片：时间、地点、地址、交通、建议出发
- 点击“完成”立即标记 completed，自动切换下一项
- 大字号显示，减少编辑按钮，适合现场查看
- 编辑入口保留为小按钮

## 4. 后续接入 Naver API 方式

- `transportService.js` 的 `naverTransport()` 已预留
- Edge Function `supabase/functions/transport/index.ts` 已支持 Google/Naver
- 接入后真实线路替换 `options.steps`，前端 UI 不变
