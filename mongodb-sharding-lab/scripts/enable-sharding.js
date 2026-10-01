// Enable Sharding for ecommerce database and shard ecommerce.orders collection
sh.enableSharding("ecommerce");

// Switch to ecommerce and ensure shard key index exists
db = db.getSiblingDB("ecommerce");
db.orders.createIndex({ orderId: 1 });

// Shard the collection using orderId as the shard key
sh.shardCollection("ecommerce.orders", { orderId: 1 });

print("Sharding enabled on ecommerce.orders with shard key { orderId: 1 }");
