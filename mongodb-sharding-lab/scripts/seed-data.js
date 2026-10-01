// Seed 100,000 orders into ecommerce.orders
db = db.getSiblingDB("ecommerce");

print("Inserting 100,000 orders in batches...");
const totalDocs = 100000;
const batchSize = 5000;

for (let i = 1; i <= totalDocs; i += batchSize) {
    let batch = [];
    for (let j = i; j < i + batchSize && j <= totalDocs; j++) {
        batch.push({
            orderId: j,
            userId: j % 10000,
            amount: Math.floor(Math.random() * 10000),
            status: "completed",
            createdAt: new Date()
        });
    }
    db.orders.insertMany(batch);
    print(`Inserted batch up to orderId: ${Math.min(i + batchSize - 1, totalDocs)}`);
}

print("Finished inserting documents.");
print(`Total document count: ${db.orders.countDocuments()}`);
