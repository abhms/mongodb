// Insert test document with majority write concern
use testdb;

db.failoverTest.insertOne(
  { testId: 1, timestamp: new Date(), description: "Pre-failover write test" },
  { writeConcern: { w: "majority", wtimeout: 5000 } }
);

print("Write succeeded. Current Replica Set Status:");
printjson(rs.status().members.map(m => ({ name: m.name, stateStr: m.stateStr, health: m.health })));
