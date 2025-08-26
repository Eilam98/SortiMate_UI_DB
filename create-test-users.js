import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKRSZOGEyYLcmAVEVb26nJs-9FTZfYZEQ",
  authDomain: "sortimate0.firebaseapp.com",
  projectId: "sortimate0",
  storageBucket: "sortimate0.firebasestorage.app",
  messagingSenderId: "673761246323",
  appId: "1:673761246323:web:abe937aefbb92e7ffe3e06",
  measurementId: "G-3MDT9XX5VJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const createTestUsers = async () => {
  try {
    console.log('🧪 Creating test users...');
    
    // Generate test users
    const testUsers = [];
    const startId = 100000001; // Starting ID number
    
    for (let i = 0; i < 50; i++) { // Create 50 test users
      const userId = (startId + i).toString();
      const firstName = `Test${i + 1}`;
      const lastName = `User${i + 1}`;
      const email = `test${i + 1}@example.com`;
      
      testUsers.push({
        user_id: userId,
        auth_uid: `test_uid_${i + 1}`,
        first_name: firstName,
        last_name: lastName,
        email: email,
        created_at: new Date(),
        recycle_stats: { 
          metal: Math.floor(Math.random() * 50), 
          glass: Math.floor(Math.random() * 50), 
          other: Math.floor(Math.random() * 30), 
          plastic: Math.floor(Math.random() * 100) 
        },
        total_points: Math.floor(Math.random() * 500),
        items_recycled: Math.floor(Math.random() * 200),
        family: { 
          group_id: '', 
          is_current_winner: false, 
          total_wins: 0 
        },
        role: 'user',
        last_activity: new Date()
      });
    }
    
    // Check for existing users to avoid duplicates
    console.log('🔍 Checking for existing users...');
    const existingUsersQuery = query(collection(db, 'users'), where('user_id', '>=', startId.toString()));
    const existingUsersSnapshot = await getDocs(existingUsersQuery);
    const existingIds = new Set();
    
    existingUsersSnapshot.forEach(doc => {
      existingIds.add(doc.data().user_id);
    });
    
    console.log(`📊 Found ${existingIds.size} existing users in range`);
    
    // Filter out existing users
    const newUsers = testUsers.filter(user => !existingIds.has(user.user_id));
    
    if (newUsers.length === 0) {
      console.log('✅ All test users already exist!');
      return;
    }
    
    // Add new users
    console.log(`📝 Creating ${newUsers.length} new test users...`);
    let createdCount = 0;
    
    for (const user of newUsers) {
      try {
        await addDoc(collection(db, 'users'), user);
        createdCount++;
        
        if (createdCount % 10 === 0) {
          console.log(`✅ Created ${createdCount} users so far...`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${user.user_id}:`, error);
      }
    }
    
    console.log(`🎉 Successfully created ${createdCount} test users!`);
    console.log('📋 Test user IDs range:', `${startId} to ${startId + newUsers.length - 1}`);
    console.log('💡 You can now sign up with any of these IDs for testing');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
  
  console.log('🏁 Test user creation completed');
  process.exit(0);
};

// Run the script
createTestUsers();
