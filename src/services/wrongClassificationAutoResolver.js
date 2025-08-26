import { getFirestore, collection, onSnapshot, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';

class WrongClassificationAutoResolver {
  constructor() {
    this.db = getFirestore();
    this.listener = null;
    this.isInitialized = false;
  }

  // Initialize the auto-resolver service
  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ WrongClassificationAutoResolver already initialized');
      return;
    }

    console.log('🔄 Initializing WrongClassificationAutoResolver...');
    
    // Set up listener for new wrong classifications
    const wrongClassificationsQuery = query(
      collection(this.db, 'wrong_classifications'),
      where('user_answered', '==', false)
    );

    this.listener = onSnapshot(wrongClassificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const wrongClassification = { id: change.doc.id, ...change.doc.data() };
          console.log('⚠️ New wrong classification detected:', wrongClassification);
          this.handleNewWrongClassification(wrongClassification);
        }
      });
    });

    this.isInitialized = true;
    console.log('✅ WrongClassificationAutoResolver initialized successfully');
  }

  // Handle new wrong classification
  async handleNewWrongClassification(wrongClassification) {
    try {
      const { bin_id } = wrongClassification;
      
      if (!bin_id) {
        console.log('⚠️ Wrong classification has no bin_id, skipping auto-resolution');
        return;
      }

      console.log(`🔍 Checking bin ${bin_id} for active user...`);
      
      // Check if the bin has an active user
      const binRef = doc(this.db, 'bins', bin_id);
      const binSnap = await getDoc(binRef);
      
      if (!binSnap.exists()) {
        console.log(`⚠️ Bin ${bin_id} not found, skipping auto-resolution`);
        return;
      }

      const binData = binSnap.data();
      const hasActiveUser = binData.active_user === true;

      console.log(`📊 Bin ${bin_id} active_user status:`, hasActiveUser);

      // If no active user, auto-resolve the wrong classification
      if (!hasActiveUser) {
        console.log(`🔄 Auto-resolving wrong classification for bin ${bin_id} (no active user)`);
        await this.autoResolveWrongClassification(wrongClassification.id);
      } else {
        console.log(`⏳ Wrong classification for bin ${bin_id} has active user, leaving for manual resolution`);
      }

    } catch (error) {
      console.error('❌ Error handling wrong classification:', error);
    }
  }

  // Auto-resolve wrong classification
  async autoResolveWrongClassification(wrongClassificationId) {
    try {
      const wrongClassificationRef = doc(this.db, 'wrong_classifications', wrongClassificationId);
      
      await updateDoc(wrongClassificationRef, {
        user_answered: true,
        user_classified_type: 'other',
        auto_resolved: true,
        auto_resolved_at: new Date()
      });

      console.log(`✅ Auto-resolved wrong classification ${wrongClassificationId} with type "other"`);
    } catch (error) {
      console.error('❌ Error auto-resolving wrong classification:', error);
    }
  }

  // Cleanup the service
  cleanup() {
    if (this.listener) {
      console.log('🔄 Cleaning up WrongClassificationAutoResolver...');
      this.listener();
      this.listener = null;
      this.isInitialized = false;
      console.log('✅ WrongClassificationAutoResolver cleaned up');
    }
  }
}

// Create singleton instance
const wrongClassificationAutoResolver = new WrongClassificationAutoResolver();

export default wrongClassificationAutoResolver;
