# QuickBite Order State Machine Specification

```
[PLACED] -> [RESTAURANT_ACCEPTED] -> [PREPARING] -> [READY_FOR_PICKUP] -> [DELIVERY_ASSIGNED] -> [PICKED_UP] -> [OUT_FOR_DELIVERY] -> [DELIVERED] -> [COMPLETED]
```

## Transition Constraints
- Cancellation allowed ONLY when status is `PLACED` or `RESTAURANT_ACCEPTED`.
- State transitions strictly validated against `ALLOWED_TRANSITIONS` map in `orderService.js`.
