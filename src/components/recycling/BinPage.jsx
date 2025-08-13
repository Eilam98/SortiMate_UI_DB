import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import IntroductionPage from '../common/IntroductionPage';
import { deepLinkHandler } from '../../utils/deepLinkHandler';

const BinPage = () => {
  const { binId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [binExists, setBinExists] = useState(false);
  const [user, setUser] = useState(null);

  console.log('🎯 BinPage: Received binId from URL params:', binId);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // User is authenticated - check if bin exists and redirect to recycling process
        await checkBinAndRedirect();
      } else {
        // User is not authenticated - still check if bin exists
        await checkBinExists();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [binId]);

  // Handle deep link detection
  useEffect(() => {
    // Check if this page was opened via deep link
    const urlParams = new URLSearchParams(window.location.search);
    const isDeepLink = urlParams.get('deep_link');
    
    if (isDeepLink && binId) {
      // This was opened via deep link - try to open app
      deepLinkHandler.handleBinDeepLink(binId);
    }
  }, [binId]);

  const checkBinExists = async () => {
    try {
      const db = getFirestore();
      
      // First try to find by document ID
      const binRef = doc(db, 'bins', binId);
      const binDoc = await getDoc(binRef);
      
      if (binDoc.exists()) {
        setBinExists(true);
        return;
      }
      
      // If not found by document ID, search by bin_id field
      const binsRef = collection(db, 'bins');
      const q = query(binsRef, where('bin_id', '==', binId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setBinExists(true);
      } else {
        setBinExists(false);
      }
    } catch (error) {
      console.error('Error checking bin:', error);
      setBinExists(false);
    }
  };

  const checkBinAndRedirect = async () => {
    try {
      const db = getFirestore();
      
      // First try to find by document ID
      const binRef = doc(db, 'bins', binId);
      const binDoc = await getDoc(binRef);
      
      if (binDoc.exists()) {
        setBinExists(true);
        // Redirect directly to the recycling session
        navigate(`/recycling-session/${binId}`, { replace: true });
        return;
      }
      
      // If not found by document ID, search by bin_id field
      const binsRef = collection(db, 'bins');
      const q = query(binsRef, where('bin_id', '==', binId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setBinExists(true);
        // Redirect directly to the recycling session
        navigate(`/recycling-session/${binId}`, { replace: true });
      } else {
        setBinExists(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking bin:', error);
      setBinExists(false);
      setLoading(false);
    }
  };

  const handleSignUpClick = () => {
    // Store the bin ID for redirect after signup
    sessionStorage.setItem('redirectBinId', binId);
    navigate('/signup');
  };

  const handleSignInClick = () => {
    // Store the bin ID for redirect after signin
    sessionStorage.setItem('redirectBinId', binId);
    navigate('/signin');
  };

  const handleGuestClick = () => {
    // Store the bin ID for redirect after guest mode
    console.log('🎯 BinPage: Storing binId in sessionStorage:', binId);
    sessionStorage.setItem('redirectBinId', binId);
    console.log('🎯 BinPage: Stored in sessionStorage:', sessionStorage.getItem('redirectBinId'));
    navigate('/guest-dashboard');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!binExists) {
    return (
      <div className="error-container">
        <h2>❌ Bin Not Found</h2>
        <p>The bin you're looking for doesn't exist.</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/')}
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Show introduction page for non-authenticated users
  return (
    <div>
      {/* Debug Info for BinPage */}
      <div className="card mb-4" style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000, maxWidth: '300px', fontSize: '12px' }}>
        <div className="text-center">
          <h4>🔍 BinPage Debug</h4>
          <p><strong>binId from URL:</strong> {binId || 'null'}</p>
          <p><strong>binExists:</strong> {binExists ? 'true' : 'false'}</p>
          <p><strong>loading:</strong> {loading ? 'true' : 'false'}</p>
          <button 
            className="btn btn-outline btn-sm mt-2" 
            onClick={() => {
              alert(`BinPage Debug:\nbinId: ${binId}\nbinExists: ${binExists}\nloading: ${loading}\nURL: ${window.location.href}`);
            }}
          >
            🔍 BinPage Info
          </button>
        </div>
      </div>
      
      <IntroductionPage
        onSignUpClick={handleSignUpClick}
        onSignInClick={handleSignInClick}
        onGuestClick={handleGuestClick}
        successMessage=""
      />
    </div>
  );
};

export default BinPage; 