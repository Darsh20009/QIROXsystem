import mongoose from 'mongoose';

const connectionString = process.env.MONGODB_URI;
if (!connectionString) { console.error('❌ MONGODB_URI is not defined'); process.exit(1); }

async function cleanup() {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Delete ALL tables regardless of branchId
    const result = await db.collection('tables').deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} tables (all)\n`);
    
    // Verify deletion
    const remaining = await db.collection('tables').countDocuments({});
    console.log(`📊 Remaining tables in DB: ${remaining}`);
    
    if (remaining === 0) {
      console.log('\n✅ Database cleaned successfully!');
      console.log('📌 Next: Server will auto-seed 10 tables per branch on restart\n');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

cleanup();
