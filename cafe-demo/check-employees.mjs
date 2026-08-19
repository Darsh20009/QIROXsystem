import mongoose from 'mongoose';

const connectionString = process.env.MONGODB_URI;
if (!connectionString) { console.error('❌ MONGODB_URI is not defined'); process.exit(1); }

async function check() {
  try {
    await mongoose.connect(connectionString);
    const db = mongoose.connection.db;
    
    // Get branches
    const branches = await db.collection('branches').find({}).toArray();
    const branchMap = {};
    branches.forEach(b => branchMap[b._id.toString()] = b.nameAr);
    
    // Get employees
    const employees = await db.collection('employees').find({}).toArray();
    console.log('\n👥 Employees by branch:\n');
    
    const byBranch = {};
    employees.forEach(emp => {
      const bid = emp.branchId?.toString() || 'NO_BRANCH';
      if (!byBranch[bid]) byBranch[bid] = [];
      byBranch[bid].push({ name: emp.fullName, role: emp.role, username: emp.username });
    });
    
    Object.entries(byBranch).forEach(([bid, emps]) => {
      const branchName = branchMap[bid] || 'Unknown';
      console.log(`🏢 ${branchName}`);
      emps.forEach(e => {
        console.log(`   👤 ${e.name} (${e.role}) - @${e.username}`);
      });
      console.log();
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
