# MongoDB Troubleshooting Guide

A practical troubleshooting manual addressing common setup issues, error messages, and debugging steps.

---

## 1. Common Errors & Solutions

### Issue 1: `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017` on `mongos`
**Symptom:**
Connecting to `mongos` fails immediately with connection refused.

**Root Cause:**
`mongos` cannot start because the Config Server replica set (`configRS`) has not yet been initialized. `mongos` requires an active primary on the config server to load its metadata before it can open its listening port.

**Solution:**
Connect to the `config` container and initiate its replica set:
```bash
docker exec -it config mongosh
```
```javascript
rs.initiate({
  _id: "configRS",
  configsvr: true,
  members: [{ _id: 0, host: "config:27017" }]
})
```
Once `configRS` is initiated, `mongos` will automatically connect and become accessible.

---

### Issue 2: `MongoServerError[CommandNotFound]: no such command: 'addShard'`
**Symptom:**
Running `sh.addShard(...)` yields `CommandNotFound` or warning `[SHAPI-10003] You are not connected to a mongos`.

**Root Cause:**
The command was executed inside a shard node (e.g. `shard1a`) or config server instead of the `mongos` query router.

**Solution:**
Always run cluster management commands (`sh.addShard`, `sh.enableSharding`, `sh.shardCollection`, `sh.status`, etc.) inside `mongos`:
```bash
docker exec -it mongos mongosh
```

---

### Issue 3: `MongoServerError[AlreadyInitialized]: already initialized`
**Symptom:**
Calling `rs.initiate(...)` returns an error saying the replica set is already initialized.

**Root Cause:**
`rs.initiate(...)` was already run on this node or replica set previously.

**Solution:**
Check the existing state instead:
```javascript
rs.status()
```
If you need to change members or configurations, use `rs.reconfig(...)` instead of `rs.initiate(...)`.

---

### Issue 4: `zsh: unknown file attribute:` in Host Terminal
**Symptom:**
Pasting JavaScript commands (like `rs.initiate({ ... })`) directly into the macOS/Linux terminal shell.

**Root Cause:**
`zsh` interprets parentheses and curly braces as shell expansion operators.

**Solution:**
Ensure you are inside the MongoDB Shell (`mongosh`) before pasting JS commands, or wrap commands in quotes when using `--eval`:
```bash
docker exec -i config mongosh --eval 'rs.initiate({ _id: "configRS", configsvr: true, members: [{ _id: 0, host: "config:27017" }] })'
```

---

## 2. Useful Debugging & Diagnostic Commands

### Check Container Status
```bash
docker compose ps
```

### Inspect Container Logs
```bash
# View mongos router logs
docker logs mongos --tail 100

# View config server logs
docker logs config --tail 100

# View shard logs
docker logs shard1a --tail 100
```

### Check Replication State Inside Any Node
```javascript
rs.status()
```
Key fields to check:
- `myState`: 1 = Primary, 2 = Secondary.
- `health`: 1 = Healthy, 0 = Unreachable.
- `lastHeartbeatMessage`: Explains why a peer node is disconnected.

### Check Sharding & Balancing State Inside `mongos`
```javascript
sh.status()

// Check if balancer is active
sh.isBalancerRunning()

// Check balancer status
sh.getBalancerState()
```
