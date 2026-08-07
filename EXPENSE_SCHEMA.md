# EXPENSE_SCHEMA.md

Phase 3.1 旅行账本数据结构。

## 1. Expense 对象

```javascript
expense {
  id,                 // "exp-xxx"
  tripId,             // "seoul-2026"
  date,               // "2026-08-22"
  merchant,           // 店名/商家
  category,           // 餐饮/购物/交通/住宿/娱乐/门票/其他
  amountKRW,          // 韩元金额
  amountRMB,          // 人民币金额
  exchangeRate,       // 记录时的汇率（1 RMB ≈ N KRW）
  payer,              // 支付人 traveler id
  participants,       // 参与人 traveler id 数组
  note,
  type,               // expense | income（兼容旧数据）
  createdAt,
  updatedAt
}
```

## 2. 账本状态

```javascript
ledgerState {
  exchangeRate,       // 可配置，默认 187.5
  entries: [expense]
}
```

## 3. 汇率换算

- 输入韩元：`amountRMB = round(amountKRW / exchangeRate)`
- 输入人民币：`amountKRW = round(amountRMB * exchangeRate)`
- 汇率不写死，可在账本页顶部修改，并随记录保存

## 4. AA 计算（两人）

```text
应承担(i) = Σ 参与i的支出金额 / 该笔参与人数
实际支付(i) = Σ 支付人为i的支出金额
补差(i) = 实际支付(i) - 应承担(i)
补差 > 0 → 应收回；补差 < 0 → 应补出
```

## 5. Supabase 映射

`expenses` 表新增字段：`merchant`、`participants`(jsonb)、`note`、`exchange_rate`、`updated_at`；同步仍通过 `trips.data` 保存完整账本状态，保证离线恢复一致。
