export const PRODUCT_LIMIT = 3

export function soldQuantity(customers, productId) {
  return (customers || []).reduce(
    (sum, customer) =>
      sum +
      (customer.orders || []).reduce(
        (s, order) => s + (order.productId === productId ? order.quantity : 0),
        0,
      ),
    0,
  )
}

export function remaining(customers, productId) {
  return Math.max(0, PRODUCT_LIMIT - soldQuantity(customers, productId))
}

export function canAdd(customers, productId) {
  return remaining(customers, productId) > 0
}

export function maxAddable(customers, productId) {
  return remaining(customers, productId)
}
