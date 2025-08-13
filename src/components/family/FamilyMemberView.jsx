import React, { useState } from 'react';
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const FamilyMemberView = ({ userData, familyData, onFamilyLeft, onFamilyDeleted }) => {
  const [inviteUserId, setInviteUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mock data for the screenshot - replace with real data later
  const mockFamilyMembers = [
    { id: '1', first_name: 'Eilam', last_name: '', total_points: 48, is_admin: true },
    { id: '2', first_name: 'Rotem', last_name: '', total_points: 42, is_admin: false },
    { id: '3', first_name: 'Avshi', last_name: '', total_points: 35, is_admin: false },
    { id: '4', first_name: 'Mika', last_name: '', total_points: 28, is_admin: false },
    { id: '5', first_name: 'Elizabeth', last_name: '', total_points: 15, is_admin: false }
  ];

  // Sort by points (highest first)
  const sortedMembers = mockFamilyMembers.sort((a, b) => b.total_points - a.total_points);

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
      if (targetUserData.family && targetUserData.family.group_id) {
        setError('This user is already part of a family.');
        setLoading(false);
        return;
      }

      // Create invitation
      await addDoc(collection(db, 'invitations'), {
        from_user_id: user.uid,
        from_user_name: `${userData.first_name} ${userData.last_name}`,
        to_user_id: targetUserDoc.id, // Use the document ID
        family_id: familyData.id,
        family_name: familyData.group_name,
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
      const familyRef = doc(db, 'groups', familyData.id);
      const currentMembers = familyData.members || [];
      const updatedMembers = currentMembers.filter(memberId => memberId !== user.uid);
      
      await updateDoc(familyRef, {
        members: updatedMembers
      });

      // Clear user's family info
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        family: {
          group_id: '',
          role: '',
          is_current_winner: false,
          total_wins: 0
        },
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
        where('family.group_id', '==', familyData.id)
      );
      const membersSnapshot = await getDocs(membersQuery);
      
      const updatePromises = membersSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          family: {
            group_id: '',
            role: '',
            is_current_winner: false,
            total_wins: 0
          },
          last_activity: new Date()
        })
      );
      
      await Promise.all(updatePromises);

      // Delete the family
      const familyRef = doc(db, 'groups', familyData.id);
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

  const isFamilyCreator = familyData?.created_by === getAuth().currentUser?.uid;

  return (
    <div className="container">
      {/* App Content */}
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👨‍👩‍👧‍👦</div>
          <p style={{ 
            fontSize: '16px', 
            color: '#666',
            margin: '0',
            fontWeight: '500'
          }}>
            Family Recycling Challenge
          </p>
        </div>

        {/* Leaderboard Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          {/* Leaderboard Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '20px',
            fontSize: '20px',
            fontWeight: '700',
            color: '#1a1a1a'
          }}>
            <span style={{ marginRight: '8px' }}>🏆</span>
            Family Leaderboard
          </div>

          {/* Leaderboard Entries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedMembers.map((member, index) => (
              <div key={member.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: index < sortedMembers.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Rank */}
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: index === 0 ? '#ffd700' : '#666',
                    marginRight: '16px',
                    minWidth: '30px'
                  }}>
                    #{index + 1}
                  </div>
                  
                  {/* Name */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: index === 0 ? '700' : '600',
                    color: '#1a1a1a'
                  }}>
                    {member.first_name}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Points */}
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#007AFF'
                  }}>
                    {member.total_points} points
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Members */}
      <div className="card mb-4">
        <div className="text-center mb-4">
          <h3>📨 Invite Members</h3>
          <p className="text-secondary">Invite new users to join your family</p>
        </div>
        
        <form onSubmit={handleSendInvitation} className="grid grid-1">
          <div>
            <label htmlFor="inviteUserId" className="font-semibold">
              👤 User ID
            </label>
            <input
              type="text"
              id="inviteUserId"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              placeholder="Enter the user's ID to invite"
              required
              className="card"
              style={{ 
                width: '100%', 
                padding: 'var(--spacing-md)',
                border: '2px solid var(--medium-gray)',
                borderRadius: 'var(--border-radius-md)',
                marginTop: 'var(--spacing-sm)'
              }}
            />
            <p className="text-secondary text-sm mt-2">
              💡 You can find user IDs in the admin panel or ask users for their ID
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-warning btn-lg" 
            disabled={loading || inviteUserId.trim().length === 0}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: 'var(--spacing-sm)' }}></div>
                Sending...
              </>
            ) : (
              '📨 Send Invitation'
            )}
          </button>
        </form>

        {error && (
          <div className="message message-error mt-4">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="message message-success mt-4">
            <p>{success}</p>
          </div>
        )}
      </div>

      {/* Family Actions */}
      <div className="card">
        <h3 className="text-center mb-4">⚙️ Family Actions</h3>
        
        <div className="grid grid-2">
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="btn btn-danger"
            disabled={loading}
          >
            🚪 Leave Family
          </button>
          
          {isFamilyCreator && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger"
              disabled={loading}
            >
              🗑️ Delete Family
            </button>
          )}
        </div>
      </div>

      {/* Leave Family Confirmation */}
      {showLeaveConfirm && (
        <div className="card mt-4" style={{ border: '2px solid var(--accent-red)' }}>
          <h4 className="text-danger text-center">⚠️ Leave Family?</h4>
          <p className="text-center text-secondary">
            Are you sure you want to leave {familyData.group_name}? You can always rejoin later.
          </p>
          <div className="grid grid-2 mt-4">
            <button
              onClick={() => setShowLeaveConfirm(false)}
              className="btn btn-outline"
              disabled={loading}
            >
              ❌ Cancel
            </button>
            <button
              onClick={handleLeaveFamily}
              className="btn btn-danger"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }}></div>
                  Leaving...
                </>
              ) : (
                '🚪 Leave Family'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete Family Confirmation */}
      {showDeleteConfirm && (
        <div className="card mt-4" style={{ border: '2px solid var(--accent-red)' }}>
          <h4 className="text-danger text-center">⚠️ Delete Family?</h4>
          <p className="text-center text-secondary">
            This will permanently delete {familyData.group_name} and remove all members. This action cannot be undone.
          </p>
          <div className="grid grid-2 mt-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn btn-outline"
              disabled={loading}
            >
              ❌ Cancel
            </button>
            <button
              onClick={handleDeleteFamily}
              className="btn btn-danger"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }}></div>
                  Deleting...
                </>
              ) : (
                '🗑️ Delete Family'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberView; 