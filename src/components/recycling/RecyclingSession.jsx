import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs, increment, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import WaitingScreen from './WaitingScreen';
import IdentificationConfirmation from './IdentificationConfirmation';
import CorrectionForm from './CorrectionForm';
import SessionSummary from './SessionSummary';
import WrongClassificationModal from './WrongClassificationModal';

const RecyclingSession = ({ userData }) => {
  const { binId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('checking'); // 'checking', 'occupied', 'waiting', 'confirmation', 'correction', 'summary'
  const [processing, setProcessing] = useState(false);
  const [binData, setBinData] = useState(null);
  const [wasteEvent, setWasteEvent] = useState(null);

  // Session tracking state
  const [sessionId, setSessionId] = useState(null);
  const [sessionBottles, setSessionBottles] = useState({
    plastic: 0,
    glass: 0,
    aluminum: 0,
    other: 0
  });
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [lastBottleTime, setLastBottleTime] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState(null); // Milliseconds for timeout
  const sessionTimeoutRef = useRef(null); // Ref to hold the timeout ID

  // Waste event listener state
  const [isListening, setIsListening] = useState(false);
  const wasteEventListenerRef = useRef(null); // Ref to hold the listener unsubscribe function
  const isInitialSnapshotRef = useRef(true); // Ref to track if initial snapshot has been processed

  // Wrong classification listener state
  const [wrongClassificationData, setWrongClassificationData] = useState(null);
  const [showWrongClassificationModal, setShowWrongClassificationModal] = useState(false);
  const wrongClassificationListenerRef = useRef(null); // Ref to hold the wrong classification listener unsubscribe function
  const wrongClassificationInitialSnapshotRef = useRef(true); // Ref to track if initial snapshot has been processed

  const db = getFirestore();
  const auth = getAuth();

  console.log('🔄 RecyclingSession: Component rendered with:', {
    binId,
    userData: userData ? { user_id: userData.user_id, role: userData.role } : null,
    currentStep,
    processing
  });

  // --- Bin Occupation and Release Logic ---
  const checkBinOccupation = async (id) => {
    console.log('🔍 checkBinOccupation: Starting for binId:', id);
    setProcessing(true);
    
    try {
      const binRef = doc(db, 'bins', id);
      const binSnap = await getDoc(binRef);
      let binDoc;
      let actualBinRef;

      if (binSnap.exists()) {
        binDoc = binSnap.data();
        actualBinRef = binRef;
        console.log('🔍 checkBinOccupation: Bin found by document ID');
      } else {
        console.log('🔍 checkBinOccupation: Bin not found by document ID, searching by bin_id field');
        const binsRef = collection(db, 'bins');
        const q = query(binsRef, where('bin_id', '==', id));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          binDoc = querySnapshot.docs[0].data();
          actualBinRef = doc(db, 'bins', querySnapshot.docs[0].id);
          console.log('🔍 checkBinOccupation: Bin found by bin_id field');
        } else {
          throw new Error('Bin not found');
        }
      }

      setBinData(binDoc);
      console.log('🔍 Bin data:', binDoc);
      console.log('🔍 Current user:', auth.currentUser?.uid);
      console.log('🔍 Bin active_user:', binDoc.active_user);
      console.log('🔍 Bin current_user:', binDoc.current_user);

      // Check if bin is occupied by another user OR if the last activity is too old (1 minute)
      const isOccupiedByOther = binDoc.active_user && binDoc.current_user !== auth.currentUser?.uid;
      const isStaleOccupation = binDoc.last_activity && 
        (new Date() - binDoc.last_activity.toDate()) > 1 * 60 * 1000; // 1 minute

      if (isOccupiedByOther && !isStaleOccupation) {
        console.log('🔒 Bin is occupied by another user');
        setCurrentStep('occupied');
        setProcessing(false);
        return false;
      }

      // If occupation is stale, we can take over
      if (isStaleOccupation) {
        console.log('🕐 Bin occupation is stale (over 1 minute old), taking over');
        // TODO: In a real implementation, we could award points to the previous user here
        // For now, we just take over the bin
      }

      console.log('🔧 Updating bin with active_user: true');
      console.log('🔧 Using document reference:', actualBinRef.path);
      console.log('🔧 Current user ID:', auth.currentUser?.uid);

      try {
        await updateDoc(actualBinRef, {
          active_user: true,
          current_user: auth.currentUser?.uid,
          last_activity: serverTimestamp()
        });
        console.log('✅ Bin occupation update successful');
        setProcessing(false);
        return true;
      } catch (updateError) {
        console.error('❌ Error updating bin occupation:', updateError);
        setProcessing(false);
        throw updateError;
      }

    } catch (error) {
      console.error('Error checking bin occupation:', error);
      alert('Error checking bin: ' + error.message);
      setProcessing(false);
      navigate('/dashboard?tab=profile'); // Go back to dashboard on error
      return false;
    }
  };

  const releaseBin = async () => {
    if (!binData || !binId) return;

    try {
      const binRef = doc(db, 'bins', binId);
      const binSnap = await getDoc(binRef);
      let actualBinRef;
      if (binSnap.exists()) {
        actualBinRef = binRef;
      } else {
        const binsRef = collection(db, 'bins');
        const q = query(binsRef, where('bin_id', '==', binId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          actualBinRef = doc(db, 'bins', querySnapshot.docs[0].id);
        } else {
          console.error('Bin not found for release');
          return;
        }
      }

      await updateDoc(actualBinRef, {
        active_user: false,
        current_user: null,
        last_activity: serverTimestamp()
      });
      console.log('🔓 Bin released successfully');
    } catch (error) {
      console.error('Error releasing bin:', error);
    }
  };

  // --- Session Management ---
  const startNewSession = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setSessionBottles({ plastic: 0, glass: 0, aluminum: 0, other: 0 });
    setSessionPoints(0);
    setSessionStartTime(new Date());
    setLastBottleTime(new Date());
    setSessionTimeout(3 * 60 * 1000); // 3 minutes in milliseconds
    console.log('🎉 New session started:', newSessionId);
  };

  // Continue existing session (keep bottle counts and points, just reset timer)
  const continueSession = () => {
    setLastBottleTime(new Date());
    setSessionTimeout(3 * 60 * 1000); // 3 minutes in milliseconds
    console.log('🔄 Session continued - timer reset, bottle counts and points preserved');
  };

  const endSession = async () => {
    console.log('Ending session...');
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    
    // Clean up waste event listener when session ends
    cleanupWasteEventListener();
    
    // No need to release bin here, it's handled by "Award Points" or "New Session"
    setCurrentStep('summary');
  };

  // Add bottle to current session
  const addBottleToSession = (bottleType) => {
    const typeKey = bottleType.toLowerCase();
    
    // Map waste types to session bottle counts
    let statsKey;
    switch (typeKey) {
      case 'metal':
      case 'aluminium':
      case 'aluminum':
        statsKey = 'aluminum';
        break;
      case 'plastic':
        statsKey = 'plastic';
        break;
      case 'glass':
        statsKey = 'glass';
        break;
      default:
        statsKey = 'other';
        break;
    }

    setSessionBottles(prev => ({
      ...prev,
      [statsKey]: (prev[statsKey] || 0) + 1
    }));

    setSessionPoints(prev => prev + 1); // 1 point per bottle
    setLastBottleTime(new Date());

    // Reset session timeout (3 minutes from last bottle)
    console.log('⏰ Resetting session timeout to 3 minutes');
    setSessionTimeout(3 * 60 * 1000); // 3 minutes in milliseconds

    const newTotalPoints = sessionPoints + 1;
    console.log(`🥤 Added ${bottleType} bottle to session. Total points: ${newTotalPoints}`);
    console.log(`📊 Updated ${statsKey} count to ${(sessionBottles[statsKey] || 0) + 1}`);

    // Show guest user warning if applicable
    if (userData?.role === 'guest') {
      console.log('🎯 Guest user - points will be lost on session expiry');
    }
  };

  // Reset session timer (used for wrong classification modal)
  const resetSessionTimer = () => {
    console.log('⏰ Resetting session timeout due to wrong classification modal');
    setLastBottleTime(new Date());
    setSessionTimeout(3 * 60 * 1000); // 3 minutes in milliseconds
  };

  // Create waste event in Firestore
  const createWasteEvent = async (binId, wasteType, currentSessionId) => {
    try {
      await addDoc(collection(db, 'waste_events'), {
        bin_id: binId,
        waste_type: wasteType,
        timestamp: serverTimestamp(),
        user_id: auth.currentUser?.uid,
        session_id: currentSessionId,
        points_earned: 1, // Each bottle is 1 point
        session_timestamp: sessionStartTime // Timestamp when session started
      });
      console.log('🗑️ Waste event created successfully!');
    } catch (error) {
      console.error('Error creating waste event:', error);
      throw new Error('Failed to record waste event.');
    }
  };

  // Award session points to user
  const awardSessionPoints = async () => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No user is signed in");
    }

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found in database");
    }

    const currentUserData = userSnap.data();

    // Don't award points to guest users
    if (currentUserData.role === 'guest') {
      console.log('🎯 Guest user - no points awarded');
      return;
    }

    // Award points based on session totals
    const totalBottles = Object.values(sessionBottles).reduce((a, b) => a + b, 0);

    // Update user stats - use consistent aluminum spelling and remove unnecessary fields
    const newStats = {
      plastic: (currentUserData.recycle_stats?.plastic || 0) + sessionBottles.plastic,
      glass: (currentUserData.recycle_stats?.glass || 0) + sessionBottles.glass,
      aluminum: (currentUserData.recycle_stats?.aluminum || 0) + sessionBottles.aluminum,
      other: (currentUserData.recycle_stats?.other || 0) + sessionBottles.other,
    };

    await updateDoc(userRef, {
      total_points: increment(sessionPoints),
      recycle_stats: newStats
    });
    console.log(`🏆 Awarded ${sessionPoints} points to user ${user.uid}`);
  };

  // Handle waste event identification received
  const handleIdentificationReceived = (event) => {
    setWasteEvent(event);
    setCurrentStep('confirmation');
  };

  // Handle correct identification
  const handleCorrectIdentification = async () => {
    setProcessing(true);
    try {
      // Add bottle to current session
      addBottleToSession(wasteEvent.waste_type);

      // Create waste event with session tracking
      await createWasteEvent(binId, wasteEvent.waste_type, sessionId);

      // Continue waiting for more bottles (don't reset to scanner)
      setCurrentStep('waiting');
      setWasteEvent(null); // Clear waste event for next identification
    } catch (error) {
      alert('Error processing identification: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Handle incorrect identification (user wants to correct)
  const handleIncorrectIdentification = () => {
    setCurrentStep('correction');
  };

  // Handle correction submission
  const handleCorrectionSubmit = async (correctedType) => {
    setProcessing(true);
    try {
      // Create an alert document
      await addDoc(collection(db, 'alerts'), {
        bin_id: binId,
        original_waste_type: wasteEvent.waste_type,
        corrected_waste_type: correctedType,
        issue_type: 'identification_error',
        description: `User corrected identification from ${wasteEvent.waste_type} to ${correctedType}`,
        timestamp: serverTimestamp(),
        user_id: auth.currentUser?.uid,
        resolved: false
      });
      alert('✅ Correction submitted successfully! Thank you for your feedback.');
      setCurrentStep('waiting'); // Go back to waiting for next bottle
      setWasteEvent(null); // Clear waste event
    } catch (error) {
      alert('Error submitting correction: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Handle awarding session points from summary
  const handleAwardSessionPoints = async () => {
    setProcessing(true);
    try {
      await awardSessionPoints();

      if (userData?.role === 'guest') {
        alert(`✅ Awarded ${sessionPoints} points to guest session! (Points will be lost when session expires)`);
      } else {
        alert(`✅ Successfully awarded ${sessionPoints} points for your recycling session!`);
      }

      // Release bin and navigate back to dashboard
      await releaseBin();
      navigate('/dashboard?tab=profile');
    } catch (error) {
      alert('Error awarding points: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Handle continuing session from summary
  const handleNewSession = async () => {
    // Don't release the bin - keep it occupied for the continued session
    // Keep existing bottle counts and points, just reset the timer
    continueSession();
    setCurrentStep('waiting');
    
    // Re-setup waste event listener for continued session
    setupWasteEventListener();
    // Re-setup wrong classification listener for continued session
    setupWrongClassificationListener();
  };

  // Handle going back from occupied state
  const handleGoBackFromOccupied = () => {
    navigate('/dashboard?tab=profile');
  };

  // Handle trying again from occupied state - FIXED!
  const handleTryAgain = async () => {
    console.log('🔄 Try Again: Re-checking bin occupation');
    setCurrentStep('checking');
    setProcessing(true);
    
    try {
      // Re-check bin occupation
      const isAvailable = await checkBinOccupation(binId);
      console.log('🔄 Try Again: checkBinOccupation result:', isAvailable);
      
      if (isAvailable) {
        console.log('🔄 Try Again: Bin is now available, starting session');
        startNewSession();
        setCurrentStep('waiting');
      } else {
        console.log('🔄 Try Again: Bin is still occupied');
        setCurrentStep('occupied');
      }
    } catch (error) {
      console.error('🔄 Try Again: Error during re-check:', error);
      setCurrentStep('occupied');
    } finally {
      setProcessing(false);
    }
  };

     // --- Waste Event Listener Logic ---
   const setupWasteEventListener = () => {
     console.log('🎧 Setting up waste event listener for bin:', binId);
     console.log('🎧 binId type:', typeof binId);
     console.log('🎧 binId value:', JSON.stringify(binId));
     
     // Clean up any existing listener
     if (wasteEventListenerRef.current) {
       console.log('🎧 Cleaning up existing waste event listener');
       wasteEventListenerRef.current();
       wasteEventListenerRef.current = null;
     }

    // Reset initial snapshot flag
    isInitialSnapshotRef.current = true;

    // Set up query to listen for waste events for this specific bin
    const wasteEventsQuery = query(
      collection(db, 'waste_events'),
      where('bin_id', '==', binId)
    );
    
    console.log('🎧 Query created:', wasteEventsQuery);

        // Attach listener
    wasteEventListenerRef.current = onSnapshot(wasteEventsQuery, (snapshot) => {
      console.log('🎧 Waste event snapshot received, changes:', snapshot.docChanges().length);
      console.log('🎧 Total documents in snapshot:', snapshot.docs.length);
      
      // Process changes
      snapshot.docChanges().forEach((change) => {
        const eventData = { id: change.doc.id, ...change.doc.data() };
        console.log('🎧 Waste event change:', change.type, eventData);
        
        // Only process 'added' changes for new events
        if (change.type === 'added') {
          // Skip initial snapshot events
          if (isInitialSnapshotRef.current) {
            console.log('🎧 Skipping initial snapshot event');
            return;
          }
          
          console.log('🎧 New waste event detected:', eventData);
          
          // Process waste events for the current bin
          // Only process events that don't have a user_id (AI system events)
          // Skip events that have a user_id (created by this app)
          const shouldProcess = !eventData.user_id;
          
          if (shouldProcess) {
            console.log('🎧 Processing AI waste event for current user');
            
            // Directly add bottle to session (skip confirmation screen)
            addBottleToSession(eventData.waste_type);
            
            // Create waste event record (this will have user_id, so it won't trigger the listener again)
            createWasteEvent(binId, eventData.waste_type, sessionId).catch(error => {
              console.error('Error creating waste event record:', error);
            });
          } else {
            console.log('🎧 Waste event has user_id (created by app), ignoring to prevent loop');
          }
        }
      });
      
      // Mark initial snapshot as processed
      if (isInitialSnapshotRef.current) {
        console.log('🎧 Initial snapshot processed');
        isInitialSnapshotRef.current = false;
      }
    });

    setIsListening(true);
    console.log('🎧 Waste event listener setup complete');
  };

  // --- Wrong Classification Listener Logic ---
  const setupWrongClassificationListener = () => {
    console.log('⚠️ Setting up wrong classification listener for bin:', binId);
    
    // Clean up any existing listener
    if (wrongClassificationListenerRef.current) {
      console.log('⚠️ Cleaning up existing wrong classification listener');
      wrongClassificationListenerRef.current();
      wrongClassificationListenerRef.current = null;
    }

    // Reset initial snapshot flag
    wrongClassificationInitialSnapshotRef.current = true;

    // Set up query to listen for wrong classifications for this specific bin
    const wrongClassificationsQuery = query(
      collection(db, 'wrong_classifications'),
      where('bin_id', '==', binId),
      where('user_answered', '==', false)
    );
    
    console.log('⚠️ Wrong classification query created:', wrongClassificationsQuery);

    // Attach listener
    wrongClassificationListenerRef.current = onSnapshot(wrongClassificationsQuery, (snapshot) => {
      console.log('⚠️ Wrong classification snapshot received, changes:', snapshot.docChanges().length);
      
      // Process changes
      snapshot.docChanges().forEach((change) => {
        const wrongClassificationData = { id: change.doc.id, ...change.doc.data() };
        console.log('⚠️ Wrong classification change:', change.type, wrongClassificationData);
        
        // Only process 'added' changes for new wrong classifications
        if (change.type === 'added') {
          // Skip initial snapshot events
          if (wrongClassificationInitialSnapshotRef.current) {
            console.log('⚠️ Skipping initial snapshot wrong classification');
            return;
          }
          
          console.log('⚠️ New wrong classification detected:', wrongClassificationData);
          
          // Show modal and reset session timer
          setWrongClassificationData(wrongClassificationData);
          setShowWrongClassificationModal(true);
          
          // Reset the 3-minute session timer
          resetSessionTimer();
        }
      });
      
      // Mark initial snapshot as processed
      if (wrongClassificationInitialSnapshotRef.current) {
        console.log('⚠️ Initial wrong classification snapshot processed');
        wrongClassificationInitialSnapshotRef.current = false;
      }
    });

    console.log('⚠️ Wrong classification listener setup complete');
  };

  const cleanupWrongClassificationListener = () => {
    console.log('⚠️ Cleaning up wrong classification listener');
    if (wrongClassificationListenerRef.current) {
      wrongClassificationListenerRef.current();
      wrongClassificationListenerRef.current = null;
    }
  };

  // Handle wrong classification user response
  const handleWrongClassificationSubmit = async (userClassifiedType) => {
    try {
      console.log('⚠️ Updating wrong classification with user response:', userClassifiedType);
      
      // Update the wrong classification document
      const wrongClassificationRef = doc(db, 'wrong_classifications', wrongClassificationData.id);
      await updateDoc(wrongClassificationRef, {
        user_answered: true,
        user_classified_type: userClassifiedType
      });
      
      console.log('✅ Wrong classification updated successfully');
      
      // Close the modal
      setShowWrongClassificationModal(false);
      setWrongClassificationData(null);
      
    } catch (error) {
      console.error('❌ Error updating wrong classification:', error);
      throw error;
    }
  };

  const cleanupWasteEventListener = () => {
    console.log('🎧 Cleaning up waste event listener');
    if (wasteEventListenerRef.current) {
      wasteEventListenerRef.current();
      wasteEventListenerRef.current = null;
    }
    setIsListening(false);
  };

       // --- Effects ---
  useEffect(() => {
    console.log('🔄 useEffect: Starting bin occupation check');
    
    // Check if user is authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      console.log('🔄 useEffect: No authenticated user, redirecting to signin');
      navigate('/signin');
      return;
    }
    
    if (binId && userData) {
      console.log('🔄 useEffect: binId and userData available, checking occupation');
      checkBinOccupation(binId).then(isAvailable => {
        console.log('🔄 useEffect: checkBinOccupation result:', isAvailable);
        if (isAvailable) {
          console.log('🔄 useEffect: Bin available, starting new session');
          startNewSession();
          setCurrentStep('waiting');
          
          // Set up waste event listener when session starts
          setupWasteEventListener();
          // Set up wrong classification listener when session starts
          setupWrongClassificationListener();
        }
      });
    } else {
      console.log('🔄 useEffect: Missing binId or userData:', { binId, userData: !!userData });
      if (!binId) {
        navigate('/dashboard?tab=profile');
      }
    }

    // Cleanup function to release bin and cleanup listener if component unmounts or user navigates away
    return () => {
      console.log('RecyclingSession component unmounting or navigating away. Releasing bin and cleaning up listener.');
      cleanupWasteEventListener();
      cleanupWrongClassificationListener();
      releaseBin();
    };
  }, [binId, userData]); // Re-run if binId changes or user changes

  // Add event listeners for page unload/visibility change to handle browser close/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🔄 Page unload detected - releasing bin and cleaning up listener');
      cleanupWasteEventListener();
      cleanupWrongClassificationListener();
      releaseBin();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('🔄 Page hidden detected - releasing bin and cleaning up listener');
        cleanupWasteEventListener();
        cleanupWrongClassificationListener();
        releaseBin();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [binId]); // Only depend on binId to avoid recreating listeners

  // Session timeout management
  useEffect(() => {
    if (sessionTimeout) {
      console.log('⏰ Setting session timeout for', sessionTimeout / 1000, 'seconds');
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      sessionTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Session timeout - ending session');
        endSession();
      }, sessionTimeout);

      return () => {
        console.log('⏰ Clearing session timeout');
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }
      };
    } else {
      console.log('⏰ No session timeout set');
    }
  }, [sessionTimeout]);

  // Manual timeout check for debugging and activity updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep === 'waiting' && lastBottleTime && sessionTimeout) {
        const timeElapsed = new Date() - lastBottleTime;
        const timeLeft = sessionTimeout - timeElapsed;
        console.log(`⏰ Manual timeout check - Time remaining: ${Math.max(0, Math.floor(timeLeft / 1000))} seconds`);
        if (timeLeft <= 0) {
          console.log('⏰ Manual timeout triggered - ending session');
          endSession();
        }
      }

      // Update bin activity every 30 seconds to keep it "fresh"
      if (currentStep === 'waiting' && binData) {
        updateBinActivity();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [currentStep, lastBottleTime, sessionTimeout, binData]);

  // Function to update bin activity timestamp
  const updateBinActivity = async () => {
    if (!binData || !binId) return;

    try {
      const binRef = doc(db, 'bins', binId);
      const binSnap = await getDoc(binRef);
      let actualBinRef;
      if (binSnap.exists()) {
        actualBinRef = binRef;
      } else {
        const binsRef = collection(db, 'bins');
        const q = query(binsRef, where('bin_id', '==', binId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          actualBinRef = doc(db, 'bins', querySnapshot.docs[0].id);
        } else {
          return;
        }
      }

      await updateDoc(actualBinRef, {
        last_activity: serverTimestamp()
      });
      console.log('🔄 Bin activity updated');
    } catch (error) {
      console.error('Error updating bin activity:', error);
    }
  };

  // --- Render Logic ---
  if (processing) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2 className="text-primary">Processing...</h2>
          <p className="text-secondary">Please wait</p>
        </div>
      </div>
    );
  }

  // Render occupied state
  if (currentStep === 'occupied') {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <div className="mb-4">
              <div style={{
                width: '80px', height: '80px', margin: '0 auto', backgroundColor: '#FF6B6B',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px'
              }}>
                🔒
              </div>
            </div>
            <h2 className="text-warning mb-2">Bin {binId} is Occupied</h2>
            <p className="text-secondary mb-4">
              Another user is currently using this recycling bin.
              Please wait for them to finish or try a different bin.
            </p>
            <div className="grid grid-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <button onClick={handleTryAgain} className="btn btn-outline btn-lg">
                🔄 Try Again
              </button>
              <button onClick={handleGoBackFromOccupied} className="btn btn-primary btn-lg">
                🔙 Go Back
              </button>
            </div>
            <div className="card mt-4">
              <h4 className="text-secondary">💡 Tips</h4>
              <div className="text-sm text-secondary">
                <p>• Sessions typically last 3 minutes</p>
                <p>• You can try scanning again in a few minutes</p>
                <p>• Look for other available bins nearby</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wrong Classification Modal - rendered on top of any state */}
        <WrongClassificationModal
          isOpen={showWrongClassificationModal}
          onClose={() => setShowWrongClassificationModal(false)}
          onSubmit={handleWrongClassificationSubmit}
          wrongClassificationData={wrongClassificationData}
        />
      </div>
    );
  }

  // Render waiting state
  if (currentStep === 'waiting') {
    return (
      <>
        <WaitingScreen
          onIdentificationReceived={handleIdentificationReceived}
          userData={userData}
          sessionBottles={sessionBottles}
          sessionPoints={sessionPoints}
          onFinishSession={endSession}
          sessionStartTime={sessionStartTime}
          lastBottleTime={lastBottleTime}
        />
        
        {/* Wrong Classification Modal - rendered on top of any state */}
        <WrongClassificationModal
          isOpen={showWrongClassificationModal}
          onClose={() => setShowWrongClassificationModal(false)}
          onSubmit={handleWrongClassificationSubmit}
          wrongClassificationData={wrongClassificationData}
        />
      </>
    );
  }

  // Render confirmation state
  if (currentStep === 'confirmation') {
    return (
      <>
        <IdentificationConfirmation
          wasteEvent={wasteEvent}
          onCorrect={handleCorrectIdentification}
          onIncorrect={handleIncorrectIdentification}
        />
        
        {/* Wrong Classification Modal - rendered on top of any state */}
        <WrongClassificationModal
          isOpen={showWrongClassificationModal}
          onClose={() => setShowWrongClassificationModal(false)}
          onSubmit={handleWrongClassificationSubmit}
          wrongClassificationData={wrongClassificationData}
        />
      </>
    );
  }

  // Render correction state
  if (currentStep === 'correction') {
    return (
      <>
        <CorrectionForm
          originalIdentification={wasteEvent?.waste_type}
          onSubmit={handleCorrectionSubmit}
          onCancel={() => setCurrentStep('waiting')} // Go back to waiting if cancelled
        />
        
        {/* Wrong Classification Modal - rendered on top of any state */}
        <WrongClassificationModal
          isOpen={showWrongClassificationModal}
          onClose={() => setShowWrongClassificationModal(false)}
          onSubmit={handleWrongClassificationSubmit}
          wrongClassificationData={wrongClassificationData}
        />
      </>
    );
  }

  // Render summary state
  if (currentStep === 'summary') {
    return (
      <>
        <SessionSummary
          sessionBottles={sessionBottles}
          sessionPoints={sessionPoints}
          sessionStartTime={sessionStartTime}
          onAwardPoints={handleAwardSessionPoints}
          onReset={handleNewSession}
          userData={userData}
        />
        
        {/* Wrong Classification Modal - rendered on top of any state */}
        <WrongClassificationModal
          isOpen={showWrongClassificationModal}
          onClose={() => setShowWrongClassificationModal(false)}
          onSubmit={handleWrongClassificationSubmit}
          wrongClassificationData={wrongClassificationData}
        />
      </>
    );
  }

         // Default loading state
    return (
      <div className="container">
        <div className="card text-center">
          <h2 className="text-primary">Loading Recycling Session...</h2>
          <p className="text-secondary">Please wait while we set up your session.</p>
        </div>
      </div>
    );
};

export default RecyclingSession;
