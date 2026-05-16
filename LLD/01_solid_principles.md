# SOLID Principles

---

## Overview

SOLID is an acronym for five design principles that make software more maintainable, flexible, and scalable. At senior level, you're expected to not just recite them but apply them in code reviews and design discussions.

---

## S — Single Responsibility Principle (SRP)

> A class should have only one reason to change.

Each class/module should do one thing and do it well.

### Bad Example
```java
class UserService {
    public void createUser(User user) { /* DB logic */ }
    public void sendWelcomeEmail(User user) { /* Email logic */ }
    public void generateReport(User user) { /* Report logic */ }
}
```
This class changes if DB logic changes, email logic changes, OR report logic changes.

### Good Example
```java
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
```

### Interview Application
- "I'd split this into separate services — one for business logic, one for persistence, one for notifications"
- Microservices are SRP at the service level

---

## O — Open/Closed Principle (OCP)

> Software entities should be open for extension but closed for modification.

Add new behaviour by adding new code, not changing existing code.

### Bad Example
```java
class DiscountCalculator {
    public double calculate(String customerType, double price) {
        if (customerType.equals("REGULAR")) return price * 0.9;
        if (customerType.equals("PREMIUM")) return price * 0.8;
        // Adding VIP requires modifying this class
        if (customerType.equals("VIP")) return price * 0.7;
        return price;
    }
}
```

### Good Example
```java
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
```

### Interview Application
- Strategy pattern, plugin architectures, feature flags
- "Instead of adding another if-else, I'd use a strategy pattern so new payment methods can be added without touching existing code"

---

## L — Liskov Substitution Principle (LSP)

> Subtypes must be substitutable for their base types without altering correctness.

If S is a subtype of T, you should be able to use S wherever T is expected.

### Bad Example
```java
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
```

### Good Example
```java
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
```

### Interview Application
- "I'd check if inheritance is the right relationship here — 'is-a' vs 'has-a'"
- Prefer composition over inheritance when LSP would be violated

---

## I — Interface Segregation Principle (ISP)

> Clients should not be forced to depend on interfaces they don't use.

Split large interfaces into smaller, more specific ones.

### Bad Example
```java
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
```

### Good Example
```java
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
```

### Interview Application
- "I'd break this interface into smaller ones so services only depend on what they need"
- Reduces coupling, makes mocking in tests easier

---

## D — Dependency Inversion Principle (DIP)

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

Depend on interfaces/abstractions, not concrete implementations.

### Bad Example
```java
class OrderService {
    private MySQLDatabase db = new MySQLDatabase(); // Tightly coupled to MySQL!
    
    public void placeOrder(Order order) {
        db.save(order);
    }
}
```

### Good Example
```java
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
```

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
