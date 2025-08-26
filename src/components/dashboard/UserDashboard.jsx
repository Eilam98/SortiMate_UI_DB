import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import AddBottle from '../recycling/AddBottle';
import AdminBinManager from '../admin/AdminBinManager';
import Statistics from '../admin/Statistics';
import FamilyManager from '../family/FamilyManager';
import FamilyLeaderboard from '../family/FamilyLeaderboard';


const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showInvitations, setShowInvitations] = useState(false);
  const [userData, setUserData] = useState(null);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectBinId, setRedirectBinId] = useState(null);
  const [guestSessionTimer, setGuestSessionTimer] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserData = async () => {
    try {
      const auth = getAuth();
      const db = getFirestore();
      const user = auth.currentUser;

      if (user) {
        // First try to get user document directly by UID (for guest users)
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let userData;
        
        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          setUserData(userData);
        } else {
          // If not found by UID, search by auth_uid (for regular users)
          const q = query(collection(db, 'users'), where('auth_uid', '==', user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            userData = userDoc.data();
            setUserData(userData);
          } else {
            setError("User data not found. You may have been removed.");
            await signOut(auth);
            return;
          }
        }

        // Load family if exists (only for non-guest users)
        if (userData && userData.role !== 'guest' && userData.family_id) {
          const familyDoc = await getDoc(doc(db, 'families', userData.family_id));
          if (familyDoc.exists()) {
            const familyData = familyDoc.data();
            // Find all users in the same family
            const membersQuery = query(
              collection(db, 'users'),
              where('family_id', '==', userData.family_id)
            );
            const membersSnapshot = await getDocs(membersQuery);
            const members = membersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            members.sort((a, b) => b.total_points - a.total_points);
            setFamilyData({ id: familyDoc.id, ...familyData, members });
          }
        } else {
          setFamilyData(null);
        }
      }
    } catch (err) {
      setError('Error fetching user data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // Listen for auth state changes to keep userData up-to-date
    const unsubscribe = getAuth().onAuthStateChanged(() => {
      fetchUserData();
    });
    
    // Cleanup function to clear any existing timers
    return () => {
      unsubscribe();
      if (guestSessionTimer) {
        console.log('🎯 Component unmounting: Clearing guest session timer');
        clearTimeout(guestSessionTimer);
      }
    };
  }, []);

  // Guest session timeout (15 minutes)
  useEffect(() => {
    if (userData?.role === 'guest') {
      console.log('🎯 Starting guest session timer (15 minutes) for user:', userData.user_id);
      
      const timer = setTimeout(async () => {
        console.log('🎯 Guest session expired (15 minutes) for user:', userData.user_id);
        alert('Your guest session has expired. You will be logged out.');
        
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          
          if (user) {
            console.log('🎯 Attempting to delete guest user document:', user.uid);
            
            // Delete guest user document from Firestore
            const db = getFirestore();
            await deleteDoc(doc(db, 'users', user.uid));
            console.log('🎯 Guest user document deleted successfully');
            
            // Delete user from Firebase Auth
            await user.delete();
            console.log('🎯 Guest user auth account deleted successfully');
          }
          
          await signOut(auth);
          navigate('/');
        } catch (error) {
          console.error('❌ Error during guest session cleanup:', error);
          // Even if deletion fails, still sign out
          try {
            await signOut(auth);
            navigate('/');
          } catch (signOutError) {
            console.error('❌ Error signing out:', signOutError);
            navigate('/');
          }
        }
      }, 15 * 60 * 1000); // 15 minutes
      
      setGuestSessionTimer(timer);
      console.log('🎯 Guest session timer set for 15 minutes');
      
      return () => {
        if (timer) {
          console.log('🎯 Clearing guest session timer');
          clearTimeout(timer);
        }
      };
    } else {
      // Clear timer if user is not a guest
      if (guestSessionTimer) {
        console.log('🎯 Clearing guest session timer (user is not a guest)');
        clearTimeout(guestSessionTimer);
        setGuestSessionTimer(null);
      }
    }
  }, [userData?.role, userData?.user_id, navigate]);

  // Handle bin query parameter for QR redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const binId = urlParams.get('bin');
    
    if (binId && userData) {
      // Store the bin ID in state before clearing URL
      setRedirectBinId(binId);
      // Switch to add-bottle tab
      setActiveTab('add-bottle');
      // Clear the query parameter from URL
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, userData, navigate]);

  // Clear redirect bin ID when switching away from add-bottle tab
  useEffect(() => {
    if (activeTab !== 'add-bottle') {
      setRedirectBinId(null);
    }
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      // If this is a guest user, delete their account
      if (userData?.role === 'guest') {
        console.log('🎯 Manual logout: Deleting guest user:', userData.user_id);
        
        if (user) {
          // Delete user document from Firestore
          const db = getFirestore();
          await deleteDoc(doc(db, 'users', user.uid));
          console.log('🎯 Guest user document deleted successfully');
          
          // Delete user from Firebase Auth
          await user.delete();
          console.log('🎯 Guest user auth account deleted successfully');
        }
      }
      
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('❌ Error during manual logout:', error);
      // Even if deletion fails, still sign out
      try {
        await signOut(auth);
        navigate('/');
      } catch (signOutError) {
        console.error('❌ Error signing out:', signOutError);
        navigate('/');
      }
    }
  };



  if (loading) {
    return (
      <div className="container">
        <div className="flex-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p className="text-secondary mt-3">Loading your recycling journey...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="message message-error">
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex-between">
          <div>
            <h1 className="text-success">
              {userData?.role === 'guest' ? '👤 Guest Mode' : '🌱 Welcome back, ' + (userData?.first_name || 'Recycler') + '!'}
            </h1>
            <p className="text-secondary">
              {userData?.role === 'guest' 
                ? 'Try SortiMate without an account - your session will expire in 15 minutes' 
                : 'Ready to make the world greener?'}
            </p>
          </div>
          <div className="flex">
            <button className="btn btn-danger" onClick={handleLogout}>
              {userData?.role === 'guest' ? '🚪 Exit Guest Mode' : '🚪 Logout'}
            </button>
          </div>
        </div>
      </div>

                        {/* Tabs */}
                  <div className="card">
                    <div className="flex" style={{ borderBottom: '2px solid var(--light-gray)', marginBottom: 'var(--spacing-lg)' }}>
                      <button 
                        className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveTab('profile')}
                        style={{ marginRight: 'var(--spacing-sm)', borderRadius: 'var(--border-radius-md) 0 0 0' }}
                      >
                        👤 My Profile
                      </button>
                      <button 
                        className={`btn ${activeTab === 'add-bottle' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => {
                          setActiveTab('add-bottle');
                          // Clear redirect bin ID when manually switching to add-bottle tab
                          if (activeTab !== 'add-bottle') {
                            setRedirectBinId(null);
                          }
                        }}
                        style={{ marginRight: 'var(--spacing-sm)' }}
                      >
                        🥤 Add Bottle
                      </button>
                      

                      
                      {userData?.role === 'admin' && (
                        <>
                          <button 
                            className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setActiveTab('admin')}
                          >
                            ⚙️ Admin
                          </button>
                          <button 
                            className={`btn ${activeTab === 'statistics' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setActiveTab('statistics')}
                            style={{ borderRadius: '0 var(--border-radius-md) 0 0' }}
                          >
                            📊 Statistics
                          </button>
                        </>
                      )}
                    </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="fade-in">
            <div className="grid grid-2">
              {/* User Stats */}
              <div className="card">
                <h3 className="text-center">📈 Your Stats</h3>
                <div className="grid grid-2">
                  <div className="text-center">
                    <div className="text-success font-bold" style={{ fontSize: '2rem' }}>
                      {userData?.total_points || 0}
                    </div>
                    <p className="text-secondary">Total Points</p>
                  </div>
                  <div className="text-center">
                    <div className="text-info font-bold" style={{ fontSize: '2rem' }}>
                      {userData?.items_recycled || 0}
                    </div>
                    <p className="text-secondary">Items Recycled</p>
                  </div>
                </div>
              </div>

              {/* Recycling Stats */}
              <div className="card">
                <h3 className="text-center">♻️ Recycling Breakdown</h3>
                <div className="grid grid-2">
                  <div className="text-center">
                    <div className="text-info font-bold">🥤</div>
                    <p className="text-secondary">Plastic: {userData?.recycle_stats?.plastic || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-warning font-bold">🍾</div>
                    <p className="text-secondary">Glass: {userData?.recycle_stats?.glass || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-purple font-bold">🥫</div>
                    <p className="text-secondary">Metal: {userData?.recycle_stats?.metal || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-success font-bold">📦</div>
                    <p className="text-secondary">Other: {userData?.recycle_stats?.other || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Section - hide for guests */}
            {userData?.role !== 'guest' && (
              familyData ? (
                <FamilyLeaderboard 
                  userData={userData}
                  familyData={familyData}
                  onFamilyLeft={fetchUserData}
                  onFamilyDeleted={fetchUserData}
                />
              ) : (
                <FamilyManager 
                  onFamilyCreated={fetchUserData}
                  onInvitationAccepted={fetchUserData}
                  onInvitationDeclined={fetchUserData}
                />
              )
            )}

                        {/* Guest Mode Info */}
            {userData?.role === 'guest' && (
              <div className="card mt-4">
                <div className="text-center">
                  <div className="text-warning" style={{ fontSize: '3rem' }}>👤</div>
                  <h3>Guest Mode</h3>
                  <p className="text-secondary mb-4">
                    You're using SortiMate in guest mode. Sign up to save your progress and join family competitions!
                  </p>
                  
                  <div className="grid grid-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/signup')}>
                      🚀 Sign Up
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/signin')}>
                      🔑 Sign In
                    </button>
                  </div>
                  

                  
                  <div className="mt-4">
                    <h4>Guest Mode Features:</h4>
                    <ul className="text-left" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      <li>✅ Scan QR codes and recycle items</li>
                      <li>✅ Report incorrect identifications</li>
                      <li>✅ Try the recycling experience</li>
                      <li>❌ No points or progress saved</li>
                      <li>❌ No family features</li>
                      <li>❌ Session expires after 15 minutes</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Bottle Tab */}
        {activeTab === 'add-bottle' && (
          <div className="fade-in">
            <AddBottle 
              onUpdate={fetchUserData} 
              userData={userData} 
              binId={redirectBinId}
            />
          </div>
        )}



        {/* Admin Tab */}
        {activeTab === 'admin' && userData?.role === 'admin' && (
          <div className="fade-in">
            <AdminBinManager />
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && userData?.role === 'admin' && (
          <div className="fade-in">
            <Statistics />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
