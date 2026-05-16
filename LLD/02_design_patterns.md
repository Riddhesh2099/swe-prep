# Design Patterns

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

```java
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
```

**Use when**: Logger, config manager, connection pool, thread pool
**Pitfalls**: Hard to test (global state), violates SRP, issues in distributed systems

---

### 2. Factory Method
Define interface for creating objects; subclasses decide which class to instantiate.

```java
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
```

**Use when**: Object creation logic should be centralized; type determined at runtime

---

### 3. Abstract Factory
Factory of factories — create families of related objects.

```java
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
```

**Use when**: System must be independent of how its products are created; families of related objects

---

### 4. Builder
Construct complex objects step by step.

```java
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
```

**Use when**: Object has many optional parameters; avoid telescoping constructors

---

## STRUCTURAL PATTERNS

### 5. Adapter
Convert interface of a class into another interface clients expect.

```java
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
```

**Use when**: Integrating legacy code or third-party libraries with incompatible interfaces

---

### 6. Decorator
Add behaviour to objects dynamically without subclassing.

```java
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
```

**Use when**: Add responsibilities to objects at runtime; alternative to subclassing; Java I/O streams

---

### 7. Proxy
Provide a surrogate or placeholder for another object.

```java
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
```

**Types**:
- **Virtual Proxy**: Lazy initialization (above example)
- **Protection Proxy**: Access control
- **Remote Proxy**: Local representative for remote object
- **Caching Proxy**: Cache results of expensive operations

---

### 8. Facade
Provide simplified interface to complex subsystem.

```java
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
```

**Use when**: Simplify complex subsystem; provide clean API over legacy code; microservice API gateway

---

## BEHAVIORAL PATTERNS

### 9. Observer (Pub/Sub)
Define one-to-many dependency; when one object changes, all dependents notified.

```java
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
```

**Use when**: Event systems, MVC (model notifies views), message brokers

---

### 10. Strategy
Define family of algorithms, encapsulate each, make them interchangeable.

```java
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
```

**Use when**: Multiple algorithms for same task; switch algorithms at runtime; replace conditionals

---

### 11. Command
Encapsulate a request as an object, enabling undo/redo, queuing, logging.

```java
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
```

**Use when**: Undo/redo, transaction logging, task queues, macro recording

---

### 12. Template Method
Define skeleton of algorithm in base class; subclasses fill in specific steps.

```java
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
```

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
