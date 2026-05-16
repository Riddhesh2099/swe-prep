# OOD Problems — Worked Solutions

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
```
ParkingLot, Floor, ParkingSpot, Vehicle, Ticket, FeeCalculator
```

### Design
```java
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
```

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
```
ElevatorSystem, Elevator, Request, ElevatorController, Direction
```

### Design
```java
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
```

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
```
Game, Board, Piece (King, Queen, Rook, Bishop, Knight, Pawn), Player, Move, Cell
```

### Design
```java
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
```

---

## 4. Hotel Booking System

### Requirements
- Search available rooms by date range, type
- Book room, cancel booking
- Multiple room types (single, double, suite)
- Pricing varies by room type and season

### Design
```java
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
```

---

## 5. Splitwise (Expense Sharing)

### Requirements
- Add expense, split among group members
- Track who owes whom
- Settle up (minimize transactions)

### Design
```java
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
```

---

## Interview Tips

- Start with **use cases**, not classes — "What does the system need to do?"
- Use **interfaces** for anything that might vary (pricing, selection strategy)
- Show **extensibility** — "If we wanted to add a new vehicle type, we'd just add a new class"
- At senior level: discuss **concurrency** — what if two users book the same room simultaneously? (optimistic locking, DB transactions)
- Mention **edge cases**: What if elevator is in maintenance? What if parking lot is full?
