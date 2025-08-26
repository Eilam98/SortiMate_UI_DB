import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const db = getFirestore();

// Get the current week key (YYYY-WW format)
const getCurrentWeekKey = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

// Track a user connection (called when user signs in or guest starts session)
export const trackConnection = async (isGuest = false) => {
  try {
    const statsRef = doc(db, 'statistics', 'user_connections');
    const currentWeek = getCurrentWeekKey();
    
    const statsDoc = await getDoc(statsRef);
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      const weeks = data.weeks || {};
      
      // Initialize current week if it doesn't exist
      if (!weeks[currentWeek]) {
        weeks[currentWeek] = { guests: 0, users: 0 };
      }
      
      // Update the count
      if (isGuest) {
        weeks[currentWeek].guests += 1;
      } else {
        weeks[currentWeek].users += 1;
      }
      
      // Keep only the last 12 weeks
      const weekKeys = Object.keys(weeks).sort();
      if (weekKeys.length > 12) {
        const weeksToRemove = weekKeys.slice(0, weekKeys.length - 12);
        weeksToRemove.forEach(key => delete weeks[key]);
      }
      
      await updateDoc(statsRef, {
        weeks: weeks,
        lastUpdated: new Date()
      });
      
      console.log(`📊 Connection tracked: ${isGuest ? 'Guest' : 'User'} in week ${currentWeek}`);
    }
  } catch (error) {
    console.error('Error tracking connection:', error);
  }
};
