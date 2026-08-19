import mongoose from 'mongoose';

const connectionString = process.env.MONGODB_URI;
if (!connectionString) { console.error('❌ MONGODB_URI is not defined'); process.exit(1); }

async function fixIndexes() {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const tablesCollection = db.collection('tables');
    
    // Delete all tables first (final cleanup)
    const deleteResult = await tablesCollection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} tables\n`);
    
    // Drop the old single-column index if it exists
    try {
      await tablesCollection.dropIndex('tableNumber_1');
      console.log('🗑️  Dropped old index: tableNumber_1');
    } catch (err) {
      console.log('ℹ️  Old index not found (already dropped)');
    }
    
    console.log('\n✅ Index cleanup completed!');
    console.log('📌 Server will recreate correct indexes on restart\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixIndexes();
