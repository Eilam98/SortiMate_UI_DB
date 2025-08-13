import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export const updateBinsWithActiveUser = async () => {
  const db = getFirestore();
  const binsRef = collection(db, 'bins');
  
  try {
    const binsSnapshot = await getDocs(binsRef);
    
    const updatePromises = binsSnapshot.docs.map(async (binDoc) => {
      const binData = binDoc.data();
      
      // Only update if active_user field doesn't exist
      if (binData.active_user === undefined) {
        console.log(`🔄 Updating bin ${binData.bin_id} with active_user field`);
        
        await updateDoc(doc(db, 'bins', binDoc.id), {
          active_user: false,
          current_user: null,
          last_activity: new Date()
        });
        
        console.log(`✅ Updated bin ${binData.bin_id}`);
      } else {
        console.log(`⏭️ Bin ${binData.bin_id} already has active_user field`);
      }
    });
    
    await Promise.all(updatePromises);
    console.log('🎉 All bins updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating bins:', error);
    throw error;
  }
};
