import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { trackConnection } from '../../utils/connectionTracker';
import SortiMateLogo from './SortiMateLogo';

const IntroductionPage = ({ onSignUpClick, onSignInClick, onGuestClick, successMessage, customGuestHandler, hideGuestButton = false }) => {
  const navigate = useNavigate();
  
  const handleGuestClick = async () => {
    try {
      console.log('🎯 Creating guest user...');
      
      // Generate unique guest ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const guestId = `guest_${timestamp}_${random}`;
      
      // Create guest email (required for Firebase Auth)
      const guestEmail = `${guestId}@sortimate.guest`;
      const guestPassword = `guest_${random}`;
      
      console.log('🎯 Guest ID:', guestId);
      console.log('🎯 Guest email:', guestEmail);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, guestEmail, guestPassword);
      const user = userCredential.user;
      
      // Create user document in Firestore
      const userDoc = {
        user_id: guestId,
        auth_uid: user.uid,
        role: 'guest',
        first_name: 'Guest',
        last_name: 'User',
        created_at: serverTimestamp(),
        recycle_stats: { metal: 0, glass: 0, other: 0, plastic: 0 },
        total_points: 0,
        items_recycled: 0,
        family: { group_id: '', is_current_winner: false, total_wins: 0 },
        last_activity: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), userDoc);
      
      // Verify the user document was written
      const verifyDoc = await getDoc(doc(db, 'users', user.uid));
      if (!verifyDoc.exists()) {
        throw new Error('Failed to create guest user document');
      }
      
      console.log('🎯 Guest user document verified in Firestore:', verifyDoc.data());
      
      // Track the guest connection
      await trackConnection(true); // true = guest user
      
      console.log('🎯 Guest user created successfully:', guestId);
      
      // Check if there's a redirect bin ID stored (from QR scan)
      const redirectBinId = sessionStorage.getItem('redirectBinId');
      if (redirectBinId) {
        console.log('🎯 Guest user created after QR scan, redirecting to dashboard with bin:', redirectBinId);
        // Navigate to dashboard with query parameter (like SignIn does)
        navigate(`/dashboard?bin=${redirectBinId}`);
      } else {
        console.log('🎯 Guest user created from introduction page, going to dashboard');
        // Call the original onGuestClick to handle navigation to dashboard
        onGuestClick();
      }
      
    } catch (error) {
      console.error('❌ Error creating guest user:', error);
      alert('Failed to create guest session. Please try again.');
    }
  };
  return (
    <div className="container">
      <div className="text-center" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Success Message */}
        {successMessage && (
          <div className="message message-success mb-4">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Hero Section */}
        <div className="card mb-4">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
            <SortiMateLogo size="large" />
          </div>
          <h1 className="text-success">Welcome to SortiMate!</h1>
          <p className="text-secondary" style={{ fontSize: '1.2rem' }}>
            Turn recycling into a fun adventure with family competitions and smart bin tracking!
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-2 mb-4">
          <div className="card text-center">
            <div className="text-purple" style={{ fontSize: '3rem' }}>📱</div>
            <h3>Smart Bins</h3>
            <p className="text-secondary">Scan QR codes to track your recycling</p>
          </div>
          <div className="card text-center">
            <div className="text-warning" style={{ fontSize: '3rem' }}>👨‍👩‍👧‍👦</div>
            <h3>Family Challenges</h3>
            <p className="text-secondary">Recycle items and earn points to compete with your family and friends</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-1" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <button className="btn btn-primary btn-lg mb-3" onClick={onSignUpClick}>
            🚀 Get Started
          </button>
          <button className="btn btn-secondary btn-lg mb-3" onClick={onSignInClick}>
            🔑 Sign In
          </button>
          {!hideGuestButton && (
            <button className="btn btn-outline btn-lg" onClick={customGuestHandler || handleGuestClick}>
              👤 Continue as Guest
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage; 