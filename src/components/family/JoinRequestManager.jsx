import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const JoinRequestManager = ({ userData, familyData, onRequestProcessed }) => {
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user || !familyData?.id) return;

    const db = getFirestore();
    
    // Listen for join requests for this family
    const requestsQuery = query(
      collection(db, 'join_requests'),
      where('family_id', '==', familyData.id),
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
  }, [familyData?.id]);

  const handleApproveRequest = async (request) => {
    setProcessing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();

      // Add user to family members
      const familyRef = doc(db, 'groups', familyData.id);
      const currentMembers = familyData.members || [];
      await updateDoc(familyRef, {
        members: [...currentMembers, request.user_id]
      });

      // Update requesting user's family info
      const userRef = doc(db, 'users', request.user_id);
      await updateDoc(userRef, {
        'family.group_id': familyData.id,
        'family.role': 'member',
        last_activity: new Date()
      });

      // Update request status
      const requestRef = doc(db, 'join_requests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        approved_by: user.uid,
        responded_at: new Date()
      });

      if (onRequestProcessed) {
        onRequestProcessed();
      }

    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
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

      if (onRequestProcessed) {
        onRequestProcessed();
      }

    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="flex-center" style={{ minHeight: '40vh' }}>
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="text-secondary mt-3">Loading join requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="text-center mb-4">
          <div className="text-info" style={{ fontSize: '4rem' }}>🤝</div>
          <h2 className="text-success">Join Requests</h2>
          <p className="text-secondary">Approve or decline requests to join your family</p>
        </div>

        {joinRequests.length === 0 ? (
          <div className="text-center">
            <div className="text-secondary" style={{ fontSize: '3rem' }}>📭</div>
            <h3>No Pending Requests</h3>
            <p className="text-secondary">No one has requested to join your family yet.</p>
          </div>
        ) : (
          <div className="grid grid-1">
            {joinRequests.map((request) => (
              <div key={request.id} className="card">
                <div className="flex-between">
                  <div>
                    <h4 className="text-success">👤 {request.user_name || 'Unknown User'}</h4>
                    <p className="text-secondary">
                      User ID: {request.user_id}
                    </p>
                    <p className="text-secondary text-sm">
                      Requested: {request.created_at?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex">
                    <button
                      onClick={() => handleApproveRequest(request)}
                      disabled={processing}
                      className="btn btn-success"
                      style={{ marginRight: 'var(--spacing-sm)' }}
                    >
                      {processing ? (
                        <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                      ) : (
                        '✅ Approve'
                      )}
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request)}
                      disabled={processing}
                      className="btn btn-danger"
                    >
                      {processing ? (
                        <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                      ) : (
                        '❌ Decline'
                      )}
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

export default JoinRequestManager; 