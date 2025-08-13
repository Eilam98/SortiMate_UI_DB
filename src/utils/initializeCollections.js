import { getFirestore, collection, addDoc, serverTimestamp, query, getDocs, deleteDoc } from 'firebase/firestore';

// Initialize collections with sample documents so they appear in Firebase Console
export const initializeCollections = async () => {
  const db = getFirestore();
  
  try {
    // Initialize invitations collection
    await addDoc(collection(db, 'invitations'), {
      from_user_id: 'sample_user',
      from_user_name: 'Sample User',
      to_user_id: 'sample_target',
      family_id: 'sample_family',
      family_name: 'Sample Family',
      status: 'pending',
      created_at: serverTimestamp(),
      _is_sample: true // Mark as sample data
    });

    // Initialize join_requests collection
    await addDoc(collection(db, 'join_requests'), {
      user_id: 'sample_user',
      user_name: 'Sample User',
      family_id: 'sample_family',
      family_name: 'Sample Family',
      status: 'pending',
      created_at: serverTimestamp(),
      _is_sample: true // Mark as sample data
    });

    console.log('Collections initialized successfully!');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
};

// Function to clean up sample data
export const cleanupSampleData = async () => {
  const db = getFirestore();
  
  try {
    // Clean up sample invitations
    const invitationsQuery = query(collection(db, 'invitations'), where('_is_sample', '==', true));
    const invitationsSnapshot = await getDocs(invitationsQuery);
    
    invitationsSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    // Clean up sample join requests
    const requestsQuery = query(collection(db, 'join_requests'), where('_is_sample', '==', true));
    const requestsSnapshot = await getDocs(requestsQuery);
    
    requestsSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    console.log('Sample data cleaned up successfully!');
  } catch (error) {
    console.error('Error cleaning up sample data:', error);
  }
}; 