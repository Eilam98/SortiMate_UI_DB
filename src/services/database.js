import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  Timestamp,
  increment
} from 'firebase/firestore';

// User operations
export const createUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      created_at: Timestamp.now(),
      recycle_stats: { aluminium: 0, glass: 0, other: 0, plastic: 0 },
      total_points: 0,
      items_recycled: 0,
      family_id: '',
      role: 'user',
      last_activity: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Recycling operations
export const addRecyclingEntry = async (userId, entryData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const entry = {
      ...entryData,
      timestamp: Timestamp.now(),
      pointsEarned: calculatePoints(entryData)
    };

    await updateDoc(userRef, {
      recyclingHistory: arrayUnion(entry),
      points: increment(entry.pointsEarned),
      totalRecycled: increment(entryData.quantity),
      lastRecyclingDate: Timestamp.now()
    });

    return entry;
  } catch (error) {
    console.error('Error adding recycling entry:', error);
    throw error;
  }
};

// Helper functions
const calculatePoints = (entry) => {
  // Points calculation based on material type and quantity
  const pointsPerKg = {
    plastic: 10,
    paper: 5,
    glass: 8,
    metal: 12,
    organic: 3,
    electronic: 15
  };

  return Math.round(entry.quantity * (pointsPerKg[entry.materialType] || 5));
};

// Collection references
export const collections = {
  users: 'users',
  recyclingHistory: 'recyclingHistory',
  achievements: 'achievements'
}; 