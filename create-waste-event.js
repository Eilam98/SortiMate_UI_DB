import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq',
  authDomain: 'sortimate0.firebaseapp.com',
  projectId: 'sortimate0',
  storageBucket: 'sortimate0.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to create a waste event
async function createWasteEvent(binId = 'bin_001', wasteType = 'METAL', confidence = 0.85) {
  const timestamp = new Date().toISOString();
  const eventId = `manual-test-${Date.now()}`;
  const docId = `manual_test_${Date.now()}`;
  
  const wasteEvent = {
    bin_id: binId,
    confidence: confidence,
    event_id: eventId,
    timestamp: serverTimestamp(),
    waste_type: wasteType
  };

  try {
    await setDoc(doc(db, 'waste_events', docId), wasteEvent);
    console.log('✅ Waste event created successfully!');
    console.log('📄 Document ID:', docId);
    console.log('🗑️ Event data:', wasteEvent);
    console.log('⏰ Created at:', timestamp);
    return true;
  } catch (error) {
    console.error('❌ Error creating waste event:', error);
    return false;
  }
}

// Function to create multiple waste events
async function createMultipleWasteEvents(count = 3) {
  const wasteTypes = ['METAL', 'PLASTIC', 'GLASS'];
  
  for (let i = 0; i < count; i++) {
    const wasteType = wasteTypes[i % wasteTypes.length];
    const confidence = 0.8 + (Math.random() * 0.2); // Random confidence between 0.8-1.0
    
    console.log(`\n🔄 Creating waste event ${i + 1}/${count}...`);
    await createWasteEvent('bin_001', wasteType, confidence);
    
    // Wait 1 second between events
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n🎉 All waste events created!');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.length === 0) {
      // Default: create one METAL waste event
      console.log('🎯 Creating default METAL waste event...');
      await createWasteEvent();
    } else if (args[0] === 'multiple') {
      // Create multiple waste events
      const count = parseInt(args[1]) || 3;
      console.log(`🎯 Creating ${count} waste events...`);
      await createMultipleWasteEvents(count);
    } else if (args[0] === 'custom') {
      // Create custom waste event
      const binId = args[1] || 'bin_001';
      const wasteType = args[2] || 'METAL';
      const confidence = parseFloat(args[3]) || 0.85;
      
      console.log(`🎯 Creating custom waste event: ${wasteType} for ${binId} with confidence ${confidence}`);
      await createWasteEvent(binId, wasteType, confidence);
    } else {
      console.log('📖 Usage:');
      console.log('  node create-waste-event.js                    # Create default METAL event');
      console.log('  node create-waste-event.js multiple [count]   # Create multiple events');
      console.log('  node create-waste-event.js custom [binId] [wasteType] [confidence]  # Create custom event');
      console.log('');
      console.log('📝 Examples:');
      console.log('  node create-waste-event.js');
      console.log('  node create-waste-event.js multiple 5');
      console.log('  node create-waste-event.js custom bin_001 PLASTIC 0.92');
    }
    
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    // Force exit after a short delay to ensure Firebase operations complete
    setTimeout(() => {
      console.log('🚪 Exiting...');
      process.exit(0);
    }, 1000);
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
