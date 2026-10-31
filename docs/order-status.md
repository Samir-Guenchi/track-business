# Order statuses

Source of truth: `packages/contracts/src/orders/order-status.ts` (`ORDER_TRANSITIONS`). The API rejects any move not listed there with `orders.illegal_transition`.

```mermaid
stateDiagram-v2
  [*] --> new
  new --> to_confirm
  new --> confirmed
  new --> cancelled
  to_confirm --> confirmed
  to_confirm --> cancelled
  to_confirm --> unreachable
  to_confirm --> postponed
  unreachable --> to_confirm
  unreachable --> confirmed
  unreachable --> cancelled
  postponed --> to_confirm
  postponed --> confirmed
  postponed --> cancelled
  confirmed --> ready_to_ship
  confirmed --> to_confirm
  confirmed --> cancelled
  ready_to_ship --> shipped
  ready_to_ship --> confirmed
  ready_to_ship --> cancelled
  shipped --> in_transit
  shipped --> out_for_delivery
  shipped --> returning
  in_transit --> out_for_delivery
  in_transit --> delivered
  in_transit --> returning
  out_for_delivery --> delivered
  out_for_delivery --> failed_attempt
  out_for_delivery --> returning
  failed_attempt --> out_for_delivery
  failed_attempt --> returning
  returning --> returned
  delivered --> [*]
  cancelled --> [*]
  returned --> [*]
```

Notes:

- `unreachable -> unreachable` is allowed so each failed call attempt is recorded in the history.
- `in_transit -> delivered` covers stop-desk pickups, which carriers often report without an "out for delivery" scan.
- After `shipped`, an order can no longer be cancelled, only returned.
- Orders are editable (items, customer, prices) only in `new`, `to_confirm`, `unreachable`, `postponed` and `confirmed`.
- Amounts are whole dinars; `codAmount = subtotal + shippingFee - discount` is computed by the server.
