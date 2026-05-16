# API Design — REST, gRPC, GraphQL, Rate Limiting, Pagination

---

## 1. REST

### Principles
- **Stateless**: Each request contains all info needed; server stores no client state
- **Resource-based**: URLs represent resources (nouns), not actions (verbs)
- **HTTP methods** define actions
- **Uniform interface**: Consistent conventions

### HTTP Methods
| Method | Action | Idempotent | Safe |
|---|---|---|---|
| GET | Read resource | ✓ | ✓ |
| POST | Create resource | ✗ | ✗ |
| PUT | Replace resource (full update) | ✓ | ✗ |
| PATCH | Partial update | ✗ | ✗ |
| DELETE | Delete resource | ✓ | ✗ |

### HTTP Status Codes
| Code | Meaning |
|---|---|
| 200 OK | Success |
| 201 Created | Resource created |
| 204 No Content | Success, no body |
| 400 Bad Request | Invalid input |
| 401 Unauthorized | Not authenticated |
| 403 Forbidden | Authenticated but not authorized |
| 404 Not Found | Resource doesn't exist |
| 409 Conflict | State conflict (e.g., duplicate) |
| 422 Unprocessable Entity | Validation error |
| 429 Too Many Requests | Rate limited |
| 500 Internal Server Error | Server error |
| 503 Service Unavailable | Server overloaded/down |

### REST URL Design
```
# Good
GET    /users/{id}
POST   /users
PUT    /users/{id}
DELETE /users/{id}
GET    /users/{id}/orders
POST   /users/{id}/orders

# Bad
GET    /getUser?id=123
POST   /createUser
GET    /user/delete/123
```

### REST Best Practices
- Use nouns, not verbs in URLs
- Use plural nouns (`/users`, not `/user`)
- Version your API (`/v1/users`)
- Use query params for filtering/sorting/pagination
- Return consistent error format
- Use HTTPS always

---

## 2. gRPC

### What it is
- Google's RPC framework using Protocol Buffers (protobuf) for serialization
- Binary protocol (smaller, faster than JSON)
- HTTP/2 (multiplexing, streaming, header compression)
- Strongly typed contracts via `.proto` files

### When to use gRPC
- Internal microservice communication (not public APIs)
- High performance, low latency requirements
- Streaming (server-side, client-side, bidirectional)
- Polyglot environments (auto-generates client code in many languages)

### gRPC vs REST
| | gRPC | REST |
|---|---|---|
| Protocol | HTTP/2 | HTTP/1.1 or HTTP/2 |
| Serialization | Protobuf (binary) | JSON (text) |
| Contract | Strict (.proto) | Loose (OpenAPI optional) |
| Browser support | Limited | Full |
| Streaming | Native | Limited (SSE, WebSockets) |
| Performance | Faster | Slower |
| Use case | Internal services | Public APIs |

---

## 3. GraphQL

### What it is
- Query language for APIs — client specifies exactly what data it needs
- Single endpoint (`/graphql`)
- Reduces over-fetching and under-fetching

### Key Concepts
- **Query**: Read data
- **Mutation**: Write data
- **Subscription**: Real-time updates
- **Schema**: Strongly typed definition of all types and operations
- **Resolver**: Function that fetches data for a field

### When to use GraphQL
- Mobile apps (minimize data transfer)
- Complex, nested data requirements
- Multiple clients with different data needs
- Rapid frontend iteration

### GraphQL vs REST
| | GraphQL | REST |
|---|---|---|
| Endpoints | Single | Multiple |
| Data fetching | Client-specified | Server-defined |
| Over-fetching | None | Common |
| Under-fetching | None | Common (N+1 problem) |
| Caching | Complex (no URL-based) | Simple (HTTP cache) |
| Learning curve | Higher | Lower |

### N+1 Problem in GraphQL
- Fetching a list of users, then fetching each user's posts separately = N+1 queries
- **Solution**: DataLoader (batches and caches DB calls)

---

## 4. WebSockets

### When to use
- Real-time bidirectional communication
- Chat applications, live notifications, collaborative editing, live sports scores

### How it works
- HTTP upgrade handshake → persistent TCP connection
- Full-duplex: server can push to client without client polling
- Lower overhead than HTTP polling

### WebSocket vs SSE vs Long Polling
| | WebSocket | SSE | Long Polling |
|---|---|---|---|
| Direction | Bidirectional | Server → Client | Server → Client |
| Protocol | WS/WSS | HTTP | HTTP |
| Complexity | Higher | Low | Low |
| Use case | Chat, gaming | Notifications, feeds | Simple real-time |

---

## 5. Rate Limiting

### Why
- Prevent abuse and DDoS
- Ensure fair usage
- Protect downstream services

### Algorithms

#### Token Bucket
- Bucket holds N tokens, refilled at rate R tokens/second
- Each request consumes one token
- Allows bursting up to bucket size
- **Most common algorithm**

#### Leaky Bucket
- Requests enter a queue (bucket), processed at fixed rate
- Excess requests dropped or queued
- Smooths out bursts, no burst allowance

#### Fixed Window Counter
- Count requests per fixed time window (e.g., 100 req/minute)
- Simple but edge case: 200 requests possible at window boundary

#### Sliding Window Log
- Store timestamp of each request
- Count requests in last N seconds
- Accurate but memory-intensive

#### Sliding Window Counter
- Hybrid: fixed window + weighted previous window
- Accurate and memory-efficient

### Where to implement
- **API Gateway**: Centralized, before requests reach services
- **Application layer**: Per-user, per-endpoint logic
- **Redis**: Distributed rate limiting across multiple servers

### Rate Limit Response
- Return `429 Too Many Requests`
- Include headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 6. Pagination

### Offset Pagination
```
GET /posts?page=2&limit=20
SELECT * FROM posts LIMIT 20 OFFSET 20
```
- **Pros**: Simple, random access to any page
- **Cons**: Slow for large offsets (DB scans all rows), inconsistent if data changes

### Cursor-Based Pagination
```
GET /posts?cursor=eyJpZCI6MTAwfQ&limit=20
SELECT * FROM posts WHERE id > 100 LIMIT 20
```
- **Pros**: Consistent (no skipped/duplicated items), efficient (index seek)
- **Cons**: No random page access, cursor must be opaque to client
- **Best for**: Infinite scroll, real-time feeds

### Keyset Pagination
- Similar to cursor but uses actual column values
```
GET /posts?after_id=100&limit=20
```
- Efficient with proper index on sort column

### When to use what
- Offset: Admin panels, small datasets, need page numbers
- Cursor/Keyset: Social feeds, large datasets, infinite scroll

---

## 7. API Versioning

### URL Versioning (most common)
```
/v1/users
/v2/users
```
- Pros: Explicit, easy to route, cacheable
- Cons: URL pollution

### Header Versioning
```
Accept: application/vnd.myapi.v2+json
```
- Pros: Clean URLs
- Cons: Less visible, harder to test in browser

### Query Parameter
```
/users?version=2
```
- Pros: Easy to test
- Cons: Can be forgotten, cache issues

---

## 8. API Security

- **Authentication**: Who are you? (JWT, OAuth 2.0, API keys)
- **Authorization**: What can you do? (RBAC, ABAC, scopes)
- **HTTPS**: Always encrypt in transit
- **Input validation**: Validate and sanitize all inputs
- **CORS**: Control which origins can call your API
- **Rate limiting**: Prevent abuse
- **API keys**: Rotate regularly, never in client-side code

---

## Interview Tips

- For any system design, define the API first — it clarifies requirements
- Always mention **versioning** and **pagination** for list endpoints
- Discuss **rate limiting** for any public-facing API
- At senior level: discuss **backward compatibility**, **deprecation strategy**, and **API contract testing**
