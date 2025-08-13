import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const InvitationManager = ({ userData, onInvitationAccepted, onInvitationDeclined }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return;

    const db = getFirestore();
    
    // Listen for invitations sent to this user
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('to_user_id', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(invitationsQuery, (snapshot) => {
      const invitationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvitations(invitationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptInvitation = async (invitation) => {
    setProcessing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();

      // Update user's family info
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'family.group_id': invitation.family_id,
        'family.role': 'member',
        last_activity: new Date()
      });

      // Add user to family members
      const familyRef = doc(db, 'groups', invitation.family_id);
      const familyDoc = await getDocs(query(collection(db, 'groups'), where('__name__', '==', invitation.family_id)));
      const familyData = familyDoc.docs[0]?.data();
      
      if (familyData) {
        await updateDoc(familyRef, {
          members: [...(familyData.members || []), user.uid]
        });
      }

      // Update invitation status
      const invitationRef = doc(db, 'invitations', invitation.id);
      await updateDoc(invitationRef, {
        status: 'accepted',
        responded_at: new Date()
      });

      if (onInvitationAccepted) {
        onInvitationAccepted(invitation);
      }

    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvitation = async (invitation) => {
    setProcessing(true);
    try {
      const db = getFirestore();
      
      // Update invitation status
      const invitationRef = doc(db, 'invitations', invitation.id);
      await updateDoc(invitationRef, {
        status: 'declined',
        responded_at: new Date()
      });

      if (onInvitationDeclined) {
        onInvitationDeclined(invitation);
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
          <div className="flex-center" style={{ minHeight: '40vh' }}>
            <div className="text-center">
              <div className="loading-spinner"></div>
              <p className="text-secondary mt-3">Loading invitations...</p>
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
          <div className="text-info" style={{ fontSize: '4rem' }}>📨</div>
          <h2 className="text-success">Family Invitations</h2>
          <p className="text-secondary">Manage your family invitations</p>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center">
            <div className="text-secondary" style={{ fontSize: '3rem' }}>📭</div>
            <h3>No Pending Invitations</h3>
            <p className="text-secondary">You don't have any pending family invitations.</p>
          </div>
        ) : (
          <div className="grid grid-1">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="card">
                <div className="flex-between">
                  <div>
                    <h4 className="text-success">🏠 {invitation.family_name}</h4>
                    <p className="text-secondary">
                      Invited by: {invitation.from_user_name || 'Unknown User'}
                    </p>
                    <p className="text-secondary text-sm">
                      Sent: {invitation.created_at?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex">
                    <button
                      onClick={() => handleAcceptInvitation(invitation)}
                      disabled={processing}
                      className="btn btn-success"
                      style={{ marginRight: 'var(--spacing-sm)' }}
                    >
                      {processing ? (
                        <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                      ) : (
                        '✅ Accept'
                      )}
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(invitation)}
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

export default InvitationManager; 