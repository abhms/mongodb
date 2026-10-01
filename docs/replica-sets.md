# MongoDB Replica Sets

A detailed guide to High Availability, Data Redundancy, and Automatic Failover in MongoDB.

---

## 1. What is a Replica Set?

A **Replica Set** in MongoDB is a group of `mongod` processes that maintain the same data set. Replica sets provide **redundancy** and **high availability**, acting as the foundation for all production deployments (including each shard in a sharded cluster).

```
                      +-------------------+
                      |   Client / Driver |
                      +---------+---------+
                                |
                         Writes | (Reads by default)
                                v
                      +-------------------+
                      |      PRIMARY      | (mongo1)
                      +----+---------+----+
                           |         |
              Replication  |         | Replication
                  (Oplog)  |         | (Oplog)
                           v         v
             +---------------+     +---------------+
             |   SECONDARY   |     |   SECONDARY   |
             |   (mongo2)    |     |   (mongo3)    |
             +---------------+     +---------------+
```

---

## 2. Replica Set Member Roles

| Role | Responsibilities |
| :--- | :--- |
| **Primary** | The only member that receives write operations. Records all operations into its **oplog** (operations log). |
| **Secondary** | Replicates the primary's oplog and applies the operations asynchronously to stay in sync. Can serve read operations if read preferences are configured. |
| **Arbiter** *(optional)* | Holds no data. Participates in elections only to break ties in voting. |

---

## 3. Automatic Failover & Elections

If the Primary becomes unreachable (heartbeat fails for >10 seconds by default), the remaining Secondaries hold an election to elect a new Primary.

```
1. Primary crashes/disconnects.
2. Secondaries detect heartbeat timeout.
3. Secondaries nominate themselves based on highest optime / priority.
4. Majority vote is reached (e.g. 2 out of 3 votes).
5. Elected secondary transitions to PRIMARY.
```

---

## 4. Key Management Commands

### Initialize a Replica Set
Run inside `mongosh` connected to the candidate member:
```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 1 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
})
```

### Inspect Replica Set Health
```javascript
// Quick overview of status, states, sync sources, and optimes
rs.status()

// View replica set configuration
rs.conf()

// Check if the current connected node is Primary
db.isMaster() // or db.hello()
```

### Member State Reference
- `PRIMARY (1)`: Active write leader.
- `SECONDARY (2)`: Replicating backup.
- `RECOVERING (3)`: Catching up or validating data.
- `STARTUP / STARTUP2 (0, 5)`: Initializing and loading config.
- `DOWN (8)`: Node unreachable.

---

## 5. Write Concerns & Read Preferences

### Write Concern
Controls the level of acknowledgment requested from MongoDB for write operations:
- `w: 1`: Acknowledged by Primary only (fastest, default).
- `w: "majority"`: Acknowledged by a majority of voting replica set members (crash resilient).
- `j: true`: Acknowledged once written to the on-disk journal.

```javascript
db.orders.insertOne(
  { orderId: 99, status: "paid" },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
)
```

### Read Preference
Determines where read queries are routed:
- `primary`: Default. Always reads from Primary.
- `primaryPreferred`: Reads from Primary; falls back to Secondary if Primary is down.
- `secondary`: Always reads from Secondary nodes.
- `secondaryPreferred`: Reads from Secondary; falls back to Primary.
- `nearest`: Reads from the node with lowest network latency.

```javascript
// Enable reading from secondary in mongosh session
db.getMongo().setReadPref("secondaryPreferred")
```
