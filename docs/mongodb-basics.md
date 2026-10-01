# MongoDB Basics

A foundational overview of MongoDB core concepts, data structures, and fundamental operations.

---

## 1. Core Terminology & Relational Comparison

| Relational Database (RDBMS) | MongoDB | Description |
| :--- | :--- | :--- |
| **Database** | **Database** | Physical container for collections. |
| **Table** | **Collection** | Group of MongoDB documents (schema-flexible). |
| **Row** | **Document** | A single record stored in BSON (Binary JSON) format. |
| **Column** | **Field** | Key-value pair in a document. |
| **Primary Key** | **`_id` Field** | Automatically indexed unique identifier for each document. |
| **Index** | **Index** | B-Tree data structure for fast query lookups. |
| **JOIN** | **`$lookup` / Embedding**| Linking data via embedded subdocuments or aggregation. |

---

## 2. Document Structure (BSON)

MongoDB stores documents as **BSON** (Binary JSON), extending JSON to support types like `ObjectId`, `Date`, `Long`, and `Binary`.

```json
{
  "_id": ObjectId("65c829e1f1a23b45c6789def"),
  "orderId": 1001,
  "userId": 42,
  "customer": {
    "name": "Alex",
    "email": "alex@example.com"
  },
  "items": [
    { "sku": "A100", "qty": 2, "price": 29.99 },
    { "sku": "B200", "qty": 1, "price": 14.50 }
  ],
  "totalAmount": 74.48,
  "status": "completed",
  "createdAt": ISODate("2026-10-01T12:00:00Z")
}
```

---

## 3. Essential CRUD Operations

### Switch / Create Database
```javascript
use ecommerce
```

### Create (Insert)
```javascript
// Insert one document
db.orders.insertOne({
  orderId: 1,
  userId: 101,
  amount: 250,
  status: "completed"
});

// Insert multiple documents
db.orders.insertMany([
  { orderId: 2, userId: 102, amount: 80, status: "pending" },
  { orderId: 3, userId: 103, amount: 450, status: "completed" }
]);
```

### Read (Query)
```javascript
// Find all documents
db.orders.find();

// Find with equality filter
db.orders.find({ status: "completed" });

// Find with comparison operators ($gt, $gte, $lt, $lte, $in)
db.orders.find({ amount: { $gte: 100 } });

// Find one document
db.orders.findOne({ orderId: 1 });

// Projection (select specific fields, 1 = include, 0 = exclude)
db.orders.find({ status: "completed" }, { orderId: 1, amount: 1, _id: 0 });

// Count documents
db.orders.countDocuments({ status: "completed" });
```

### Update
```javascript
// Update one document
db.orders.updateOne(
  { orderId: 1 },
  { $set: { status: "shipped", updatedAt: new Date() } }
);

// Update multiple documents
db.orders.updateMany(
  { status: "pending" },
  { $set: { status: "processing" } }
);
```

### Delete
```javascript
// Delete one document
db.orders.deleteOne({ orderId: 1 });

// Delete multiple documents
db.orders.deleteMany({ status: "cancelled" });
```

---

## 4. Indexes & Performance

Indexes support the efficient execution of queries in MongoDB. Without indexes, MongoDB must perform a collection scan (read every document in a collection to select matching documents).

```javascript
// Single field index
db.orders.createIndex({ orderId: 1 }); // 1 = Ascending, -1 = Descending

// Compound index
db.orders.createIndex({ userId: 1, createdAt: -1 });

// Unique index
db.orders.createIndex({ orderId: 1 }, { unique: true });

// View all indexes on collection
db.orders.getIndexes();

// Explain plan (analyze query execution and index usage)
db.orders.find({ orderId: 500 }).explain("executionStats");
```

---

## 5. Summary Mental Model

```
Database
  └── Collection (e.g. `orders`)
        ├── Document 1: { _id, orderId: 1, ... }
        ├── Document 2: { _id, orderId: 2, ... }
        └── Document N: ...
```
