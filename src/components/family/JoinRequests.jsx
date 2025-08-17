import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const JoinRequests = ({ onInvitationAccepted, onInvitationDeclined }) => {
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return;

    const db = getFirestore();
    
    // Listen for join requests sent to this user
    const requestsQuery = query(
      collection(db, 'join_requests'),
      where('to_user_id', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJoinRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptRequest = async (request) => {
    setProcessing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();

      // Add user to family members
      const familyRef = doc(db, 'families', request.family_id);
      const familyDoc = await getDocs(query(collection(db, 'families'), where('__name__', '==', request.family_id)));
      const familyData = familyDoc.docs[0]?.data();
      
      if (familyData) {
        const currentMembers = familyData.members || [];
        await updateDoc(familyRef, {
          members: [...currentMembers, user.uid]
        });
      }

      // Update requesting user's family info
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        family_id: request.family_id,
        last_activity: new Date()
      });

      // Update request status
      const requestRef = doc(db, 'join_requests', request.id);
      await updateDoc(requestRef, {
        status: 'accepted',
        responded_at: new Date()
      });

      if (onInvitationAccepted) {
        onInvitationAccepted(request);
      }

    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineRequest = async (request) => {
    setProcessing(true);
    try {
      const db = getFirestore();
      
      // Update request status
      const requestRef = doc(db, 'join_requests', request.id);
      await updateDoc(requestRef, {
        status: 'declined',
        responded_at: new Date()
      });

      if (onInvitationDeclined) {
        onInvitationDeclined(request);
      }

    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading invitations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="text-center mb-4">
          <div className="text-info" style={{ fontSize: '3rem' }}>📨</div>
          <h1 className="text-primary">Join Requests</h1>
          <p className="text-secondary">Invitations from family members</p>
        </div>

        {joinRequests.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-muted" style={{ fontSize: '4rem' }}>📭</div>
            <h3 className="text-muted">No Invitations</h3>
            <p className="text-secondary">You don't have any pending family invitations.</p>
          </div>
        ) : (
          <div className="list-group">
            {joinRequests.map((request) => (
              <div key={request.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{request.family_name}</h5>
                    <p className="mb-1 text-secondary">
                      Invited by: {request.from_user_name}
                    </p>
                    <small className="text-muted">
                      {request.created_at?.toDate?.() ? 
                        request.created_at.toDate().toLocaleDateString() : 
                        'Recently'
                      }
                    </small>
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleAcceptRequest(request)}
                      disabled={processing}
                    >
                      {processing ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        'Accept'
                      )}
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeclineRequest(request)}
                      disabled={processing}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinRequests;
