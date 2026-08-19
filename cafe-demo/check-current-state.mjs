import mongoose from 'mongoose';

const connectionString = process.env.MONGODB_URI;
if (!connectionString) { console.error('❌ MONGODB_URI is not defined'); process.exit(1); }

async function check() {
  try {
    await mongoose.connect(connectionString);
    const db = mongoose.connection.db;
    
    console.log('\n📊 CURRENT DATABASE STATE\n');
    console.log('━'.repeat(70));
    
    // Get branches
    const branches = await db.collection('branches').find({}).toArray();
    console.log(`\n✓ Branches: ${branches.length}`);
    branches.forEach(b => console.log(`  - ${b.nameAr} (${b._id})`));
    
    // Get tables by branch
    console.log(`\n✓ Tables by branch:`);
    for (const branch of branches) {
      const tables = await db.collection('tables').find({ branchId: branch._id }).toArray();
      console.log(`  - ${branch.nameAr}: ${tables.length} tables`);
      if (tables.length > 0 && tables.length <= 3) {
        tables.forEach(t => console.log(`    • Table ${t.tableNumber}`));
      }
    }
    
    // Get sample table
    console.log(`\n✓ Sample table document:`);
    const sample = await db.collection('tables').findOne({});
    if (sample) {
      console.log(`  - tableNumber: ${sample.tableNumber}`);
      console.log(`  - branchId: ${sample.branchId}`);
      console.log(`  - isActive: ${sample.isActive}`);
    }
    
    console.log('\n' + '━'.repeat(70));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
