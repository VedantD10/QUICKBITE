# QuickBite System Architecture

## Architectural Layers
```
+-------------------------------------------------------------------------+
|                        REACT 18 SPA FRONTEND                            |
|  [Customer Dashboard]  [Restaurant KDS]  [Rider App]  [Admin Console]    |
+-------------------------------------------------------------------------+
                                 |  ^
             REST API (HTTP/JSON) |  | WebSockets (Socket.IO)
                                 v  |
+-------------------------------------------------------------------------+
|                    NODE.JS + EXPRESS BACKEND API                        |
|  [Auth Middleware] [Controllers] [Services] [Socket Event Handler]      |
+-------------------------------------------------------------------------+
                                 |
                                 v
+-------------------------------------------------------------------------+
|                    ATOMIC DATABASE ENGINE (db.js)                       |
|  - Dual Mode: Disk (db.json) OR Vercel In-Memory Snapshot               |
|  - Concurrency Lock Queue (db.transaction)                              |
+-------------------------------------------------------------------------+
```
