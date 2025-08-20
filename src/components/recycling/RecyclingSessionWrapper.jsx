import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import RecyclingSession from './RecyclingSession';

const RecyclingSessionWrapper = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    console.log('🔄 RecyclingSessionWrapper: Starting to fetch user data...');
    try {
      const auth = getAuth();
      const db = getFirestore();
      const user = auth.currentUser;

      console.log('🔄 RecyclingSessionWrapper: Current user:', user ? user.uid : 'null');

      if (user) {
        // First try to get user document directly by UID (for guest users)
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let userData;
        
        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          console.log('🔄 RecyclingSessionWrapper: User data found by UID:', userData);
          setUserData(userData);
        } else {
          console.log('🔄 RecyclingSessionWrapper: User not found by UID, trying auth_uid...');
          // If not found by UID, search by auth_uid (for regular users)
          const q = query(collection(db, 'users'), where('auth_uid', '==', user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            userData = userDoc.data();
            console.log('🔄 RecyclingSessionWrapper: User data found by auth_uid:', userData);
            setUserData(userData);
          } else {
            console.error('🔄 RecyclingSessionWrapper: User data not found by either UID or auth_uid');
            setError("User data not found.");
            return;
          }
        }
      } else {
        console.error('🔄 RecyclingSessionWrapper: No authenticated user found');
        setError("No authenticated user.");
        return;
      }
    } catch (err) {
      console.error('🔄 RecyclingSessionWrapper: Error fetching user data:', err);
      setError('Error fetching user data: ' + err.message);
    } finally {
      console.log('🔄 RecyclingSessionWrapper: Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 RecyclingSessionWrapper: useEffect triggered');
    
    // Listen for auth state changes
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('🔄 RecyclingSessionWrapper: Auth state changed:', user ? user.uid : 'null');
      if (user) {
        fetchUserData();
      } else {
        setLoading(false);
        setError("Please sign in to use the recycling bin.");
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    console.log('🔄 RecyclingSessionWrapper: Rendering loading state');
    return (
      <div className="container">
        <div className="card text-center">
          <h2 className="text-primary">Loading...</h2>
          <p className="text-secondary">Please wait while we load your session.</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('🔄 RecyclingSessionWrapper: Rendering error state:', error);
    return (
      <div className="container">
        <div className="card text-center">
          <h2 className="text-danger">Authentication Required</h2>
          <p className="text-secondary">{error}</p>
          <div className="mt-4">
            <button 
              onClick={() => window.location.href = '/signin'} 
              className="btn btn-primary me-2"
            >
              Sign In
            </button>
            <button 
              onClick={() => window.location.href = '/signup'} 
              className="btn btn-outline"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('🔄 RecyclingSessionWrapper: Rendering RecyclingSession with userData:', userData);
  return <RecyclingSession userData={userData} />;
};

export default RecyclingSessionWrapper;
