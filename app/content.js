// Auto-generated content file

CONTENT['lld_03'] = `# OOD Problems — Worked Solutions

---

## Framework for LLD Interviews

1. **Clarify requirements** (2 min): Functional scope, constraints
2. **Identify entities** (3 min): Nouns in requirements → classes
3. **Define relationships** (3 min): Associations, inheritance, composition
4. **Define interfaces/abstractions** (3 min): What varies? Abstract it.
5. **Write core classes** (15 min): Key methods, fields
6. **Apply design patterns** (5 min): Where do they fit?
7. **Discuss extensibility** (2 min): How would you add feature X?

---

## 1. Parking Lot

### Requirements
- Multiple floors, multiple spots per floor
- Spot types: Motorcycle, Compact, Large
- Vehicle types: Motorcycle, Car, Truck
- Issue ticket on entry, calculate fee on exit
- Find available spot

### Entities
\`\`\`
ParkingLot, Floor, ParkingSpot, Vehicle, Ticket, FeeCalculator
\`\`\`

### Design
\`\`\`java
enum SpotType { MOTORCYCLE, COMPACT, LARGE }
enum VehicleType { MOTORCYCLE, CAR, TRUCK }

abstract class Vehicle {
    protected String licensePlate;
    protected VehicleType type;
    public abstract SpotType requiredSpotType();
}

class Car extends Vehicle {
    public Car(String plate) { this.licensePlate = plate; this.type = VehicleType.CAR; }
    public SpotType requiredSpotType() { return SpotType.COMPACT; }
}

class Truck extends Vehicle {
    public SpotType requiredSpotType() { return SpotType.LARGE; }
}

class ParkingSpot {
    private int id;
    private SpotType type;
    private boolean occupied;
    private Vehicle currentVehicle;
    
    public boolean canFit(Vehicle v) {
        return !occupied && type == v.requiredSpotType();
    }
    
    public void park(Vehicle v) { this.currentVehicle = v; this.occupied = true; }
    public Vehicle remove() { 
        Vehicle v = currentVehicle; 
        currentVehicle = null; 
        occupied = false; 
        return v; 
    }
}

class Ticket {
    private String ticketId;
    private Vehicle vehicle;
    private ParkingSpot spot;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
}

interface FeeStrategy {
    double calculate(Ticket ticket);
}

class HourlyFeeStrategy implements FeeStrategy {
    private double ratePerHour;
    public double calculate(Ticket ticket) {
        long hours = ChronoUnit.HOURS.between(ticket.getEntryTime(), ticket.getExitTime());
        return Math.max(1, hours) * ratePerHour;
    }
}

class ParkingFloor {
    private int floorNumber;
    private List<ParkingSpot> spots;
    
    public Optional<ParkingSpot> findAvailableSpot(Vehicle vehicle) {
        return spots.stream()
                    .filter(s -> s.canFit(vehicle))
                    .findFirst();
    }
}

class ParkingLot {
    private List<ParkingFloor> floors;
    private FeeStrategy feeStrategy;
    private Map<String, Ticket> activeTickets; // ticketId -> Ticket
    
    public Ticket parkVehicle(Vehicle vehicle) {
        for (ParkingFloor floor : floors) {
            Optional<ParkingSpot> spot = floor.findAvailableSpot(vehicle);
            if (spot.isPresent()) {
                spot.get().park(vehicle);
                Ticket ticket = new Ticket(vehicle, spot.get());
                activeTickets.put(ticket.getId(), ticket);
                return ticket;
            }
        }
        throw new ParkingLotFullException();
    }
    
    public double exitVehicle(String ticketId) {
        Ticket ticket = activeTickets.remove(ticketId);
        ticket.setExitTime(LocalDateTime.now());
        ticket.getSpot().remove();
        return feeStrategy.calculate(ticket);
    }
}
\`\`\`

### Design Patterns Used
- **Strategy**: FeeStrategy (hourly, flat rate, weekend pricing)
- **Factory**: VehicleFactory to create vehicle types
- **Template Method**: Base fee calculation with overridable steps

---

## 2. Elevator System

### Requirements
- N elevators, M floors
- Request elevator from floor (up/down)
- Elevator moves to requested floor, opens doors
- Optimize for minimal wait time

### Entities
\`\`\`
ElevatorSystem, Elevator, Request, ElevatorController, Direction
\`\`\`

### Design
\`\`\`java
enum Direction { UP, DOWN, IDLE }
enum ElevatorState { MOVING, STOPPED, MAINTENANCE }

class Request {
    private int floor;
    private Direction direction; // External request (from floor)
    // OR
    private int destinationFloor; // Internal request (from inside elevator)
}

class Elevator {
    private int id;
    private int currentFloor;
    private Direction direction;
    private ElevatorState state;
    private TreeSet<Integer> upQueue;   // Floors to stop going up
    private TreeSet<Integer> downQueue; // Floors to stop going down
    
    public void addRequest(int floor) {
        if (floor > currentFloor) upQueue.add(floor);
        else downQueue.add(floor);
    }
    
    public void move() {
        if (direction == Direction.UP && !upQueue.isEmpty()) {
            currentFloor = upQueue.first();
            upQueue.remove(currentFloor);
            openDoors();
        } else if (direction == Direction.DOWN && !downQueue.isEmpty()) {
            currentFloor = downQueue.last();
            downQueue.remove(currentFloor);
            openDoors();
        } else {
            // Switch direction or go idle
            if (!downQueue.isEmpty()) direction = Direction.DOWN;
            else if (!upQueue.isEmpty()) direction = Direction.UP;
            else direction = Direction.IDLE;
        }
    }
    
    public int distanceTo(int floor) {
        return Math.abs(currentFloor - floor);
    }
}

interface ElevatorSelectionStrategy {
    Elevator selectElevator(List<Elevator> elevators, Request request);
}

class NearestElevatorStrategy implements ElevatorSelectionStrategy {
    public Elevator selectElevator(List<Elevator> elevators, Request request) {
        return elevators.stream()
            .filter(e -> e.getState() != ElevatorState.MAINTENANCE)
            .min(Comparator.comparingInt(e -> e.distanceTo(request.getFloor())))
            .orElseThrow();
    }
}

class ElevatorController {
    private List<Elevator> elevators;
    private ElevatorSelectionStrategy strategy;
    
    public void handleExternalRequest(int floor, Direction direction) {
        Request request = new Request(floor, direction);
        Elevator elevator = strategy.selectElevator(elevators, request);
        elevator.addRequest(floor);
    }
    
    public void handleInternalRequest(int elevatorId, int destinationFloor) {
        elevators.get(elevatorId).addRequest(destinationFloor);
    }
}
\`\`\`

### Algorithm: SCAN (Elevator Algorithm)
- Move in one direction, stop at all requested floors
- At end, reverse direction
- Like a disk scheduling algorithm

---

## 3. Chess Game

### Requirements
- 8x8 board, two players
- All piece types with valid moves
- Check, checkmate detection
- Turn management

### Entities
\`\`\`
Game, Board, Piece (King, Queen, Rook, Bishop, Knight, Pawn), Player, Move, Cell
\`\`\`

### Design
\`\`\`java
enum Color { WHITE, BLACK }
enum PieceType { KING, QUEEN, ROOK, BISHOP, KNIGHT, PAWN }

class Cell {
    private int row, col;
    private Piece piece;
    
    public boolean isEmpty() { return piece == null; }
}

abstract class Piece {
    protected Color color;
    protected PieceType type;
    
    public abstract List<Cell> getValidMoves(Board board, Cell currentCell);
    
    protected boolean isValidPosition(int row, int col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

class Rook extends Piece {
    public List<Cell> getValidMoves(Board board, Cell currentCell) {
        List<Cell> moves = new ArrayList<>();
        int[][] directions = {{0,1},{0,-1},{1,0},{-1,0}};
        
        for (int[] dir : directions) {
            int r = currentCell.getRow() + dir[0];
            int c = currentCell.getCol() + dir[1];
            while (isValidPosition(r, c)) {
                Cell cell = board.getCell(r, c);
                if (cell.isEmpty()) {
                    moves.add(cell);
                } else {
                    if (cell.getPiece().getColor() != this.color) moves.add(cell); // Capture
                    break; // Blocked
                }
                r += dir[0]; c += dir[1];
            }
        }
        return moves;
    }
}

class Board {
    private Cell[][] cells = new Cell[8][8];
    
    public void movePiece(Cell from, Cell to) {
        to.setPiece(from.getPiece());
        from.setPiece(null);
    }
    
    public boolean isInCheck(Color color) {
        Cell kingCell = findKing(color);
        // Check if any opponent piece can move to king's cell
        return getAllPieces(color.opposite()).stream()
            .anyMatch(p -> p.getValidMoves(this, p.getCell()).contains(kingCell));
    }
}

class Game {
    private Board board;
    private Player[] players = new Player[2];
    private int currentPlayerIndex = 0;
    private GameStatus status;
    
    public boolean makeMove(Cell from, Cell to) {
        Player current = players[currentPlayerIndex];
        Piece piece = from.getPiece();
        
        if (piece == null || piece.getColor() != current.getColor()) return false;
        if (!piece.getValidMoves(board, from).contains(to)) return false;
        
        board.movePiece(from, to);
        
        if (board.isInCheck(current.getColor())) {
            board.undoMove(); // Can't leave own king in check
            return false;
        }
        
        Color opponent = current.getColor().opposite();
        if (board.isCheckmate(opponent)) status = GameStatus.CHECKMATE;
        else if (board.isStalemate(opponent)) status = GameStatus.STALEMATE;
        
        currentPlayerIndex = 1 - currentPlayerIndex;
        return true;
    }
}
\`\`\`

---

## 4. Hotel Booking System

### Requirements
- Search available rooms by date range, type
- Book room, cancel booking
- Multiple room types (single, double, suite)
- Pricing varies by room type and season

### Design
\`\`\`java
enum RoomType { SINGLE, DOUBLE, SUITE }
enum BookingStatus { CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT }

class Room {
    private int roomNumber;
    private RoomType type;
    private double basePrice;
    private boolean available;
}

class Booking {
    private String bookingId;
    private Guest guest;
    private Room room;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private BookingStatus status;
    private double totalPrice;
}

interface PricingStrategy {
    double calculatePrice(Room room, LocalDate checkIn, LocalDate checkOut);
}

class SeasonalPricingStrategy implements PricingStrategy {
    public double calculatePrice(Room room, LocalDate checkIn, LocalDate checkOut) {
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        double multiplier = isPeakSeason(checkIn) ? 1.5 : 1.0;
        return room.getBasePrice() * nights * multiplier;
    }
}

class HotelBookingSystem {
    private List<Room> rooms;
    private List<Booking> bookings;
    private PricingStrategy pricingStrategy;
    
    public List<Room> searchAvailableRooms(RoomType type, LocalDate checkIn, LocalDate checkOut) {
        return rooms.stream()
            .filter(r -> r.getType() == type)
            .filter(r -> isAvailable(r, checkIn, checkOut))
            .collect(Collectors.toList());
    }
    
    private boolean isAvailable(Room room, LocalDate checkIn, LocalDate checkOut) {
        return bookings.stream()
            .filter(b -> b.getRoom().equals(room))
            .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
            .noneMatch(b -> datesOverlap(b.getCheckIn(), b.getCheckOut(), checkIn, checkOut));
    }
    
    public Booking bookRoom(Guest guest, Room room, LocalDate checkIn, LocalDate checkOut) {
        if (!isAvailable(room, checkIn, checkOut)) throw new RoomNotAvailableException();
        
        double price = pricingStrategy.calculatePrice(room, checkIn, checkOut);
        Booking booking = new Booking(generateId(), guest, room, checkIn, checkOut, price);
        bookings.add(booking);
        return booking;
    }
    
    public void cancelBooking(String bookingId) {
        bookings.stream()
            .filter(b -> b.getId().equals(bookingId))
            .findFirst()
            .ifPresent(b -> b.setStatus(BookingStatus.CANCELLED));
    }
}
\`\`\`

---

## 5. Splitwise (Expense Sharing)

### Requirements
- Add expense, split among group members
- Track who owes whom
- Settle up (minimize transactions)

### Design
\`\`\`java
enum SplitType { EQUAL, EXACT, PERCENTAGE }

abstract class Split {
    protected User user;
    protected double amount;
}

class EqualSplit extends Split { /* amount = total / n */ }
class ExactSplit extends Split { /* amount specified */ }
class PercentageSplit extends Split { /* amount = total * percentage / 100 */ }

class Expense {
    private String id;
    private User paidBy;
    private double amount;
    private String description;
    private List<Split> splits;
    private LocalDateTime createdAt;
}

class Group {
    private String id;
    private String name;
    private List<User> members;
    private List<Expense> expenses;
    
    // Net balance: positive = owed to you, negative = you owe
    public Map<User, Double> getBalances() {
        Map<User, Double> balances = new HashMap<>();
        
        for (Expense expense : expenses) {
            User payer = expense.getPaidBy();
            balances.merge(payer, expense.getAmount(), Double::sum);
            
            for (Split split : expense.getSplits()) {
                balances.merge(split.getUser(), -split.getAmount(), Double::sum);
            }
        }
        return balances;
    }
    
    // Minimize number of transactions to settle all debts
    public List<Transaction> minimizeTransactions() {
        Map<User, Double> balances = getBalances();
        
        // Separate creditors (positive) and debtors (negative)
        PriorityQueue<Map.Entry<User, Double>> creditors = 
            new PriorityQueue<>((a, b) -> Double.compare(b.getValue(), a.getValue()));
        PriorityQueue<Map.Entry<User, Double>> debtors = 
            new PriorityQueue<>((a, b) -> Double.compare(a.getValue(), b.getValue()));
        
        for (Map.Entry<User, Double> entry : balances.entrySet()) {
            if (entry.getValue() > 0) creditors.add(entry);
            else if (entry.getValue() < 0) debtors.add(entry);
        }
        
        List<Transaction> transactions = new ArrayList<>();
        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            Map.Entry<User, Double> creditor = creditors.poll();
            Map.Entry<User, Double> debtor = debtors.poll();
            
            double amount = Math.min(creditor.getValue(), -debtor.getValue());
            transactions.add(new Transaction(debtor.getKey(), creditor.getKey(), amount));
            
            double creditorRemainder = creditor.getValue() - amount;
            double debtorRemainder = debtor.getValue() + amount;
            
            if (creditorRemainder > 0.01) creditors.add(Map.entry(creditor.getKey(), creditorRemainder));
            if (debtorRemainder < -0.01) debtors.add(Map.entry(debtor.getKey(), debtorRemainder));
        }
        return transactions;
    }
}
\`\`\`

---

## Interview Tips

- Start with **use cases**, not classes — "What does the system need to do?"
- Use **interfaces** for anything that might vary (pricing, selection strategy)
- Show **extensibility** — "If we wanted to add a new vehicle type, we'd just add a new class"
- At senior level: discuss **concurrency** — what if two users book the same room simultaneously? (optimistic locking, DB transactions)
- Mention **edge cases**: What if elevator is in maintenance? What if parking lot is full?
`;

CONTENT['hld_07'] = `# System Design Worked Examples

---

## Framework (Use Every Time)

1. **Clarify requirements** (5 min): Functional + non-functional
2. **Estimate scale** (3 min): QPS, storage, bandwidth
3. **Define API** (5 min): Key endpoints
4. **Data model** (5 min): Schema, DB choice
5. **High-level design** (10 min): Components and data flow
6. **Deep dive** (15 min): 1–2 critical components
7. **Trade-offs** (5 min): What you'd do differently at different scales

---

## 1. URL Shortener (TinyURL)

### Requirements
- Functional: Shorten URL, redirect to original, custom aliases (optional)
- Non-functional: 100M URLs/day, low latency reads, high availability

### Estimation
- Write: 100M/day = ~1200 QPS
- Read: 10:1 read/write = 12,000 QPS
- Storage: 100M × 500 bytes = 50 GB/day

### API
\`\`\`
POST /shorten { url, custom_alias? } → { short_url }
GET /{short_code} → 301/302 redirect
\`\`\`

### Data Model
\`\`\`
urls table:
  short_code  VARCHAR(8) PK
  long_url    TEXT
  created_at  TIMESTAMP
  expires_at  TIMESTAMP
  user_id     BIGINT
\`\`\`

### Short Code Generation
- **Option 1**: Hash (MD5/SHA256) of long URL → take first 7 chars → collision check
- **Option 2**: Base62 encode auto-increment ID (a-z, A-Z, 0-9 = 62 chars, 7 chars = 62^7 = 3.5 trillion)
- **Option 3**: Pre-generate random codes, store in pool

### Architecture
\`\`\`
Client → CDN → Load Balancer → API Servers → Cache (Redis) → DB (MySQL)
\`\`\`
- Cache: Store short_code → long_url mappings (high read:write ratio)
- 301 vs 302: 301 (permanent, browser caches) vs 302 (temporary, always hits server — better for analytics)

### Deep Dive: Avoiding Collisions
- Use distributed ID generator (Snowflake) for unique IDs
- Base62 encode the ID → guaranteed unique, no collision check needed

---

## 2. Twitter / News Feed

### Requirements
- Functional: Post tweet, follow users, view home timeline
- Non-functional: 300M DAU, 50K QPS reads, eventual consistency OK for feed

### Fan-out Strategies

#### Fan-out on Write (Push)
- When user tweets, push to all followers' feed caches immediately
- **Pros**: Fast reads (pre-computed feed)
- **Cons**: Expensive for celebrities (millions of followers), wasted work for inactive users

#### Fan-out on Read (Pull)
- When user opens feed, fetch tweets from all followed users
- **Pros**: No wasted work, simple writes
- **Cons**: Slow reads (N queries for N followees)

#### Hybrid (Twitter's actual approach)
- Regular users: fan-out on write
- Celebrities (>10K followers): fan-out on read
- Merge celebrity tweets at read time

### Data Model
\`\`\`
users: user_id, username, follower_count
tweets: tweet_id, user_id, content, created_at
follows: follower_id, followee_id
feed_cache: user_id → [tweet_ids] (Redis sorted set by timestamp)
\`\`\`

### Architecture
\`\`\`
Post Tweet:
  API → Tweet Service → DB + Message Queue
  Message Queue → Fan-out Service → Update follower feed caches

Read Feed:
  API → Feed Service → Redis (feed cache) → Tweet Service (fetch content)
\`\`\`

---

## 3. WhatsApp / Chat System

### Requirements
- Functional: 1:1 messaging, group chat, online status, message delivery receipts
- Non-functional: Low latency (<100ms), 50B messages/day, message ordering

### Connection Management
- **WebSocket**: Persistent connection for real-time messaging
- Each chat server maintains WebSocket connections
- Connection service maps user_id → server

### Message Flow (1:1)
\`\`\`
Sender → WebSocket → Chat Server A
Chat Server A → Message Queue (Kafka)
Message Queue → Chat Server B (receiver's server)
Chat Server B → WebSocket → Receiver
\`\`\`

### Message Storage
- **Recent messages**: Cassandra (high write throughput, time-series)
- **Media**: S3 + CDN
- Message ID: Snowflake (time-ordered, unique)

### Delivery Receipts
- Sent: Message stored in server
- Delivered: Receiver's device acknowledged
- Read: Receiver opened conversation

### Group Chat
- Message sent to group → fan-out to all members
- For large groups: async fan-out via message queue

### Online Status
- Heartbeat every 5 seconds
- Store last_seen in Redis with TTL
- Presence service broadcasts status changes to friends

---

## 4. YouTube / Netflix (Video Streaming)

### Requirements
- Functional: Upload video, stream video, search, recommendations
- Non-functional: 500 hours uploaded/minute, billions of views/day

### Video Upload Flow
\`\`\`
Client → Upload Service → Raw Storage (S3)
                       → Message Queue
                       → Transcoding Service (multiple resolutions/formats)
                       → Processed Storage (S3)
                       → CDN
                       → Metadata DB (update status)
\`\`\`

### Video Streaming
- **Adaptive Bitrate Streaming (ABR)**: Client switches quality based on bandwidth
- **HLS / DASH**: Video split into small segments (2–10 seconds)
- CDN serves segments from edge closest to user
- Client player requests next segment before current ends

### Storage
- Video files: S3 (object storage)
- Metadata: MySQL (video info, user data)
- Comments: Cassandra
- View counts: Redis (approximate, batch flush to DB)
- Search index: Elasticsearch

### Recommendations
- Collaborative filtering (users who watched X also watched Y)
- Content-based filtering (similar tags, categories)
- Offline ML pipeline → precompute recommendations → store in Redis

---

## 5. Rate Limiter

### Requirements
- Limit requests per user/IP per time window
- Distributed (multiple API servers)
- Low latency overhead

### Algorithm: Sliding Window Counter (Redis)
\`\`\`python
def is_allowed(user_id, limit=100, window=60):
    key = f"rate:{user_id}"
    now = time.time()
    window_start = now - window
    
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)  # remove old entries
    pipe.zadd(key, {str(now): now})              # add current request
    pipe.zcard(key)                               # count requests
    pipe.expire(key, window)                      # set TTL
    results = pipe.execute()
    
    return results[2] <= limit
\`\`\`

### Architecture
\`\`\`
Client → API Gateway (rate limit check) → Backend Services
                    ↓
              Redis Cluster (counters)
\`\`\`

### Rules Engine
- Different limits per endpoint, user tier, API key
- Store rules in config service or DB
- Cache rules in memory with periodic refresh

---

## 6. Notification System

### Requirements
- Functional: Push notifications, email, SMS
- Non-functional: 10M notifications/day, at-least-once delivery

### Architecture
\`\`\`
Event Sources → Notification Service → Message Queue
                                    → Push Worker (FCM/APNs)
                                    → Email Worker (SendGrid/SES)
                                    → SMS Worker (Twilio)
\`\`\`

### Components
- **Notification Service**: Validates, enriches, routes notifications
- **Message Queue**: Decouples and buffers (Kafka per channel)
- **Workers**: Channel-specific delivery (retry on failure)
- **Template Service**: Personalized message rendering
- **User Preference Service**: Respect opt-outs, quiet hours, channel preferences

### Reliability
- Retry with exponential backoff
- DLQ for failed notifications
- Idempotency key to prevent duplicates on retry
- Track delivery status in DB

---

## 7. Distributed Cache (Redis Cluster)

### Requirements
- High availability, low latency, horizontal scaling

### Architecture
- Consistent hashing across N shards
- Each shard: 1 primary + 2 replicas
- Automatic failover (Redis Sentinel or Cluster mode)

### Cache Warming
- On startup, pre-populate cache from DB
- Prevents thundering herd on cold start

### Eviction
- LRU policy for general cache
- TTL for session data
- Monitor hit rate; if < 80%, investigate access patterns

---

## 8. Design a Key-Value Store

### Requirements
- Get(key), Put(key, value), Delete(key)
- High availability, eventual consistency

### Storage Engine
- **LSM Tree** (Log-Structured Merge Tree): Optimized for writes
  - Write to in-memory memtable
  - Flush to SSTable on disk when full
  - Background compaction merges SSTables
  - Used in: Cassandra, RocksDB, LevelDB

- **B-Tree**: Optimized for reads
  - In-place updates
  - Used in: MySQL InnoDB, PostgreSQL

### Replication
- Leaderless with quorum (W=2, R=2, N=3)
- Gossip protocol for failure detection
- Vector clocks for conflict detection

### Bloom Filter
- Probabilistic data structure
- Check if key exists before disk lookup
- False positives possible, false negatives impossible
- Reduces unnecessary disk reads for non-existent keys

---

## Interview Tips

- **Don't jump to solution** — spend time on requirements and estimation
- **Draw diagrams** — boxes and arrows, label data flows
- **Justify every choice** — "I chose Cassandra because we need high write throughput and time-series access pattern"
- **Proactively discuss failure modes** — what if the cache goes down? What if a DB shard fails?
- **Scale incrementally** — start simple, then add complexity as scale demands
`;

CONTENT['hld_01'] = `# HLD Fundamentals — Scalability, Load Balancing, CAP Theorem

---

## 1. Scalability

### Vertical Scaling (Scale Up)
- Add more CPU, RAM, or storage to a single machine
- **Pros**: Simple, no code changes, low latency (no network hops)
- **Cons**: Hard limit (biggest machine available), single point of failure, expensive
- **When to use**: Early stage, databases (up to a point), stateful services

### Horizontal Scaling (Scale Out)
- Add more machines to distribute load
- **Pros**: Theoretically unlimited, fault tolerant, cost-effective with commodity hardware
- **Cons**: Complexity (distributed systems problems), stateless requirement, data consistency challenges
- **When to use**: Web servers, API servers, stateless microservices

### Stateless vs Stateful Services
- **Stateless**: Each request contains all info needed. Easy to scale horizontally. (e.g., REST APIs)
- **Stateful**: Server remembers client state between requests. Hard to scale. (e.g., WebSocket connections, sessions)
- **Solution for stateful**: Externalize state to shared store (Redis, DB) so any server can handle any request

---

## 2. Load Balancing

### What it does
Distributes incoming traffic across multiple servers to prevent any single server from becoming a bottleneck.

### Algorithms
| Algorithm | Description | Best For |
|---|---|---|
| Round Robin | Requests distributed sequentially | Homogeneous servers, equal request cost |
| Weighted Round Robin | Servers get traffic proportional to weight | Heterogeneous server capacities |
| Least Connections | Route to server with fewest active connections | Long-lived connections (WebSockets) |
| IP Hash | Hash client IP to always route to same server | Session persistence without sticky sessions |
| Random | Random server selection | Simple, low overhead |
| Least Response Time | Route to fastest responding server | Latency-sensitive applications |

### Layer 4 vs Layer 7 Load Balancing
- **L4 (Transport)**: Routes based on IP/TCP. Fast, no content inspection. (e.g., AWS NLB)
- **L7 (Application)**: Routes based on HTTP headers, URL, cookies. Smarter routing, SSL termination. (e.g., AWS ALB, Nginx)

### Health Checks
- Load balancers periodically ping servers
- Remove unhealthy servers from rotation automatically
- Active (LB pings server) vs Passive (LB monitors traffic)

### Single Point of Failure
- Load balancer itself can fail → use active-passive or active-active LB pairs
- DNS-based load balancing as a fallback

---

## 3. CAP Theorem

### The Theorem
In a distributed system, you can only guarantee **2 of 3**:
- **C**onsistency — Every read receives the most recent write
- **A**vailability — Every request receives a response (not necessarily latest data)
- **P**artition Tolerance — System continues operating despite network partitions

### The Reality
Network partitions **will** happen. So the real choice is **CP vs AP**:

| Choice | Behaviour | Examples |
|---|---|---|
| CP | Returns error or timeout if can't guarantee consistency | HBase, Zookeeper, etcd |
| AP | Returns potentially stale data but always responds | Cassandra, DynamoDB, CouchDB |
| CA | Only possible without partitions (single node) | Traditional RDBMS (PostgreSQL, MySQL) |

### Interview Tip
Don't just state CAP — explain the **trade-off for your specific system**:
- Banking system → CP (can't show wrong balance)
- Social media feed → AP (slightly stale feed is fine)
- Shopping cart → AP with eventual consistency (availability > consistency)

---

## 4. Consistency Models

From strongest to weakest:

### Strong Consistency
- After a write completes, all subsequent reads return that value
- Expensive — requires coordination across nodes
- Used in: financial systems, inventory management

### Linearizability
- Operations appear instantaneous and in real-time order
- Strongest form of consistency
- Used in: distributed locks, leader election

### Sequential Consistency
- All operations appear in some sequential order, same order seen by all nodes
- Weaker than linearizability (no real-time guarantee)

### Causal Consistency
- Causally related operations seen in order; concurrent operations may differ
- Used in: collaborative editing, comment threads

### Eventual Consistency
- Given no new updates, all replicas will eventually converge
- Highest availability, lowest latency
- Used in: DNS, shopping carts, social media likes

### Read-Your-Writes Consistency
- After a write, the same client always reads that value
- Important for user-facing apps (e.g., after posting a comment, you see it)

---

## 5. Availability & Reliability

### Availability Numbers
| Availability | Downtime/year | Downtime/month |
|---|---|---|
| 99% (2 nines) | 3.65 days | 7.2 hours |
| 99.9% (3 nines) | 8.76 hours | 43.8 minutes |
| 99.99% (4 nines) | 52.6 minutes | 4.4 minutes |
| 99.999% (5 nines) | 5.26 minutes | 26 seconds |

### Reliability Patterns
- **Redundancy**: Multiple instances, no single point of failure
- **Failover**: Automatic switch to backup on failure (active-passive or active-active)
- **Circuit Breaker**: Stop calling a failing service to prevent cascade failures
- **Retry with Backoff**: Retry failed requests with exponential backoff + jitter
- **Bulkhead**: Isolate failures to prevent them spreading (separate thread pools per service)
- **Timeout**: Always set timeouts on external calls

---

## 6. Back-of-Envelope Estimation

### Key Numbers to Know
| Operation | Latency |
|---|---|
| L1 cache reference | 0.5 ns |
| L2 cache reference | 7 ns |
| RAM access | 100 ns |
| SSD random read | 150 µs |
| HDD seek | 10 ms |
| Network round trip (same DC) | 0.5 ms |
| Network round trip (cross-continent) | 150 ms |

### Storage
- 1 char = 1 byte
- 1 int = 4 bytes
- 1 UUID = 16 bytes
- 1 image (compressed) ≈ 300 KB
- 1 video (1 min, 720p) ≈ 50 MB

### Estimation Framework
1. **QPS**: Daily active users × actions per day / 86,400 seconds
2. **Peak QPS**: QPS × 2–3x
3. **Storage**: QPS × data size per request × retention period
4. **Bandwidth**: QPS × data size per request

### Example: Twitter
- 300M DAU, 5 tweets/day = 1.5B tweets/day = ~17,000 QPS
- Peak: ~50,000 QPS
- Tweet size: 280 chars + metadata ≈ 1 KB
- Storage: 17,000 × 1 KB = 17 MB/s = ~1.5 TB/day

---

## Interview Tips

- Always clarify **functional vs non-functional requirements** first
- State your **assumptions** explicitly
- Think about **bottlenecks** at each layer
- Discuss **trade-offs**, not just solutions
- At senior level: proactively identify failure modes and how to handle them
`;

CONTENT['hld_04'] = `# Messaging — Kafka, SQS, RabbitMQ, Pub/Sub Patterns

---

## 1. Why Message Queues?

- **Decoupling**: Producer and consumer don't need to know about each other
- **Async processing**: Producer doesn't wait for consumer to finish
- **Load leveling**: Absorb traffic spikes, smooth out processing
- **Reliability**: Messages persisted until consumed, survive consumer crashes
- **Fan-out**: One message delivered to multiple consumers

---

## 2. Core Concepts

### Message Queue vs Message Stream
| | Queue | Stream |
|---|---|---|
| Consumption | Message consumed once, then deleted | Message retained, can be replayed |
| Model | Point-to-point | Pub/sub or consumer groups |
| Examples | SQS, RabbitMQ | Kafka, Kinesis |

### At-Most-Once vs At-Least-Once vs Exactly-Once
| Guarantee | Description | Risk |
|---|---|---|
| At-most-once | Message sent once, may be lost | Data loss |
| At-least-once | Message retried until acknowledged, may duplicate | Duplicate processing |
| Exactly-once | Message processed exactly once | Complex, expensive |

**Most systems use at-least-once + idempotent consumers** (easier than exactly-once)

### Idempotency
- Processing the same message multiple times has the same effect as once
- Implement by: deduplication ID, checking if already processed before acting

---

## 3. Apache Kafka

### Architecture
- **Topic**: Named stream of messages (like a table in a DB)
- **Partition**: Topic split into ordered, immutable log segments
- **Offset**: Position of a message within a partition
- **Producer**: Writes messages to topics
- **Consumer**: Reads messages from topics
- **Consumer Group**: Multiple consumers sharing partitions of a topic
- **Broker**: Kafka server storing partitions
- **ZooKeeper / KRaft**: Cluster coordination (ZooKeeper being replaced by KRaft)

### Partitioning
- Messages with same key go to same partition (ordering guaranteed per key)
- Different keys distributed across partitions (parallelism)
- Number of partitions = max parallelism for consumers in a group
- One partition can only be consumed by one consumer in a group at a time

### Replication
- Each partition has one leader and N-1 followers
- Producers/consumers talk to leader
- Followers replicate from leader
- \`replication.factor=3\` is standard for production
- \`min.insync.replicas=2\` ensures at least 2 replicas have the message before ack

### Consumer Groups
- Each consumer group gets all messages (independent consumption)
- Within a group, each partition assigned to exactly one consumer
- Enables both pub/sub (multiple groups) and queue (one group, multiple consumers)

### Retention
- Messages retained by time (default 7 days) or size
- Consumers can replay from any offset
- Enables event sourcing, audit logs, reprocessing

### Kafka Use Cases
- Event streaming (user activity, clickstream)
- Log aggregation
- Change Data Capture (CDC) from databases
- Microservice communication
- Real-time analytics pipeline

### Kafka vs Traditional Queue
| | Kafka | RabbitMQ/SQS |
|---|---|---|
| Message retention | Retained (replayable) | Deleted after consumption |
| Ordering | Per partition | Per queue (FIFO) |
| Throughput | Very high (millions/sec) | High (thousands/sec) |
| Consumer model | Pull | Push or Pull |
| Use case | Streaming, event log | Task queue, RPC |

---

## 4. Amazon SQS

### Types
- **Standard Queue**: At-least-once, best-effort ordering, nearly unlimited throughput
- **FIFO Queue**: Exactly-once, strict ordering, 300 TPS (3000 with batching)

### Key Features
- **Visibility Timeout**: Message hidden from other consumers while being processed
- **Dead Letter Queue (DLQ)**: Messages that fail processing N times go here
- **Long Polling**: Consumer waits up to 20s for messages (reduces empty responses)
- **Message Retention**: 1 minute to 14 days (default 4 days)

### SQS vs Kafka
- SQS: Managed, simple, no replay, good for task queues
- Kafka: Self-managed (or MSK), replayable, high throughput, streaming

---

## 5. RabbitMQ

### Concepts
- **Exchange**: Receives messages from producers, routes to queues
- **Queue**: Stores messages until consumed
- **Binding**: Rule connecting exchange to queue
- **Routing Key**: Used by exchange to decide which queue

### Exchange Types
| Type | Routing | Use Case |
|---|---|---|
| Direct | Exact routing key match | Task routing |
| Fanout | Broadcast to all bound queues | Notifications |
| Topic | Pattern matching on routing key | Flexible routing |
| Headers | Match on message headers | Complex routing |

### RabbitMQ vs Kafka
- RabbitMQ: Push-based, complex routing, lower throughput, message deleted after ack
- Kafka: Pull-based, simple routing, very high throughput, message retained

---

## 6. Pub/Sub Pattern

### How it works
- **Publisher** sends message to a **topic/channel**
- **Subscribers** register interest in topics
- Message broker delivers to all subscribers
- Publishers and subscribers are fully decoupled

### Use Cases
- Notification systems (email, push, SMS)
- Real-time updates (stock prices, sports scores)
- Event-driven microservices
- Cache invalidation across services

### Fan-out Pattern
\`\`\`
Order Placed Event
    ├── Inventory Service (reduce stock)
    ├── Email Service (send confirmation)
    ├── Analytics Service (track conversion)
    └── Recommendation Service (update model)
\`\`\`

---

## 7. Message Queue Patterns

### Work Queue (Task Queue)
- Multiple workers consume from same queue
- Each message processed by exactly one worker
- Used for: background jobs, email sending, image processing

### Request-Reply (RPC over Queue)
- Producer sends request with reply-to queue and correlation ID
- Consumer processes and sends response to reply-to queue
- Used for: async RPC, microservice communication

### Dead Letter Queue (DLQ)
- Messages that fail processing after N retries
- Allows investigation without blocking main queue
- Always configure DLQ in production

### Outbox Pattern
- Write to DB and message queue atomically
- Store message in DB outbox table in same transaction
- Separate process reads outbox and publishes to queue
- Solves dual-write problem (DB write + queue publish)

---

## 8. Choosing a Messaging System

| Requirement | Choice |
|---|---|
| Simple task queue, managed | SQS Standard |
| Ordered task queue | SQS FIFO |
| Complex routing | RabbitMQ |
| High throughput streaming | Kafka |
| Real-time pub/sub | Redis Pub/Sub, Google Pub/Sub |
| Event sourcing | Kafka |
| Exactly-once processing | Kafka (transactions) or SQS FIFO |

---

## Interview Tips

- Always mention **at-least-once delivery + idempotent consumers** as the practical approach
- For any async workflow, draw the message flow explicitly
- Discuss **DLQ** — interviewers want to see you think about failure handling
- Kafka questions: know partitions, consumer groups, and offset management
- At senior level: discuss **ordering guarantees**, **backpressure**, and **consumer lag monitoring**
`;

CONTENT['lld_01'] = `# SOLID Principles

---

## Overview

SOLID is an acronym for five design principles that make software more maintainable, flexible, and scalable. At senior level, you're expected to not just recite them but apply them in code reviews and design discussions.

---

## S — Single Responsibility Principle (SRP)

> A class should have only one reason to change.

Each class/module should do one thing and do it well.

### Bad Example
\`\`\`java
class UserService {
    public void createUser(User user) { /* DB logic */ }
    public void sendWelcomeEmail(User user) { /* Email logic */ }
    public void generateReport(User user) { /* Report logic */ }
}
\`\`\`
This class changes if DB logic changes, email logic changes, OR report logic changes.

### Good Example
\`\`\`java
class UserRepository {
    public void save(User user) { /* DB logic only */ }
}

class EmailService {
    public void sendWelcomeEmail(User user) { /* Email logic only */ }
}

class UserReportService {
    public void generateReport(User user) { /* Report logic only */ }
}

class UserService {
    public void createUser(User user) {
        userRepository.save(user);
        emailService.sendWelcomeEmail(user);
    }
}
\`\`\`

### Interview Application
- "I'd split this into separate services — one for business logic, one for persistence, one for notifications"
- Microservices are SRP at the service level

---

## O — Open/Closed Principle (OCP)

> Software entities should be open for extension but closed for modification.

Add new behaviour by adding new code, not changing existing code.

### Bad Example
\`\`\`java
class DiscountCalculator {
    public double calculate(String customerType, double price) {
        if (customerType.equals("REGULAR")) return price * 0.9;
        if (customerType.equals("PREMIUM")) return price * 0.8;
        // Adding VIP requires modifying this class
        if (customerType.equals("VIP")) return price * 0.7;
        return price;
    }
}
\`\`\`

### Good Example
\`\`\`java
interface DiscountStrategy {
    double apply(double price);
}

class RegularDiscount implements DiscountStrategy {
    public double apply(double price) { return price * 0.9; }
}

class PremiumDiscount implements DiscountStrategy {
    public double apply(double price) { return price * 0.8; }
}

// Adding VIP: just add new class, no existing code changes
class VIPDiscount implements DiscountStrategy {
    public double apply(double price) { return price * 0.7; }
}

class DiscountCalculator {
    public double calculate(DiscountStrategy strategy, double price) {
        return strategy.apply(price);
    }
}
\`\`\`

### Interview Application
- Strategy pattern, plugin architectures, feature flags
- "Instead of adding another if-else, I'd use a strategy pattern so new payment methods can be added without touching existing code"

---

## L — Liskov Substitution Principle (LSP)

> Subtypes must be substitutable for their base types without altering correctness.

If S is a subtype of T, you should be able to use S wherever T is expected.

### Bad Example
\`\`\`java
class Rectangle {
    protected int width, height;
    public void setWidth(int w) { width = w; }
    public void setHeight(int h) { height = h; }
    public int area() { return width * height; }
}

class Square extends Rectangle {
    // Square must keep width == height
    public void setWidth(int w) { width = w; height = w; }  // Violates LSP!
    public void setHeight(int h) { width = h; height = h; } // Violates LSP!
}

// This breaks with Square:
Rectangle r = new Square();
r.setWidth(5);
r.setHeight(10);
// Expected area: 50, Actual: 100 (Square changed width when height was set)
\`\`\`

### Good Example
\`\`\`java
interface Shape {
    int area();
}

class Rectangle implements Shape {
    private int width, height;
    // ... normal rectangle
}

class Square implements Shape {
    private int side;
    // ... normal square
}
\`\`\`

### Interview Application
- "I'd check if inheritance is the right relationship here — 'is-a' vs 'has-a'"
- Prefer composition over inheritance when LSP would be violated

---

## I — Interface Segregation Principle (ISP)

> Clients should not be forced to depend on interfaces they don't use.

Split large interfaces into smaller, more specific ones.

### Bad Example
\`\`\`java
interface Worker {
    void work();
    void eat();
    void sleep();
}

class Robot implements Worker {
    public void work() { /* OK */ }
    public void eat() { throw new UnsupportedOperationException(); } // Robots don't eat!
    public void sleep() { throw new UnsupportedOperationException(); }
}
\`\`\`

### Good Example
\`\`\`java
interface Workable {
    void work();
}

interface Eatable {
    void eat();
}

interface Sleepable {
    void sleep();
}

class Human implements Workable, Eatable, Sleepable {
    public void work() { /* ... */ }
    public void eat() { /* ... */ }
    public void sleep() { /* ... */ }
}

class Robot implements Workable {
    public void work() { /* ... */ }
}
\`\`\`

### Interview Application
- "I'd break this interface into smaller ones so services only depend on what they need"
- Reduces coupling, makes mocking in tests easier

---

## D — Dependency Inversion Principle (DIP)

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

Depend on interfaces/abstractions, not concrete implementations.

### Bad Example
\`\`\`java
class OrderService {
    private MySQLDatabase db = new MySQLDatabase(); // Tightly coupled to MySQL!
    
    public void placeOrder(Order order) {
        db.save(order);
    }
}
\`\`\`

### Good Example
\`\`\`java
interface OrderRepository {
    void save(Order order);
}

class MySQLOrderRepository implements OrderRepository {
    public void save(Order order) { /* MySQL logic */ }
}

class MongoOrderRepository implements OrderRepository {
    public void save(Order order) { /* MongoDB logic */ }
}

class OrderService {
    private final OrderRepository repository; // Depends on abstraction
    
    public OrderService(OrderRepository repository) { // Injected (DI)
        this.repository = repository;
    }
    
    public void placeOrder(Order order) {
        repository.save(order);
    }
}
\`\`\`

### Interview Application
- Dependency Injection frameworks (Spring, Guice) implement DIP
- "I'd inject the dependency so we can swap implementations and mock in tests"
- Enables testability and flexibility

---

## Summary Table

| Principle | One-liner | Key Pattern |
|---|---|---|
| SRP | One class, one job | Separate concerns |
| OCP | Extend, don't modify | Strategy, Plugin |
| LSP | Subtypes behave like base types | Prefer composition |
| ISP | Small, focused interfaces | Split interfaces |
| DIP | Depend on abstractions | Dependency Injection |

---

## Interview Tips

- Don't just define — give a **concrete example** from your experience
- "In my Oracle work, we used DIP extensively with Guice for dependency injection, which made unit testing much easier"
- At senior level: discuss **when to break the rules** — SOLID is a guideline, not a law. Over-engineering small scripts with SOLID is itself a problem.
`;

CONTENT['hld_02'] = `# Caching — Redis, CDN, Eviction, Invalidation

---

## 1. Why Cache?

- Reduce latency (memory access ~100ns vs DB ~10ms)
- Reduce load on databases and downstream services
- Improve throughput and scalability
- Rule of thumb: cache data that is **read frequently** and **changes infrequently**

---

## 2. Cache Write Strategies

### Write-Through
- Write to cache AND database simultaneously
- **Pros**: Cache always consistent with DB, no data loss on crash
- **Cons**: Higher write latency (two writes), cache may store data never read again
- **Use when**: Read-heavy workloads where consistency matters

### Write-Back (Write-Behind)
- Write to cache only; async write to DB later
- **Pros**: Low write latency, batching possible
- **Cons**: Risk of data loss if cache crashes before DB write
- **Use when**: Write-heavy workloads, can tolerate some data loss (e.g., analytics counters)

### Write-Around
- Write directly to DB, bypass cache
- Cache is populated only on read (cache miss)
- **Pros**: Cache not polluted with write-once data
- **Cons**: First read always a cache miss (higher latency)
- **Use when**: Data written once and rarely read (e.g., log files)

---

## 3. Cache Read Strategies

### Cache-Aside (Lazy Loading)
- Application checks cache first
- On miss: fetch from DB, populate cache, return data
- Most common pattern
\`\`\`
data = cache.get(key)
if data is None:
    data = db.query(key)
    cache.set(key, data, ttl=300)
return data
\`\`\`
- **Pros**: Only requested data is cached, resilient to cache failure
- **Cons**: Cache miss penalty (3 trips), potential stale data

### Read-Through
- Cache sits in front of DB
- On miss: cache fetches from DB automatically
- Application only talks to cache
- **Pros**: Simpler application code
- **Cons**: Cache miss still slow, cold start problem

---

## 4. Cache Eviction Policies

| Policy | Description | Best For |
|---|---|---|
| LRU (Least Recently Used) | Evict least recently accessed item | General purpose, temporal locality |
| LFU (Least Frequently Used) | Evict least frequently accessed item | Popularity-based access patterns |
| FIFO | Evict oldest inserted item | Simple, queue-like workloads |
| Random | Evict random item | Simple, low overhead |
| TTL (Time-To-Live) | Evict after fixed time | Data with known staleness window |

**Redis default**: LRU (configurable)

---

## 5. Cache Invalidation

The hardest problem in caching. Three main strategies:

### TTL-Based Expiry
- Set a time-to-live on every cache entry
- Simple, automatic, but data can be stale up to TTL duration
- Good default for most use cases

### Event-Driven Invalidation
- When DB is updated, explicitly delete/update cache entry
- More complex but more accurate
- Risk: race conditions between cache delete and next read

### Cache-Aside with Version/ETag
- Store version number with cached data
- On read, compare version with DB; invalidate if mismatch
- More consistent but adds complexity

### Write-Through Invalidation
- Always update cache on write
- Keeps cache fresh but adds write latency

---

## 6. Redis

### Data Structures
| Type | Use Case |
|---|---|
| String | Simple key-value, counters, session tokens |
| Hash | User profiles, object fields |
| List | Message queues, activity feeds (ordered) |
| Set | Unique tags, friend lists, deduplication |
| Sorted Set (ZSet) | Leaderboards, rate limiting, priority queues |
| Bitmap | Feature flags, user activity tracking |
| HyperLogLog | Approximate unique count (e.g., unique visitors) |
| Streams | Event log, message queue with consumer groups |

### Redis for Rate Limiting
\`\`\`
# Sliding window using sorted set
ZADD user:123:requests <timestamp> <request_id>
ZREMRANGEBYSCORE user:123:requests 0 <window_start>
count = ZCARD user:123:requests
if count > limit: reject
\`\`\`

### Redis for Distributed Locking (Redlock)
- Use \`SET key value NX PX <ttl>\` for atomic lock acquisition
- Release only if value matches (prevents releasing another client's lock)
- Redlock algorithm uses majority of N Redis nodes for safety

### Redis Persistence
- **RDB (Snapshot)**: Periodic snapshots to disk. Fast restart, some data loss possible.
- **AOF (Append-Only File)**: Log every write. Slower but more durable.
- **Both**: Use RDB for backups, AOF for durability

### Redis Cluster
- Shards data across multiple nodes using consistent hashing (16384 hash slots)
- Each shard has primary + replicas
- Automatic failover if primary fails

---

## 7. CDN (Content Delivery Network)

### What it does
- Caches static assets (images, JS, CSS, videos) at edge servers geographically close to users
- Reduces latency, offloads origin server traffic

### Push vs Pull CDN
| | Push CDN | Pull CDN |
|---|---|---|
| How | You upload content to CDN proactively | CDN fetches from origin on first request |
| Best for | Large files, predictable content | Dynamic content, unpredictable access |
| Example | Uploading a new video | News article images |

### Cache-Control Headers
- \`Cache-Control: max-age=86400\` — cache for 1 day
- \`Cache-Control: no-cache\` — must revalidate with origin
- \`Cache-Control: no-store\` — never cache (sensitive data)
- \`ETag\` — version identifier for conditional requests

---

## 8. Common Caching Problems

### Cache Stampede (Thundering Herd)
- Many requests hit DB simultaneously when a popular cache entry expires
- **Solutions**:
  - Mutex/lock: only one request fetches from DB, others wait
  - Probabilistic early expiry: randomly refresh before TTL expires
  - Background refresh: async refresh before expiry

### Cache Penetration
- Requests for data that doesn't exist in DB or cache (e.g., invalid IDs)
- Cache never populated, DB hammered
- **Solutions**:
  - Cache null results with short TTL
  - Bloom filter to check existence before DB query

### Cache Avalanche
- Many cache entries expire at the same time → DB overwhelmed
- **Solutions**:
  - Add random jitter to TTL values
  - Stagger cache population
  - Circuit breaker on DB

---

## Interview Tips

- Always mention **TTL** when discussing caching — interviewers want to see you think about staleness
- For any system with high read traffic, proactively suggest caching
- Discuss **what to cache** (hot data), **where** (client, CDN, app server, DB), and **invalidation strategy**
- At senior level: discuss cache consistency trade-offs and failure modes (stampede, avalanche)
`;

CONTENT['lld_02'] = `# Design Patterns

---

## Categories

| Category | Purpose | Patterns |
|---|---|---|
| Creational | Object creation | Singleton, Factory, Abstract Factory, Builder, Prototype |
| Structural | Object composition | Adapter, Decorator, Proxy, Facade, Composite, Bridge |
| Behavioral | Object communication | Observer, Strategy, Command, Iterator, Template Method, State, Chain of Responsibility |

---

## CREATIONAL PATTERNS

### 1. Singleton
Ensure only one instance of a class exists.

\`\`\`java
public class DatabaseConnection {
    private static volatile DatabaseConnection instance;
    
    private DatabaseConnection() {}
    
    public static DatabaseConnection getInstance() {
        if (instance == null) {
            synchronized (DatabaseConnection.class) {
                if (instance == null) {  // Double-checked locking
                    instance = new DatabaseConnection();
                }
            }
        }
        return instance;
    }
}
\`\`\`

**Use when**: Logger, config manager, connection pool, thread pool
**Pitfalls**: Hard to test (global state), violates SRP, issues in distributed systems

---

### 2. Factory Method
Define interface for creating objects; subclasses decide which class to instantiate.

\`\`\`java
interface Notification {
    void send(String message);
}

class EmailNotification implements Notification {
    public void send(String message) { /* send email */ }
}

class SMSNotification implements Notification {
    public void send(String message) { /* send SMS */ }
}

class PushNotification implements Notification {
    public void send(String message) { /* send push */ }
}

class NotificationFactory {
    public static Notification create(String type) {
        return switch (type) {
            case "EMAIL" -> new EmailNotification();
            case "SMS"   -> new SMSNotification();
            case "PUSH"  -> new PushNotification();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}
\`\`\`

**Use when**: Object creation logic should be centralized; type determined at runtime

---

### 3. Abstract Factory
Factory of factories — create families of related objects.

\`\`\`java
interface Button { void render(); }
interface Checkbox { void render(); }

class WindowsButton implements Button { public void render() { /* Windows style */ } }
class MacButton implements Button { public void render() { /* Mac style */ } }

interface UIFactory {
    Button createButton();
    Checkbox createCheckbox();
}

class WindowsUIFactory implements UIFactory {
    public Button createButton() { return new WindowsButton(); }
    public Checkbox createCheckbox() { return new WindowsCheckbox(); }
}

class MacUIFactory implements UIFactory {
    public Button createButton() { return new MacButton(); }
    public Checkbox createCheckbox() { return new MacCheckbox(); }
}
\`\`\`

**Use when**: System must be independent of how its products are created; families of related objects

---

### 4. Builder
Construct complex objects step by step.

\`\`\`java
class Pizza {
    private String size;
    private boolean cheese;
    private boolean pepperoni;
    private boolean mushrooms;
    
    private Pizza(Builder builder) {
        this.size = builder.size;
        this.cheese = builder.cheese;
        this.pepperoni = builder.pepperoni;
        this.mushrooms = builder.mushrooms;
    }
    
    public static class Builder {
        private String size;
        private boolean cheese = false;
        private boolean pepperoni = false;
        private boolean mushrooms = false;
        
        public Builder(String size) { this.size = size; }
        public Builder cheese() { this.cheese = true; return this; }
        public Builder pepperoni() { this.pepperoni = true; return this; }
        public Builder mushrooms() { this.mushrooms = true; return this; }
        public Pizza build() { return new Pizza(this); }
    }
}

// Usage
Pizza pizza = new Pizza.Builder("large")
    .cheese()
    .pepperoni()
    .build();
\`\`\`

**Use when**: Object has many optional parameters; avoid telescoping constructors

---

## STRUCTURAL PATTERNS

### 5. Adapter
Convert interface of a class into another interface clients expect.

\`\`\`java
// Existing interface
interface OldPaymentGateway {
    void makePayment(int amount);
}

// New interface we want to use
interface NewPaymentGateway {
    void processPayment(double amount, String currency);
}

// Adapter
class PaymentAdapter implements OldPaymentGateway {
    private NewPaymentGateway newGateway;
    
    public PaymentAdapter(NewPaymentGateway newGateway) {
        this.newGateway = newGateway;
    }
    
    public void makePayment(int amount) {
        newGateway.processPayment(amount / 100.0, "USD");
    }
}
\`\`\`

**Use when**: Integrating legacy code or third-party libraries with incompatible interfaces

---

### 6. Decorator
Add behaviour to objects dynamically without subclassing.

\`\`\`java
interface Coffee {
    double getCost();
    String getDescription();
}

class SimpleCoffee implements Coffee {
    public double getCost() { return 1.0; }
    public String getDescription() { return "Coffee"; }
}

abstract class CoffeeDecorator implements Coffee {
    protected Coffee coffee;
    public CoffeeDecorator(Coffee coffee) { this.coffee = coffee; }
}

class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) { super(coffee); }
    public double getCost() { return coffee.getCost() + 0.5; }
    public String getDescription() { return coffee.getDescription() + ", Milk"; }
}

class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) { super(coffee); }
    public double getCost() { return coffee.getCost() + 0.25; }
    public String getDescription() { return coffee.getDescription() + ", Sugar"; }
}

// Usage
Coffee coffee = new SugarDecorator(new MilkDecorator(new SimpleCoffee()));
// Cost: 1.75, Description: "Coffee, Milk, Sugar"
\`\`\`

**Use when**: Add responsibilities to objects at runtime; alternative to subclassing; Java I/O streams

---

### 7. Proxy
Provide a surrogate or placeholder for another object.

\`\`\`java
interface Image {
    void display();
}

class RealImage implements Image {
    private String filename;
    
    public RealImage(String filename) {
        this.filename = filename;
        loadFromDisk(); // Expensive operation
    }
    
    private void loadFromDisk() { System.out.println("Loading " + filename); }
    public void display() { System.out.println("Displaying " + filename); }
}

class ProxyImage implements Image {
    private RealImage realImage;
    private String filename;
    
    public ProxyImage(String filename) { this.filename = filename; }
    
    public void display() {
        if (realImage == null) {
            realImage = new RealImage(filename); // Lazy loading
        }
        realImage.display();
    }
}
\`\`\`

**Types**:
- **Virtual Proxy**: Lazy initialization (above example)
- **Protection Proxy**: Access control
- **Remote Proxy**: Local representative for remote object
- **Caching Proxy**: Cache results of expensive operations

---

### 8. Facade
Provide simplified interface to complex subsystem.

\`\`\`java
class HomeTheaterFacade {
    private Amplifier amp;
    private DVDPlayer dvd;
    private Projector projector;
    private Lights lights;
    
    public void watchMovie(String movie) {
        lights.dim(10);
        projector.on();
        projector.wideScreenMode();
        amp.on();
        amp.setVolume(5);
        dvd.on();
        dvd.play(movie);
    }
    
    public void endMovie() {
        dvd.stop();
        dvd.off();
        amp.off();
        projector.off();
        lights.on();
    }
}
\`\`\`

**Use when**: Simplify complex subsystem; provide clean API over legacy code; microservice API gateway

---

## BEHAVIORAL PATTERNS

### 9. Observer (Pub/Sub)
Define one-to-many dependency; when one object changes, all dependents notified.

\`\`\`java
interface Observer {
    void update(String event, Object data);
}

interface Observable {
    void subscribe(String event, Observer observer);
    void unsubscribe(String event, Observer observer);
    void notify(String event, Object data);
}

class EventBus implements Observable {
    private Map<String, List<Observer>> listeners = new HashMap<>();
    
    public void subscribe(String event, Observer observer) {
        listeners.computeIfAbsent(event, k -> new ArrayList<>()).add(observer);
    }
    
    public void unsubscribe(String event, Observer observer) {
        listeners.getOrDefault(event, Collections.emptyList()).remove(observer);
    }
    
    public void notify(String event, Object data) {
        listeners.getOrDefault(event, Collections.emptyList())
                 .forEach(o -> o.update(event, data));
    }
}
\`\`\`

**Use when**: Event systems, MVC (model notifies views), message brokers

---

### 10. Strategy
Define family of algorithms, encapsulate each, make them interchangeable.

\`\`\`java
interface SortStrategy {
    void sort(int[] array);
}

class QuickSort implements SortStrategy {
    public void sort(int[] array) { /* quicksort */ }
}

class MergeSort implements SortStrategy {
    public void sort(int[] array) { /* mergesort */ }
}

class Sorter {
    private SortStrategy strategy;
    
    public Sorter(SortStrategy strategy) { this.strategy = strategy; }
    
    public void setStrategy(SortStrategy strategy) { this.strategy = strategy; }
    
    public void sort(int[] array) { strategy.sort(array); }
}

// Usage
Sorter sorter = new Sorter(new QuickSort());
sorter.sort(data);
sorter.setStrategy(new MergeSort()); // Switch at runtime
sorter.sort(data);
\`\`\`

**Use when**: Multiple algorithms for same task; switch algorithms at runtime; replace conditionals

---

### 11. Command
Encapsulate a request as an object, enabling undo/redo, queuing, logging.

\`\`\`java
interface Command {
    void execute();
    void undo();
}

class TextEditor {
    private StringBuilder text = new StringBuilder();
    
    public void insertText(String text, int position) {
        this.text.insert(position, text);
    }
    
    public void deleteText(int start, int end) {
        this.text.delete(start, end);
    }
}

class InsertCommand implements Command {
    private TextEditor editor;
    private String text;
    private int position;
    
    public InsertCommand(TextEditor editor, String text, int position) {
        this.editor = editor; this.text = text; this.position = position;
    }
    
    public void execute() { editor.insertText(text, position); }
    public void undo() { editor.deleteText(position, position + text.length()); }
}

class CommandHistory {
    private Deque<Command> history = new ArrayDeque<>();
    
    public void execute(Command cmd) {
        cmd.execute();
        history.push(cmd);
    }
    
    public void undo() {
        if (!history.isEmpty()) history.pop().undo();
    }
}
\`\`\`

**Use when**: Undo/redo, transaction logging, task queues, macro recording

---

### 12. Template Method
Define skeleton of algorithm in base class; subclasses fill in specific steps.

\`\`\`java
abstract class DataProcessor {
    // Template method
    public final void process() {
        readData();
        processData();
        writeData();
    }
    
    protected abstract void readData();
    protected abstract void processData();
    
    protected void writeData() {
        System.out.println("Writing to default output"); // Default implementation
    }
}

class CSVProcessor extends DataProcessor {
    protected void readData() { System.out.println("Reading CSV"); }
    protected void processData() { System.out.println("Processing CSV data"); }
}

class JSONProcessor extends DataProcessor {
    protected void readData() { System.out.println("Reading JSON"); }
    protected void processData() { System.out.println("Processing JSON data"); }
    protected void writeData() { System.out.println("Writing JSON output"); } // Override
}
\`\`\`

**Use when**: Multiple classes share same algorithm structure with different implementations

---

## Pattern Selection Guide

| Scenario | Pattern |
|---|---|
| Create objects without specifying class | Factory Method |
| Create families of related objects | Abstract Factory |
| Complex object construction | Builder |
| Only one instance needed | Singleton |
| Incompatible interfaces | Adapter |
| Add behaviour at runtime | Decorator |
| Lazy loading / access control | Proxy |
| Simplify complex subsystem | Facade |
| One-to-many notifications | Observer |
| Interchangeable algorithms | Strategy |
| Undo/redo, task queues | Command |
| Algorithm skeleton with variable steps | Template Method |

---

## Interview Tips

- Don't just name patterns — explain **why** you'd use one in a specific context
- "In the Oracle notification system, we used Observer pattern — services subscribed to events and were notified when state changed"
- At senior level: discuss **pattern trade-offs** and when NOT to use a pattern (over-engineering)
- Know how patterns relate to each other: Strategy vs Template Method, Decorator vs Proxy
`;

CONTENT['checklist'] = `# Senior Software Engineer Interview Checklist

## DSA / Coding
- [x] Arrays, Strings, Sliding Window, Two Pointers
- [ ] Linked Lists (reverse, cycle detection, merge)
- [ ] Stacks and Queues
- [ ] Trees (BFS, DFS, LCA, diameter, serialization)
- [ ] Graphs (BFS, DFS, Dijkstra, Union-Find, Topological Sort)
- [ ] Heaps / Priority Queues
- [ ] Dynamic Programming (1D, 2D, knapsack, LCS, LIS)
- [ ] Backtracking (subsets, permutations, N-Queens)
- [x] Binary Search (standard + on answer)
- [ ] Tries
- [ ] Intervals (merge, insert, sweep line)
- [ ] Bit Manipulation
- [ ] Solve 150+ LeetCode problems (mix of Medium/Hard)
- [ ] Practice timed (45 min per problem)
- [ ] Practice explaining approach out loud

## System Design (HLD)
- [ ] Scalability fundamentals (horizontal vs vertical scaling)
- [ ] Load balancing strategies
- [ ] Caching (Redis, Memcached, CDN, cache invalidation)
- [ ] Databases (SQL vs NoSQL, sharding, replication, indexing)
- [ ] CAP theorem and consistency models
- [ ] Message queues (Kafka, RabbitMQ, SQS)
- [ ] API design (REST, gRPC, GraphQL)
- [ ] Rate limiting and throttling
- [ ] Distributed systems (consensus, leader election, Paxos/Raft)
- [ ] Microservices vs monolith trade-offs
- [ ] Event-driven architecture
- [ ] Design URL shortener
- [ ] Design Twitter/News Feed
- [ ] Design WhatsApp/Chat system
- [ ] Design YouTube/Netflix
- [ ] Design Rate Limiter
- [ ] Design Distributed Cache
- [ ] Design Search Autocomplete
- [ ] Design Notification System
- [ ] Design Ride-sharing (Uber/Lyft)
- [ ] Design Distributed Job Scheduler

## Low Level Design (LLD / OOD)
- [ ] SOLID principles
- [ ] Design Patterns (Factory, Singleton, Observer, Strategy, Decorator)
- [ ] Design a Parking Lot
- [ ] Design a Library Management System
- [ ] Design an Elevator System
- [ ] Design a Chess Game
- [ ] Design a Food Delivery System (OOP)

## Behavioral
- [ ] Prepare 5-7 STAR stories covering:
  - [ ] Most impactful project
  - [ ] Conflict resolution
  - [ ] Failure and learning
  - [ ] Leadership / influence without authority
  - [ ] Handling ambiguity
  - [ ] Technical decision with trade-offs
  - [ ] Mentoring / helping others
- [ ] Map stories to Amazon Leadership Principles
- [ ] Practice each story out loud (< 2 min each)
- [ ] Prepare "Why this company?" for each target

## Resume & Profile
- [ ] Resume is 1 page, ATS-friendly
- [ ] Quantified impact on every bullet
- [ ] LinkedIn profile matches resume
- [ ] GitHub has pinned, active projects
- [ ] Portfolio / personal site (optional but good)

## Mock Interviews
- [ ] 5+ mock coding interviews (Pramp, Interviewing.io, peer)
- [ ] 3+ mock system design interviews
- [ ] 2+ mock behavioral interviews
- [ ] Record yourself and review
`;

CONTENT['hld_03'] = `# Databases — SQL, NoSQL, Sharding, Replication, Indexing

---

## 1. SQL vs NoSQL

### SQL (Relational)
- Structured data with predefined schema
- ACID transactions
- Strong consistency
- Joins across tables
- Examples: PostgreSQL, MySQL, Oracle

**Use when**:
- Complex queries and relationships
- Strong consistency required (banking, inventory)
- Data is structured and schema is stable
- Reporting and analytics with joins

### NoSQL
- Flexible/dynamic schema
- Horizontal scaling built-in
- Eventual consistency (usually)
- No joins (denormalized)
- Examples: MongoDB, Cassandra, DynamoDB, Redis

**Use when**:
- Massive scale (billions of records)
- High write throughput
- Flexible or evolving schema
- Simple access patterns (key-value, document)

### NoSQL Types
| Type | Examples | Best For |
|---|---|---|
| Key-Value | Redis, DynamoDB | Sessions, caching, simple lookups |
| Document | MongoDB, Firestore | User profiles, product catalogs |
| Wide-Column | Cassandra, HBase | Time-series, IoT, write-heavy |
| Graph | Neo4j, Amazon Neptune | Social networks, recommendation engines |

---

## 2. ACID Properties

- **Atomicity**: Transaction is all-or-nothing
- **Consistency**: DB moves from one valid state to another
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed transactions survive crashes

### Isolation Levels (weakest to strongest)
| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|---|---|---|
| Read Uncommitted | ✓ possible | ✓ possible | ✓ possible |
| Read Committed | ✗ prevented | ✓ possible | ✓ possible |
| Repeatable Read | ✗ prevented | ✗ prevented | ✓ possible |
| Serializable | ✗ prevented | ✗ prevented | ✗ prevented |

**Default in most DBs**: Read Committed (PostgreSQL) or Repeatable Read (MySQL InnoDB)

---

## 3. BASE (NoSQL alternative to ACID)

- **B**asically **A**vailable: System guarantees availability
- **S**oft state: State may change over time even without input
- **E**ventually consistent: System will become consistent over time

---

## 4. Indexing

### B-Tree Index (default)
- Balanced tree structure
- Good for range queries, equality, ORDER BY
- Used in: PostgreSQL, MySQL for most indexes

### Hash Index
- O(1) lookup for exact equality
- Cannot do range queries
- Used in: Redis, some in-memory DBs

### Composite Index
- Index on multiple columns
- Order matters: \`(a, b, c)\` index helps queries on \`a\`, \`a+b\`, \`a+b+c\` but NOT \`b\` alone
- **Leftmost prefix rule**

### Covering Index
- Index contains all columns needed by query
- No need to fetch actual row (index-only scan)
- Fastest possible read

### When NOT to index
- Columns with low cardinality (e.g., boolean, gender)
- Tables with heavy write load (indexes slow down writes)
- Small tables (full scan is faster)

### Index Trade-offs
- Speeds up reads, slows down writes (index must be updated)
- Takes storage space
- Too many indexes = slow inserts/updates

---

## 5. Replication

### Leader-Follower (Master-Slave)
- One leader handles all writes
- Followers replicate from leader, handle reads
- **Pros**: Simple, read scaling, failover possible
- **Cons**: Leader is write bottleneck, replication lag, failover complexity

### Synchronous vs Asynchronous Replication
- **Sync**: Leader waits for follower to confirm before acknowledging write. Strong consistency, higher latency.
- **Async**: Leader acknowledges immediately, replicates in background. Lower latency, potential data loss on failover.
- **Semi-sync**: At least one follower must confirm (MySQL semi-sync)

### Multi-Leader (Multi-Master)
- Multiple nodes accept writes
- **Pros**: Write availability, geographic distribution
- **Cons**: Write conflicts must be resolved (last-write-wins, CRDTs, manual)
- **Use when**: Multi-datacenter, offline-capable apps

### Leaderless (Dynamo-style)
- Any node accepts writes
- Quorum reads/writes: W + R > N for consistency
- **Examples**: Cassandra, DynamoDB, Riak
- **Pros**: High availability, no failover needed
- **Cons**: Conflict resolution, read repair complexity

---

## 6. Sharding (Horizontal Partitioning)

Splitting data across multiple DB nodes.

### Range-Based Sharding
- Shard by value range (e.g., user IDs 1–1M on shard 1, 1M–2M on shard 2)
- **Pros**: Simple, range queries efficient
- **Cons**: Hot spots (e.g., new users all go to last shard)

### Hash-Based Sharding
- Hash the shard key, assign to shard by hash % N
- **Pros**: Even distribution
- **Cons**: Range queries require all shards, resharding is painful

### Consistent Hashing
- Hash both keys and nodes onto a ring
- Key goes to nearest node clockwise
- Adding/removing nodes only affects adjacent keys (minimal resharding)
- **Virtual nodes**: Each physical node has multiple positions on ring for better balance
- **Used in**: Cassandra, DynamoDB, Redis Cluster

### Directory-Based Sharding
- Lookup table maps keys to shards
- **Pros**: Flexible, easy resharding
- **Cons**: Lookup table is a bottleneck and single point of failure

### Shard Key Selection
- High cardinality (many distinct values)
- Even distribution
- Aligns with access patterns
- Avoid hot keys (e.g., celebrity user ID)

### Problems with Sharding
- Cross-shard joins are expensive or impossible
- Cross-shard transactions are complex
- Resharding requires data migration

---

## 7. Common Database Patterns

### Read Replicas
- Offload read traffic from primary
- Acceptable for slightly stale reads
- Common in: reporting, analytics, search

### CQRS (Command Query Responsibility Segregation)
- Separate read and write models
- Write model: normalized, ACID
- Read model: denormalized, optimized for queries
- Often combined with Event Sourcing

### Event Sourcing
- Store sequence of events, not current state
- Rebuild state by replaying events
- **Pros**: Full audit log, time travel, easy event-driven integration
- **Cons**: Complexity, eventual consistency, event schema evolution

### Polyglot Persistence
- Use different databases for different parts of the system
- e.g., PostgreSQL for transactions, Redis for sessions, Elasticsearch for search, S3 for blobs

---

## 8. Choosing the Right Database

| Requirement | Choice |
|---|---|
| Complex queries, joins, ACID | PostgreSQL / MySQL |
| Massive write throughput, time-series | Cassandra |
| Flexible document storage | MongoDB |
| Key-value, caching, sessions | Redis |
| Full-text search | Elasticsearch |
| Graph relationships | Neo4j |
| Object/blob storage | S3 |
| Analytics / OLAP | BigQuery, Redshift, Snowflake |
| Message queue | Kafka, SQS |

---

## Interview Tips

- Always justify your DB choice with **specific requirements** (scale, consistency, query patterns)
- Mention **indexing strategy** when discussing DB schema
- For high-scale systems, proactively bring up **sharding and replication**
- Discuss **replication lag** and how your system handles stale reads
- At senior level: discuss **failure scenarios** — what happens if primary fails, if a shard goes down
`;

CONTENT['hld_06'] = `# Distributed Systems — Consistent Hashing, Consensus, Transactions

---

## 1. Consistent Hashing

### The Problem
- With N servers, naive hashing: \`server = hash(key) % N\`
- Adding/removing a server changes N → almost all keys remap → cache invalidation storm

### The Solution: Consistent Hashing
- Map both servers and keys onto a circular ring (0 to 2^32)
- Key is assigned to the first server clockwise on the ring
- Adding/removing a server only affects keys between it and its predecessor

### Virtual Nodes
- Each physical server has multiple positions (virtual nodes) on the ring
- More even distribution, especially with heterogeneous servers
- Typical: 100–200 virtual nodes per physical server
- Used in: Cassandra, DynamoDB, Redis Cluster

### Benefits
- Adding a server: only ~K/N keys need to move (K = total keys, N = servers)
- Removing a server: only that server's keys need to move
- Minimal disruption to the system

---

## 2. Consensus Algorithms

### The Problem
- Distributed nodes must agree on a single value (leader, log entry, config)
- Nodes can fail, messages can be delayed or lost

### Paxos
- Classic consensus algorithm (Lamport, 1989)
- Two phases: Prepare/Promise and Accept/Accepted
- Notoriously difficult to understand and implement correctly
- Used in: Google Chubby, some older systems

### Raft (more practical)
- Designed to be understandable
- Three roles: **Leader**, **Follower**, **Candidate**
- **Leader election**: Followers timeout → become candidate → request votes → majority wins
- **Log replication**: Leader receives writes → appends to log → replicates to followers → commits when majority ack
- **Safety**: Only nodes with up-to-date log can become leader

#### Raft Key Properties
- At most one leader per term
- Leader has all committed entries
- Entries committed only when stored on majority of nodes
- Used in: etcd, CockroachDB, TiKV, Consul

### ZooKeeper (ZAB protocol)
- Coordination service for distributed systems
- Leader election, distributed locks, configuration management
- Used by: Kafka (older versions), HBase, Hadoop

---

## 3. Distributed Transactions

### The Problem
- Transaction spans multiple services/databases
- Need atomicity across all of them

### Two-Phase Commit (2PC)
**Phase 1 (Prepare)**:
- Coordinator asks all participants: "Can you commit?"
- Each participant locks resources and responds Yes/No

**Phase 2 (Commit/Abort)**:
- If all Yes: Coordinator sends Commit
- If any No: Coordinator sends Abort

**Problems**:
- Coordinator is single point of failure
- Participants block waiting for coordinator (holding locks)
- Not partition tolerant

### Saga Pattern
- Break distributed transaction into sequence of local transactions
- Each step publishes event/message triggering next step
- On failure: execute compensating transactions to undo previous steps

**Choreography-based Saga**:
- Services react to events, no central coordinator
- Pros: Loose coupling
- Cons: Hard to track overall state, complex error handling

**Orchestration-based Saga**:
- Central orchestrator tells each service what to do
- Pros: Easier to track, centralized error handling
- Cons: Orchestrator can become bottleneck

**Example: Order placement**
\`\`\`
1. Create Order (pending)
2. Reserve Inventory → on fail: Cancel Order
3. Charge Payment → on fail: Release Inventory, Cancel Order
4. Ship Order → on fail: Refund Payment, Release Inventory, Cancel Order
5. Mark Order Complete
\`\`\`

---

## 4. Leader Election

### Why needed
- Designate one node to coordinate work (avoid conflicts)
- Used in: primary DB selection, distributed locks, job scheduling

### Approaches
- **ZooKeeper**: Create ephemeral sequential node; lowest sequence number wins
- **etcd/Raft**: Built-in leader election
- **Redis (Redlock)**: Acquire lock on majority of N Redis nodes

---

## 5. Distributed Locks

### Use Cases
- Prevent duplicate processing
- Coordinate access to shared resource
- Distributed cron jobs (only one instance runs)

### Redis-based Lock
\`\`\`
SET lock_key unique_value NX PX 30000
# NX = only set if not exists
# PX = expire in 30 seconds
\`\`\`
- Release: only delete if value matches (Lua script for atomicity)
- **Redlock**: Acquire on majority of N independent Redis nodes for safety

### Problems with Distributed Locks
- Lock holder can pause (GC, network) and lock expires → two holders
- Use fencing tokens (monotonically increasing number) to detect stale lock holders

---

## 6. Clock Synchronization

### The Problem
- Clocks on different machines drift
- Can't rely on timestamps for ordering events

### Logical Clocks (Lamport Timestamps)
- Each event increments a counter
- On message send: include counter
- On message receive: \`max(local, received) + 1\`
- Captures causality: if A → B, then timestamp(A) < timestamp(B)
- Doesn't capture concurrency

### Vector Clocks
- Each node maintains a vector of counters (one per node)
- Captures causality and concurrency
- Used in: Dynamo, Riak

### Hybrid Logical Clocks (HLC)
- Combines physical time with logical clock
- Used in: CockroachDB, YugabyteDB

---

## 7. Failure Detection

### Heartbeat
- Nodes send periodic heartbeats
- If no heartbeat within timeout → node considered failed
- Simple but can have false positives (slow network ≠ dead node)

### Phi Accrual Failure Detector
- Probabilistic failure detection
- Returns suspicion level (phi value) rather than binary alive/dead
- Used in: Cassandra, Akka

### Gossip Protocol
- Nodes randomly share state with other nodes
- Information propagates like a rumor
- Eventually all nodes know about failures
- Used in: Cassandra, DynamoDB, Consul

---

## 8. Data Consistency Patterns

### Read Repair
- On read, compare values from multiple replicas
- If inconsistent, repair the stale replica
- Used in: Cassandra, Dynamo

### Anti-Entropy
- Background process compares replicas and syncs differences
- Uses Merkle trees to efficiently find differences

### Quorum
- W + R > N guarantees at least one node has latest value
- N = total replicas, W = write quorum, R = read quorum
- Common: N=3, W=2, R=2 (strong consistency)
- N=3, W=1, R=1 (high availability, eventual consistency)

---

## 9. Service Discovery

### Client-Side Discovery
- Client queries service registry (Consul, Eureka)
- Client selects instance and makes request
- Pros: Client controls load balancing
- Cons: Client must implement discovery logic

### Server-Side Discovery
- Client sends request to load balancer
- Load balancer queries registry and routes
- Pros: Simple client
- Cons: Extra hop, load balancer must be highly available

### Service Mesh (Sidecar Pattern)
- Sidecar proxy (Envoy) handles discovery, load balancing, retries, circuit breaking
- Application code doesn't need to know about infrastructure
- Examples: Istio, Linkerd

---

## Interview Tips

- Consistent hashing comes up in almost every distributed system design — know it cold
- For any system requiring coordination, mention **leader election** and **distributed locks**
- Saga pattern is the go-to answer for distributed transactions at scale
- At senior level: discuss **failure modes** — what happens when coordinator fails in 2PC, when lock holder crashes, when network partitions
`;

CONTENT['hld_05'] = `# API Design — REST, gRPC, GraphQL, Rate Limiting, Pagination

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
\`\`\`
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
\`\`\`

### REST Best Practices
- Use nouns, not verbs in URLs
- Use plural nouns (\`/users\`, not \`/user\`)
- Version your API (\`/v1/users\`)
- Use query params for filtering/sorting/pagination
- Return consistent error format
- Use HTTPS always

---

## 2. gRPC

### What it is
- Google's RPC framework using Protocol Buffers (protobuf) for serialization
- Binary protocol (smaller, faster than JSON)
- HTTP/2 (multiplexing, streaming, header compression)
- Strongly typed contracts via \`.proto\` files

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
- Single endpoint (\`/graphql\`)
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
- Return \`429 Too Many Requests\`
- Include headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`

---

## 6. Pagination

### Offset Pagination
\`\`\`
GET /posts?page=2&limit=20
SELECT * FROM posts LIMIT 20 OFFSET 20
\`\`\`
- **Pros**: Simple, random access to any page
- **Cons**: Slow for large offsets (DB scans all rows), inconsistent if data changes

### Cursor-Based Pagination
\`\`\`
GET /posts?cursor=eyJpZCI6MTAwfQ&limit=20
SELECT * FROM posts WHERE id > 100 LIMIT 20
\`\`\`
- **Pros**: Consistent (no skipped/duplicated items), efficient (index seek)
- **Cons**: No random page access, cursor must be opaque to client
- **Best for**: Infinite scroll, real-time feeds

### Keyset Pagination
- Similar to cursor but uses actual column values
\`\`\`
GET /posts?after_id=100&limit=20
\`\`\`
- Efficient with proper index on sort column

### When to use what
- Offset: Admin panels, small datasets, need page numbers
- Cursor/Keyset: Social feeds, large datasets, infinite scroll

---

## 7. API Versioning

### URL Versioning (most common)
\`\`\`
/v1/users
/v2/users
\`\`\`
- Pros: Explicit, easy to route, cacheable
- Cons: URL pollution

### Header Versioning
\`\`\`
Accept: application/vnd.myapi.v2+json
\`\`\`
- Pros: Clean URLs
- Cons: Less visible, harder to test in browser

### Query Parameter
\`\`\`
/users?version=2
\`\`\`
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
`;

CONTENT['topics'] = `# Topics to Cover — Senior SWE Interview

---

## 1. Data Structures & Algorithms

### Patterns to Master
| Pattern | Key Problems |
|---|---|
| Sliding Window | Longest substring without repeat, Max sum subarray |
| Two Pointers | 3Sum, Container with most water |
| Fast & Slow Pointers | Linked list cycle, Middle of list |
| Merge Intervals | Merge intervals, Insert interval |
| Cyclic Sort | Find missing number, Find duplicate |
| BFS / DFS | Level order traversal, Number of islands |
| Binary Search | Search rotated array, Find minimum in rotated |
| Dynamic Programming | Coin change, Longest common subsequence, Edit distance |
| Backtracking | Subsets, Permutations, Word search |
| Heap / Top-K | K closest points, Top K frequent elements |
| Trie | Word search II, Implement Trie |
| Graph | Course schedule, Clone graph, Dijkstra |
| Union-Find | Number of connected components, Redundant connection |

### Complexity
- Know time and space complexity for every solution
- Be able to optimize from brute force → better → optimal

---

## 2. System Design (HLD)

### Core Concepts
- **Scalability**: Horizontal vs vertical, stateless services
- **Load Balancing**: Round robin, least connections, consistent hashing
- **Caching**: Write-through, write-back, write-around, eviction policies (LRU, LFU)
- **Databases**:
  - SQL: ACID, indexing, joins, normalization
  - NoSQL: DynamoDB, Cassandra, MongoDB — when to use each
  - Sharding strategies: range, hash, directory-based
  - Replication: leader-follower, multi-leader, leaderless
- **CAP Theorem**: Consistency vs Availability vs Partition tolerance
- **Message Queues**: Kafka (partitions, offsets, consumer groups), SQS, RabbitMQ
- **API Design**: REST best practices, gRPC, pagination, versioning
- **Rate Limiting**: Token bucket, leaky bucket, sliding window counter
- **CDN**: Push vs pull, edge caching
- **Consistent Hashing**: Virtual nodes, ring-based routing
- **Distributed Transactions**: 2PC, Saga pattern
- **Search**: Elasticsearch, inverted index
- **Blob Storage**: S3, object storage patterns

### Systems to Design (Practice These)
1. URL Shortener (TinyURL)
2. Twitter / News Feed (fan-out on write vs read)
3. WhatsApp / Chat System (WebSockets, message delivery guarantees)
4. YouTube / Netflix (video upload, streaming, CDN)
5. Uber / Lyft (geospatial indexing, matching, surge pricing)
6. Rate Limiter (distributed, Redis-based)
7. Distributed Cache (Redis cluster, eviction)
8. Search Autocomplete (Trie, top-K, caching)
9. Notification System (push, email, SMS, fan-out)
10. Distributed Job Scheduler (cron, priority queues, fault tolerance)
11. Key-Value Store (LSM tree, SSTables, compaction)
12. Web Crawler (BFS, politeness, deduplication)

### Framework for Answering
1. Clarify requirements (functional + non-functional)
2. Estimate scale (QPS, storage, bandwidth)
3. Define API endpoints
4. Design data model / schema
5. High-level architecture diagram
6. Deep dive into 1–2 components
7. Discuss trade-offs and bottlenecks

---

## 3. Low Level Design (OOD)

### SOLID Principles
- **S** — Single Responsibility
- **O** — Open/Closed
- **L** — Liskov Substitution
- **I** — Interface Segregation
- **D** — Dependency Inversion

### Design Patterns to Know
| Pattern | Use Case |
|---|---|
| Singleton | Config manager, Logger |
| Factory / Abstract Factory | Object creation without specifying class |
| Builder | Complex object construction |
| Observer | Event systems, pub/sub |
| Strategy | Interchangeable algorithms |
| Decorator | Add behaviour without subclassing |
| Adapter | Interface compatibility |
| Command | Undo/redo, task queues |
| Proxy | Lazy loading, access control |

### LLD Problems to Practice
- Parking Lot
- Library Management System
- Elevator System
- Chess / Snake and Ladder
- Hotel Booking System
- Food Delivery (Zomato/Swiggy)
- Splitwise / Expense Sharing

---

## 4. Behavioral / Leadership

### STAR Method
- **S**ituation — Set the context briefly
- **T**ask — What was your responsibility
- **A**ction — What YOU specifically did (use "I", not "we")
- **R**esult — Quantified outcome

### Stories to Prepare (map to your experience)
| Theme | Your Story Candidate |
|---|---|
| Most impactful project | Oracle Email Notifications (591 → 4000+ contacts) |
| Technical challenge | Dunston lazy parser (5x speed improvement) |
| Failure and learning | (pick one from your experience) |
| Conflict resolution | (cross-team coordination at Amazon/Oracle) |
| Leadership / influence | mhs-ai demo to service owner |
| Ambiguity | APEX team — new payment integrations |
| Mentoring | (if applicable) |

### Common Questions
- Tell me about yourself
- Why are you leaving your current role?
- Tell me about your most impactful project
- Tell me about a time you disagreed with your manager
- Tell me about a time you failed
- How do you handle competing priorities?
- Tell me about a time you influenced without authority
- Where do you see yourself in 5 years?

---

## 5. Resources

### Books
- *System Design Interview Vol 1 & 2* — Alex Xu ([ByteByteGo](https://bytebytego.com))
- *Designing Data-Intensive Applications* — Martin Kleppmann
- *Clean Code* — Robert C. Martin
- *The Pragmatic Programmer* — Hunt & Thomas

### Online Platforms
- [NeetCode.io](https://neetcode.io) — Best structured DSA roadmap
- [LeetCode](https://leetcode.com) — DSA practice
- [HelloInterview](https://www.hellointerview.com) — System design guides and mocks
- [ByteByteGo YouTube](https://www.youtube.com/@ByteByteGo) — Free system design videos
- [System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer) — Free comprehensive guide
- [Refactoring Guru](https://refactoring.guru/design-patterns) — Design patterns
- [Pramp](https://www.pramp.com) — Free peer mock interviews
- [Interviewing.io](https://interviewing.io) — Anonymous mock interviews with engineers
- [Excalidraw](https://excalidraw.com) — Diagramming for system design practice

### Blogs & Newsletters
- [The Pragmatic Engineer](https://blog.pragmaticengineer.com) — Engineering career and interviews
- [ByteByteGo Newsletter](https://blog.bytebytego.com) — Weekly system design
- [High Scalability](http://highscalability.com) — Real-world architecture case studies
`;

CONTENT['roadmap'] = `# Senior SWE Interview Roadmap

> Target: Senior Software Engineer (SDE-2 / L5 equivalent) at top tech companies
> Split: 40% System Design · 30% DSA · 30% Behavioral

---

## Phase 1 — Foundation (Weeks 1–2)

### DSA Refresh
- Revise core data structures: arrays, linked lists, trees, graphs, heaps
- Solve 2–3 Easy/Medium LeetCode problems daily
- Focus on pattern recognition, not memorization
- Resources:
  - [NeetCode 150](https://neetcode.io) — structured problem list
  - [LeetCode Blind 75](https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions)

### System Design Basics
- Read: *System Design Interview Vol 1* — Alex Xu (ByteByteGo)
- Watch: [ByteByteGo YouTube](https://www.youtube.com/@ByteByteGo) — free fundamentals
- Cover: CAP theorem, load balancing, caching, databases, CDN

### Behavioral Prep
- Write down 5 STAR stories from your experience
- Map each to common themes: impact, conflict, failure, leadership, ambiguity

---

## Phase 2 — Core Skill Building (Weeks 3–5)

### DSA
- Move to Medium/Hard problems
- Focus areas: DP, graphs, binary search, sliding window
- Target: 3–4 problems/day
- Resources:
  - [NeetCode Advanced](https://neetcode.io/roadmap)
  - [LeetCode company-tagged problems](https://leetcode.com/problemset/)

### System Design
- Read: *Designing Data-Intensive Applications* — Martin Kleppmann (DDIA)
  - Focus chapters: replication, partitioning, transactions, consistency
- Practice designing 2 systems/week with pen and paper
- Use the framework: Requirements → Estimation → API → Data Model → HLD → Deep Dive
- Resources:
  - [HelloInterview System Design](https://www.hellointerview.com)
  - [System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer)

### Low Level Design
- Study SOLID principles and top 5 design patterns
- Practice 1 LLD problem/week
- Resources:
  - [Refactoring Guru](https://refactoring.guru/design-patterns)

---

## Phase 3 — Interview Simulation (Weeks 6–8)

### DSA
- Timed practice: 45 min per problem, no hints
- Review all previously solved problems
- Focus on communication: explain approach before coding

### System Design
- Read: *System Design Interview Vol 2* — Alex Xu
- Do full mock designs for: Twitter, WhatsApp, YouTube, Uber, Rate Limiter
- Practice with a peer or use [Excalidraw](https://excalidraw.com) for diagrams

### Behavioral
- Practice all STAR stories out loud
- Record yourself — check for clarity, conciseness, confidence
- Resources:
  - [Amazon Leadership Principles](https://www.amazon.jobs/content/en/our-workplace/leadership-principles)
  - [Behavioral Interview Guide — leetcopilot.dev](https://leetcopilot.dev/blog/behavioral-interview-prep-complete-guide)

### Mock Interviews
- [Pramp](https://www.pramp.com) — free peer mock interviews
- [Interviewing.io](https://interviewing.io) — anonymous mock with engineers
- [HelloInterview](https://www.hellointerview.com) — system design mocks

---

## Phase 4 — Final Polish (Week 9–10)

- Revisit weak areas from mock feedback
- Re-read your STAR stories and tighten them
- Research each target company: tech stack, recent engineering blogs, culture
- Prepare smart questions to ask interviewers
- Review your resume and be ready to deep-dive any bullet point

---

## Key Principles for Senior Level

- **System design > DSA** at senior level — invest more time here
- **Communication matters** — think out loud, state assumptions, discuss trade-offs
- **Ownership signals** — show you've driven projects end-to-end, not just implemented tickets
- **Depth + breadth** — know one area deeply (your domain) and have breadth across the stack
- **Quantify everything** — in behavioral answers, always include numbers and impact
`;

