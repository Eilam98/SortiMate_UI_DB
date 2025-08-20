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

// Function to create a wrong classification document
async function createWrongClassification(binId = 'bin_001', modelClassification = 'Clothes', confidence = 0.85) {
  const timestamp = new Date().toISOString();
  const eventId = `wrong-classification-${Date.now()}`;
  const docId = `wrong_classification_${Date.now()}`;
  
  const wrongClassification = {
    bin_id: binId,
    confidence: confidence,
    event_id: eventId,
    image_cloudinary_url: `https://res.cloudinary.com/da7yuq42o/image/upload/test-${Date.now()}.jpg`,
    model_classification_waste_type: modelClassification,
    reviewed: false,
    timestamp: serverTimestamp(),
    user_answered: false
  };

  try {
    await setDoc(doc(db, 'wrong_classifications', docId), wrongClassification);
    console.log('✅ Wrong classification created successfully!');
    console.log('📄 Document ID:', docId);
    console.log('⚠️ Wrong classification data:', wrongClassification);
    console.log('⏰ Created at:', timestamp);
    return true;
  } catch (error) {
    console.error('❌ Error creating wrong classification:', error);
    return false;
  }
}

// Function to create multiple wrong classifications
async function createMultipleWrongClassifications(count = 3) {
  const modelClassifications = ['Clothes', 'Paper', 'Metal', 'Plastic', 'Glass'];
  const binIds = ['bin_001', 'bin_002', 'bin_003'];
  
  console.log(`🔄 Creating ${count} wrong classifications...`);
  
  for (let i = 0; i < count; i++) {
    const randomClassification = modelClassifications[Math.floor(Math.random() * modelClassifications.length)];
    const randomBinId = binIds[Math.floor(Math.random() * binIds.length)];
    const randomConfidence = 0.6 + Math.random() * 0.3; // Between 0.6 and 0.9
    
    console.log(`\n📝 Creating wrong classification ${i + 1}/${count}:`);
    console.log(`   Bin ID: ${randomBinId}`);
    console.log(`   Model Classification: ${randomClassification}`);
    console.log(`   Confidence: ${randomConfidence.toFixed(3)}`);
    
    const success = await createWrongClassification(randomBinId, randomClassification, randomConfidence);
    
    if (success) {
      console.log(`✅ Wrong classification ${i + 1} created successfully!`);
    } else {
      console.log(`❌ Failed to create wrong classification ${i + 1}`);
    }
    
    // Add a small delay between creations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 All wrong classifications created!');
}

// Function to create a specific wrong classification for testing
async function createTestWrongClassification() {
  console.log('🧪 Creating test wrong classification for bin_001...');
  
  const success = await createWrongClassification(
    'bin_001',           // bin_id
    'Clothes',           // model_classification_waste_type
    0.75                 // confidence
  );
  
  if (success) {
    console.log('🎯 Test wrong classification ready! Check your recycling session.');
    console.log('💡 The modal should appear immediately in your active recycling session.');
  } else {
    console.log('❌ Failed to create test wrong classification');
  }
}

// Main execution
async function main() {
  console.log('🚀 Wrong Classification Test Script');
  console.log('=====================================\n');
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      await createTestWrongClassification();
      break;
    case 'multiple':
      const count = parseInt(args[1]) || 3;
      await createMultipleWrongClassifications(count);
      break;
    case 'custom':
      const binId = args[1] || 'bin_001';
      const classification = args[2] || 'Clothes';
      const confidence = parseFloat(args[3]) || 0.75;
      await createWrongClassification(binId, classification, confidence);
      break;
    default:
      console.log('Usage:');
      console.log('  node create-wrong-classification.js test                    - Create a test wrong classification for bin_001');
      console.log('  node create-wrong-classification.js multiple [count]        - Create multiple random wrong classifications');
      console.log('  node create-wrong-classification.js custom [binId] [type] [confidence] - Create custom wrong classification');
      console.log('\nExamples:');
      console.log('  node create-wrong-classification.js test');
      console.log('  node create-wrong-classification.js multiple 5');
      console.log('  node create-wrong-classification.js custom bin_001 Paper 0.8');
      break;
  }
}

// Run the script
main().catch(console.error);
