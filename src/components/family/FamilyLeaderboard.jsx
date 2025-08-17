import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const FamilyLeaderboard = ({ userData, familyData, onFamilyLeft, onFamilyDeleted }) => {
  const [inviteUserId, setInviteUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);

  useEffect(() => {
    if (familyData?.members) {
      // Sort members by points (highest first)
      const sortedMembers = familyData.members.sort((a, b) => b.total_points - a.total_points);
      setFamilyMembers(sortedMembers);
    }
  }, [familyData]);

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (inviteUserId.trim().length === 0) {
      setError('Please enter a user ID');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to send invitations');
        return;
      }

      const db = getFirestore();
      
      // Find user by user_id field
      const userQuery = query(collection(db, 'users'), where('user_id', '==', inviteUserId.trim()));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        setError('No user found with this ID. Please check the ID and try again.');
        setLoading(false);
        return;
      }

      const targetUserDoc = userSnapshot.docs[0];
      const targetUserData = targetUserDoc.data();

      // Check if user is already in a family
      if (targetUserData.family_id) {
        setError('This user is already part of a family.');
        setLoading(false);
        return;
      }

      // Create join request
      await addDoc(collection(db, 'join_requests'), {
        from_user_id: user.uid,
        from_user_name: `${userData.first_name} ${userData.last_name}`,
        to_user_id: targetUserDoc.id,
        family_id: familyData.id,
        family_name: familyData.family_name,
        status: 'pending',
        created_at: serverTimestamp()
      });

      setSuccess('Invitation sent successfully!');
      setInviteUserId('');

    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveFamily = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();

      // Remove user from family members
      const familyRef = doc(db, 'families', familyData.id);
      const currentMembers = familyData.members || [];
      const updatedMembers = currentMembers.filter(memberId => memberId !== user.uid);
      
      await updateDoc(familyRef, {
        members: updatedMembers
      });

      // Clear user's family info
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        family_id: '',
        last_activity: new Date()
      });

      if (onFamilyLeft) {
        onFamilyLeft();
      }

    } catch (error) {
      console.error('Error leaving family:', error);
      alert('Failed to leave family. Please try again.');
    } finally {
      setLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleDeleteFamily = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();

      // Check if user is the family creator
      if (familyData.created_by !== user.uid) {
        alert('Only the family creator can delete the family.');
        setLoading(false);
        setShowDeleteConfirm(false);
        return;
      }

      // Remove all members from family
      const membersQuery = query(
        collection(db, 'users'),
        where('family_id', '==', familyData.id)
      );
      const membersSnapshot = await getDocs(membersQuery);
      
      const updatePromises = membersSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          family_id: '',
          last_activity: new Date()
        })
      );
      
      await Promise.all(updatePromises);

      // Delete the family
      const familyRef = doc(db, 'families', familyData.id);
      await deleteDoc(familyRef);

      if (onFamilyDeleted) {
        onFamilyDeleted();
      }

    } catch (error) {
      console.error('Error deleting family:', error);
      alert('Failed to delete family. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="text-center mb-4">
          <div className="text-warning" style={{ fontSize: '4rem' }}>👨‍👩‍👧‍👦</div>
          <h1 className="text-success">Family Recycling Challenge</h1>
        </div>

        {/* Family Leaderboard */}
        <div className="card mb-4">
          <div className="card-header d-flex align-items-center">
            <span className="me-2" style={{ fontSize: '1.5rem' }}>🏆</span>
            <h3 className="mb-0">Family Leaderboard</h3>
          </div>
          <div className="card-body">
            {familyMembers.length === 0 ? (
              <p className="text-center text-muted">No family members found.</p>
            ) : (
              <div className="list-group list-group-flush">
                {familyMembers.map((member, index) => (
                  <div key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <span className={`badge ${index === 0 ? 'bg-warning' : 'bg-secondary'} me-3`}>
                        #{index + 1}
                      </span>
                      <span className="fw-bold">{member.first_name} {member.last_name}</span>
                    </div>
                    <span className="text-primary fw-bold">{member.total_points} points</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Invite New Member */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Invite New Member</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSendInvitation}>
              <div className="row">
                <div className="col-md-8">
                  <input
                    type="text"
                    className={`form-control ${error ? 'is-invalid' : ''}`}
                    placeholder="Enter user ID"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    disabled={loading}
                  />
                  {error && <div className="invalid-feedback">{error}</div>}
                  {success && <div className="valid-feedback">{success}</div>}
                </div>
                <div className="col-md-4">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      'Send Invitation'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Family Actions */}
        <div className="d-grid gap-2">
          <button
            className="btn btn-outline-warning"
            onClick={() => setShowLeaveConfirm(true)}
            disabled={loading}
          >
            Leave Family
          </button>
          {familyData?.created_by === getAuth().currentUser?.uid && (
            <button
              className="btn btn-outline-danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              Delete Family
            </button>
          )}
        </div>
      </div>

      {/* Leave Family Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Leave Family</h5>
                <button type="button" className="btn-close" onClick={() => setShowLeaveConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to leave this family? You will lose access to the family leaderboard.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-warning" onClick={handleLeaveFamily}>
                  Leave Family
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Family Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Family</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this family? This action cannot be undone and all members will be removed.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteFamily}>
                  Delete Family
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyLeaderboard;
