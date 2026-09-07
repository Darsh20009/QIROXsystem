import mongoose from 'mongoose';

const connectionString = process.env.MONGODB_URI;
if (!connectionString) { console.error('❌ MONGODB_URI is not defined'); process.exit(1); }

async function verify() {
  try {
    await mongoose.connect(connectionString);
    const db = mongoose.connection.db;
    
    // Get branches
    const branches = await db.collection('branches').find({}).toArray();
    console.log('\n📍 Branches:');
    branches.forEach(b => console.log(`  - ${b.nameAr} (${b._id})`));
    
    // Get tables grouped by branch
    const tables = await db.collection('tables').find({}).toArray();
    console.log(`\n📊 Total tables: ${tables.length}\n`);
    
    const byBranch = {};
    tables.forEach(t => {
      const bid = t.branchId || 'NO_BRANCH_ID';
      if (!byBranch[bid]) byBranch[bid] = [];
      byBranch[bid].push(t.tableNumber);
    });
    
    Object.entries(byBranch).forEach(([bid, nums]) => {
      const branchName = branches.find(b => b._id.toString() === bid)?.nameAr || bid;
      console.log(`✅ ${branchName}: ${nums.length} tables`);
      console.log(`   Numbers: ${nums.sort((a,b)=>parseInt(a)-parseInt(b)).join(', ')}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

verify();
