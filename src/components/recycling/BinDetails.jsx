import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { setDoc, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import '../../styles/BinDetails.css';

const BinDetails = () => {
  const { binId } = useParams();
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wasteEvents, setWasteEvents] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [processingEvent, setProcessingEvent] = useState(false);
  const navigate = useNavigate();

  // Ref to track if the initial snapshot has been processed
  const isInitialSnapshot = useRef(true);

  // Function to release bin
  const releaseBin = async () => {
    if (!bin) return;
    try {
      const db = getFirestore();
      const binsRef = collection(db, 'bins');
      const q = query(binsRef, where('bin_id', '==', binId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const binDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'bins', binDoc.id), {
          status: 'available',
          current_user: null,
          last_update: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error releasing bin:', err);
    }
  };

  useEffect(() => {
    let unsubscribe = null;

    const fetchBinAndSetupListener = async () => {
      try {
        const db = getFirestore();
        const binsRef = collection(db, 'bins');
        const q = query(binsRef, where('bin_id', '==', binId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const binDoc = querySnapshot.docs[0];
          const binData = binDoc.data();
          setBin(binData);

          // Set up real-time listener for waste events
          const wasteEventsQuery = query(
            collection(db, 'waste_events'),
            where('bin_id', '==', binId)
          );

          // Attach listener
          unsubscribe = onSnapshot(wasteEventsQuery, async (snapshot) => {
            const events = [];
            let newEventDetected = false;
            let latestEventData = null; // To store data of the most recent added event

            // Process changes regardless of initial snapshot to update displayed list
            snapshot.docChanges().forEach((change) => {
              const eventData = { id: change.doc.id, ...change.doc.data() };
              events.push(eventData);

              // Only consider 'added' changes for detecting a new event trigger
              if (change.type === "added") {
                 // Keep track of the latest added event data
                 if (!latestEventData || (eventData.timestamp?.toMillis() || 0) > (latestEventData.timestamp?.toMillis() || 0)) {
                    latestEventData = eventData;
                 }
              }
            });

            // Sort events by timestamp descending for display
            events.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

            // Update state with all current events from the snapshot
            setWasteEvents(events);
            setIsListening(true); // Mark as listening

            // --- Logic to trigger actions only for new events AFTER initial load ---
            if (!isInitialSnapshot.current) {
               // This is NOT the initial snapshot, check for added events
               const addedChanges = snapshot.docChanges().filter(change => change.type === "added");

               if (addedChanges.length > 0) {
                  console.log("Detected new waste event(s) added after initial load.");
                  // Find the most recent added event among the new changes
                  const latestAddedChange = addedChanges.reduce((latest, change) => {
                     const currentEventData = { id: change.doc.id, ...change.doc.data() };
                     if (!latest || (currentEventData.timestamp?.toMillis() || 0) > (latest.doc.data().timestamp?.toMillis() || 0)) {
                        return change;
                     }
                     return latest;
                  }, null);

                  if (latestAddedChange) {
                     const latestEventData = { id: latestAddedChange.doc.id, ...latestAddedChange.doc.data() };
                     console.log("Processing most recent new waste event:", latestEventData);
                     const auth = getAuth();
                     const user = auth.currentUser;

                     if (user) {
                       try {
                         const db = getFirestore();
                         const userRef = doc(db, 'users', user.uid);

                         // Use points_earned from the event data, default to 1 if not present
                         const pointsToAdd = latestEventData.points_earned || 1;

                         await updateDoc(userRef, {
                           total_points: increment(pointsToAdd),
                           items_recycled: increment(1),
                           last_activity: serverTimestamp() // Update last activity
                         });
                         console.log(`User ${user.uid} profile updated: +${pointsToAdd} points, +1 item.`);

                         // Release bin and navigate after successful user update
                         await releaseBin();
                         navigate('/dashboard', { state: { successMessage: `Successfully recycled! You earned ${pointsToAdd} points.` } });

                       } catch (userUpdateError) {
                         console.error("Error updating user profile after waste event:", userUpdateError);
                         alert('Failed to update user profile after recycling event.');
                         await releaseBin(); // Still try to release bin
                         navigate('/dashboard', { state: { errorMessage: 'Recycling recorded, but failed to update profile.' } });
                       }
                     } else {
                       console.warn("New waste event detected but no user is signed in.");
                       await releaseBin(); // Still release bin
                       navigate('/dashboard', { state: { errorMessage: 'Recycling recorded, but user profile not updated (not signed in).' } });
                     }
                  }
               }

            } else {
              // This is the initial snapshot, do NOT trigger user update/navigation
              console.log("Initial waste events snapshot processed.");
              isInitialSnapshot.current = false; // Mark initial snapshot as processed
            }
            // --- End of logic for triggering actions ---

          }, (err) => {
            console.error("Error listening to waste events:", err);
            setError('Error listening for waste events: ' + err.message);
            setIsListening(false); // Mark as not listening on error
          });

          // Set bin to occupied
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            await updateDoc(doc(db, 'bins', binDoc.id), {
              status: 'occupied',
              current_user: user.uid,
              last_update: serverTimestamp()
            });
            // Update local state immediately for better responsiveness
            setBin(prevBin => ({ ...prevBin, status: 'occupied', current_user: user.uid }));
          } else {
             setError('Please sign in to occupy this bin.');
             setLoading(false);
          }

        } else {
          setError('Bin not found.');
        }
      } catch (err) {
        setError('Error loading bin data: ' + err.message);
        console.error('Error loading bin data:', err);
      } finally {
         if (!error) setLoading(false);
      }
    };

    fetchBinAndSetupListener();

    return () => {
      if (unsubscribe) unsubscribe();
      setIsListening(false); // Mark as not listening
      // Important: Call releaseBin during cleanup if bin was successfully occupied
      releaseBin();
    };

  }, [binId, navigate]); // Depend on binId and navigate

  // Handle waste event (simulate button)
  const handleWasteEvent = async () => {
    if (!bin || processingEvent) return; // Prevent multiple clicks while processing
    setProcessingEvent(true);
    try {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
         alert("No user is signed in. Cannot simulate.");
         setProcessingEvent(false); // Ensure processing state is reset
         return;
      }

      // Generate session ID for this simulation
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Create multiple waste events to simulate a session
      const bottleTypes = ['plastic', 'glass', 'aluminum', 'other'];
      const numBottles = Math.floor(Math.random() * 3) + 2; // 2-4 bottles

      for (let i = 0; i < numBottles; i++) {
        const wasteType = bottleTypes[Math.floor(Math.random() * bottleTypes.length)];
        
        // Create waste event - this will be detected by the onSnapshot listener
        const eventRef = doc(collection(db, 'waste_events'));
        const simulatedEventData = {
          bin_id: bin.bin_id,
          user_id: user.uid,
          timestamp: serverTimestamp(),
          event_type: 'simulated_bottle_thrown', // Use a distinct type for simulation
          bin_status_before: bin.status,
          bin_capacity_before: bin.capacity,
          // Include points earned and waste type for the listener to process
          points_earned: 1, // 1 point per bottle regardless of type
          waste_type: wasteType, // Random waste type for simulation
          // New session tracking fields
          session_id: sessionId,
          session_timestamp: serverTimestamp()
        };

        await setDoc(eventRef, simulatedEventData);
        
        // Small delay between events for realistic simulation
        if (i < numBottles - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // The onSnapshot listener will now handle releasing the bin, updating user profile, and navigation

    } catch (err) {
      alert('Failed to create simulated waste event: ' + err.message);
      console.error('Error creating simulated waste event:', err);
    } finally {
      setProcessingEvent(false);
    }
  };

  // Handle back button click - This is for manual exit BEFORE an event occurs
  const handleBack = async () => {
    // Only release the bin if it was successfully occupied by the current user
    if (bin?.current_user === getAuth()?.currentUser?.uid) {
       await releaseBin();
    }
    navigate('/dashboard'); // Navigate back to dashboard
  };

  // Render content based on loading/error state
  const renderContent = () => {
    if (error) {
      return (
        <div className="card">
          <div className="message message-error">
            <h3>❌ Oops! Something went wrong</h3>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    // Display bin details and events once bin data is loaded
    return (
      <div className="fade-in">
        <div className="card mb-4">
          <div className="text-center">
            <div className="text-success" style={{ fontSize: '3rem' }}>🗑️</div>
            <h2 className="text-success">Bin #{bin?.bin_id}</h2>
            <p className="text-secondary">Ready to recycle!</p>
          </div>
        </div>

        <div className="grid grid-2 mb-4">
          <div className="card">
            <h4>📍 Location</h4>
            <p className="font-semibold">{bin?.location}</p>
          </div>
          <div className="card">
            <h4>📊 Status</h4>
            <div className="badge badge-success">{bin?.status}</div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-center">📝 Recent Activity</h3>
          {isListening ? (
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="text-secondary mt-2">Listening for new waste events...</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-secondary">Setting up listener...</p>
            </div>
          )}

          <div className="mt-4">
            {wasteEvents.length > 0 ? (
              <div className="grid grid-1">
                {wasteEvents.map(event => (
                  <div key={event.id} className="card">
                    <div className="flex-between">
                      <div>
                        <p className="font-semibold">
                          🕒 {event.timestamp?.toDate().toLocaleString()}
                        </p>
                        <p className="text-secondary">Type: {event.event_type}</p>
                        {event.waste_type && (
                          <p className="text-secondary">Waste: {event.waste_type}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {typeof event.points_earned !== 'undefined' && (
                          <div className="badge badge-success">
                            +{event.points_earned} pts
                          </div>
                        )}
                        {event.user_name && (
                          <p className="text-secondary">{event.user_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-secondary" style={{ fontSize: '3rem' }}>📝</div>
                <p className="text-secondary">No waste events recorded yet for this bin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Simulate button is only available when bin is occupied by the current user */}
        {bin?.status === 'occupied' && bin?.current_user === getAuth()?.currentUser?.uid && (
          <div className="card mt-4">
            <div className="text-center">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleWasteEvent}
                disabled={processingEvent}
              >
                {processingEvent ? (
                  <>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: 'var(--spacing-sm)' }}></div>
                    Processing...
                  </>
                ) : (
                  '♻️ Simulate Multi-Bottle Session'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      {/* Back button */}
      <div className="mb-4">
        <button className="btn btn-outline" onClick={handleBack}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Render content based on loading/error state */}
      {loading ? (
        <div className="card">
          <div className="flex-center" style={{ minHeight: '40vh' }}>
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="text-secondary mt-3">Loading bin details...</p>
            </div>
          </div>
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
};

export default BinDetails;