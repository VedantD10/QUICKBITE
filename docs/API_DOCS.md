# QuickBite API Documentation

## Base Endpoints
- **Local API Base**: `http://localhost:5000/api`
- **Production API Base**: `https://quickbitecom.vercel.app/api`

## 1. Authentication
- `POST /api/auth/register`: Registers a new user account (CUSTOMER, RESTAURANT, DELIVERY, ADMIN).
- `POST /api/auth/login`: Authenticates credentials & returns JWT bearer token.
- `GET /api/auth/me`: Returns authenticated user profile.

## 2. Customer & Discovery
- `GET /api/restaurants`: Lists approved restaurants with cuisine & search query filtering.
- `GET /api/restaurants/:id`: Returns restaurant details by ID.
- `GET /api/restaurants/:id/menu`: Returns restaurant menu categories & items.
- `GET /api/customer/addresses`: Retrieves customer saved delivery addresses.
- `POST /api/customer/addresses`: Adds a new customer address.
- `POST /api/orders`: Places a new food order with atomic stock check & socket alert.
- `GET /api/orders`: Retrieves order history for authenticated user.
- `DELETE /api/orders/clear`: Purges customer order history.
- `PATCH /api/orders/:id/cancel`: Cancels order & restores inventory (allowed only before PREPARING).
- `POST /api/ratings`: Submits 1-5 star ratings for restaurant & driver.

## 3. Restaurant Operations (KDS)
- `GET /api/restaurant/profile`: Returns owned restaurant profile.
- `PATCH /api/restaurants/:id/status`: Toggles kitchen status (`OPEN`, `CLOSED`, `TEMPORARILY_UNAVAILABLE`).
- `POST /api/menu/items`: Adds a new menu item.
- `PATCH /api/menu/items/:id`: Updates menu item details & stock availability.
- `DELETE /api/menu/items/:id`: Deletes a menu item.
- `GET /api/restaurant/orders`: Retrieves incoming order queue for kitchen.
- `PATCH /api/orders/:id/status`: Advances order status in state machine.
- `GET /api/restaurant/analytics`: Retrieves restaurant revenue & order metrics.

## 4. Delivery Partner (Rider App)
- `GET /api/delivery/profile`: Returns driver profile details.
- `PATCH /api/delivery/status`: Toggles driver online/offline status.
- `GET /api/deliveries/assigned`: Retrieves active delivery trip assignment.
- `POST /api/deliveries/accept`: Claims assigned delivery trip.
- `POST /api/deliveries/reject`: Declines trip and triggers automatic reassignment engine.
- `PATCH /api/deliveries/:orderId/status`: Updates delivery trip state (`PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`).
- `PATCH /api/delivery/location`: Streams driver GPS coordinates (`lat`, `lng`, `speed`).
- `GET /api/delivery/earnings`: Retrieves driver earnings ledger.

## 5. Platform Admin Console
- `GET /api/admin/restaurants/pending`: Lists pending restaurant onboarding applications.
- `PATCH /api/admin/restaurants/:id/approve`: Approves restaurant for platform listing.
- `PATCH /api/admin/restaurants/:id/reject`: Rejects restaurant onboarding application.
- `GET /api/admin/users`: Retrieves platform user directory with search/role filters.
- `PATCH /api/admin/users/:id/suspend`: Toggles user account suspension with reason log.
- `GET /api/admin/orders`: Returns all platform orders across all kitchens.
- `GET /api/admin/complaints`: Returns customer complaints and dispute tickets.
- `PATCH /api/admin/complaints/:id/resolve`: Resolves complaint & logs refund.
- `GET /api/admin/analytics`: Returns platform GMV, revenue, and order metrics.

## 6. System Health
- `GET /health`: Returns JSON status, timestamp, and active entity counts.
