const mongoose = require('mongoose');

const connectionString = process.env.MONGODB_URI;
if (!connectionString) { console.error('❌ MONGODB_URI is not defined'); process.exit(1); }

async function cleanup() {
  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    
    // Delete all tables
    const result = await mongoose.connection.db.collection('tables').deleteMany({});
    console.log(`Deleted ${result.deletedCount} tables`);
    
    // Show remaining tables grouped by branch
    const remaining = await mongoose.connection.db.collection('tables').find({}).toArray();
    console.log(`Remaining tables: ${remaining.length}`);
    
    await mongoose.disconnect();
    console.log('Cleanup completed!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

cleanup();
