# McDonald's Cooking Bot Order Controller

## Overview

This repository contains a functioning **UI prototype** for the **McDonald's Cooking Bot Order Controller**.

The application simulates a system that manages multiple cooking bots processing orders while maintaining **queue prioritization** and **concurrent order handling**.

The project is implemented as a **single-page React application** that fulfills the required behavior for:

* Concurrent order processing
* VIP queue prioritization
* Real-time order progress updates
* Dynamic bot creation and destruction

The prototype emphasizes **clean architecture**, **predictable state management**, and **clear separation between UI and business logic**.

---

# How to Run

The prototype is contained entirely within **a single `.jsx` file**, using:

* React state
* Tailwind CSS styling
* A standalone JavaScript controller for business logic

## Run Locally

### 1. Install dependencies

```bash
npm install
npm run dev
```

The application will run at:

```
http://localhost:5173
```

---

# Design Decisions & Clean Code Principles

## 1. Separation of Concerns (Domain vs View)

Instead of embedding business logic directly inside React hooks (`useState`, `useEffect`), the system introduces a **pure JavaScript class** called:

```
McDonaldsController
```

### Responsibilities

**Controller**

* Manages order queues
* Handles bot processing logic
* Controls timers
* Applies priority rules

**React Component**

* Initializes the controller
* Listens for updates via `onStateChange`
* Renders UI elements based on state

### Why?

Handling concurrent timers and state mutations directly inside React hooks can easily become complex and error-prone.

By separating the logic:

* Core logic becomes **unit-testable**
* UI remains **purely declarative**
* The system becomes **React StrictMode safe**
* Code remains **clean and maintainable**

---

## 2. Tick-Based Engine Instead of Multiple `setTimeout`

Rather than creating a `setTimeout` for every bot's **10-second processing time**, the controller uses a **single global `setInterval` that ticks every second**.

### Advantages

* Avoids managing multiple timer references
* Simplifies cancellation logic
* Handles bot destruction cleanly
* Enables real-time progress updates in the UI

### Processing Flow

Each tick:

1. Iterate through active bots
2. Decrement remaining processing time
3. Complete orders when timers reach zero
4. Assign new orders to available bots
5. Trigger UI updates

This approach prevents the complexity that arises from managing many asynchronous timers simultaneously.

---

## 3. Queue Resolution Using Sequential Order IDs

Requirement:
VIP orders must be placed **behind existing VIP orders**, not simply moved to the front of the queue.

### Solution

Each order receives a **sequential ID** when it is created.

Example:

```
1 - VIP
2 - VIP
3 - NORMAL
4 - VIP
```

Queue sorting logic:

```javascript
(a, b) => a.id - b.id
```

Combined with order-type checks:

* VIP orders are always prioritized over NORMAL orders
* Orders within the same type follow **chronological arrival order**

### Benefit

If a bot is destroyed while processing an order and the order returns to the queue, it **does not unfairly jump ahead of other VIP orders that arrived later**.

---

# Assumptions

## Timer Reset on Interruption

If a bot is destroyed while processing an order:

* The order returns to the **PENDING queue**
* The cooking timer **restarts from 10 seconds**

This simulates a new cooking sequence beginning.

---

## In-Memory State

To comply with the requirement:

* No persistence layer was implemented
* No LocalStorage
* No database

Refreshing the browser **resets the simulation state**.

---

# Tech Stack

* React
* Vite
* Tailwind CSS
* Lucide Icons