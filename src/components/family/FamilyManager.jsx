import React, { useState } from 'react';
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const FamilyManager = ({ onFamilyCreated, onFamilyJoined, userData }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join'
  const [familyName, setFamilyName] = useState('');
  const [joinFamilyName, setJoinFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (familyName.trim().length === 0) {
      setError('Family name cannot be empty');
      setLoading(false);
      return;
    }

    if (familyName.length > 20) {
      setError('Family name cannot be longer than 20 characters');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to create a family');
        return;
      }

      const db = getFirestore();
      
      // Check if family name already exists
      const existingFamilyQuery = query(collection(db, 'groups'), where('group_name', '==', familyName.trim()));
      const existingFamilySnapshot = await getDocs(existingFamilyQuery);
      
      if (!existingFamilySnapshot.empty) {
        setError('A family with this name already exists. Please choose a different name.');
        setLoading(false);
        return;
      }

      // Create new family
      const familyRef = await addDoc(collection(db, 'groups'), {
        group_name: familyName.trim(),
        group_id: familyName.trim().toLowerCase().replace(/\s+/g, '_'), // Create a group_id from the name
        created_at: serverTimestamp(),
        created_by: user.uid,
        members: [user.uid],
        total_points: 0
      });

      // Update user's family info
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'family.group_id': familyRef.id,
        'family.role': 'admin',
        last_activity: serverTimestamp()
      });

      const groupId = familyName.trim().toLowerCase().replace(/\s+/g, '_');
      setSuccess(`Family created successfully! Your family ID is: ${groupId}`);
      setTimeout(() => {
        if (onFamilyCreated) {
          onFamilyCreated({
            id: familyRef.id,
            group_name: familyName.trim(),
            group_id: groupId,
            members: [{ id: user.uid, name: userData?.first_name || 'You' }]
          });
        }
      }, 1500);

    } catch (error) {
      console.error('Error creating family:', error);
      setError('Failed to create family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (joinFamilyName.trim().length === 0) {
      setError('Please enter a family name');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to join a family');
        return;
      }

      const db = getFirestore();
      
      // Find family by group_id
      const familyQuery = query(collection(db, 'groups'), where('group_id', '==', joinFamilyName.trim()));
      const familySnapshot = await getDocs(familyQuery);
      
      if (familySnapshot.empty) {
        setError('No family found with this ID. Please check the ID and try again.');
        setLoading(false);
        return;
      }

      const familyDoc = familySnapshot.docs[0];
      const familyData = familyDoc.data();

      // Check if user is already a member
      if (familyData.members && familyData.members.includes(user.uid)) {
        setError('You are already a member of this family.');
        setLoading(false);
        return;
      }

      // Create join request instead of directly joining
      await addDoc(collection(db, 'join_requests'), {
        user_id: user.uid,
        user_name: `${userData.first_name} ${userData.last_name}`,
        family_id: familyDoc.id,
        family_name: familyData.group_name,
        status: 'pending',
        created_at: serverTimestamp()
      });

      setSuccess('Join request sent! Family members will review your request.');
      setJoinFamilyName('');

    } catch (error) {
      console.error('Error sending join request:', error);
      setError('Failed to send join request. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="container">
      <div className="card">
        <div className="text-center mb-4">
          <div className="text-warning" style={{ fontSize: '4rem' }}>👨‍👩‍👧‍👦</div>
          <h1 className="text-success">Family Management</h1>
          <p className="text-secondary">Create or join a family to compete together!</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-4" style={{ borderBottom: '2px solid var(--light-gray)' }}>
          <button 
            className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('create')}
            style={{ marginRight: 'var(--spacing-sm)', borderRadius: 'var(--border-radius-md) 0 0 0' }}
          >
            🏠 Create Family
          </button>
          <button 
            className={`btn ${activeTab === 'join' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('join')}
            style={{ borderRadius: '0 var(--border-radius-md) 0 0' }}
          >
            🤝 Join Family
          </button>
        </div>

        {/* Create Family Tab */}
        {activeTab === 'create' && (
          <div className="fade-in">
            <form onSubmit={handleCreateFamily} className="grid grid-1">
              <div>
                <label htmlFor="familyName" className="font-semibold">
                  👨‍👩‍👧‍👦 Family Name
                  <span className="text-secondary" style={{ fontSize: '0.8rem', marginLeft: 'var(--spacing-sm)' }}>
                    {familyName.length}/20
                  </span>
                </label>
                <input
                  type="text"
                  id="familyName"
                  value={familyName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 20) {
                      setFamilyName(value);
                      setError('');
                    } else {
                      setError('Family name cannot be longer than 20 characters');
                    }
                  }}
                  placeholder="Enter family name"
                  maxLength={20}
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
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg" 
                disabled={loading || familyName.trim().length === 0 || familyName.length > 20}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: 'var(--spacing-sm)' }}></div>
                    Creating...
                  </>
                ) : (
                  '🚀 Create Family'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Join Family Tab */}
        {activeTab === 'join' && (
          <div className="fade-in">
            <form onSubmit={handleJoinFamily} className="grid grid-1">
              <div>
                <label htmlFor="joinFamilyName" className="font-semibold">
                  🔍 Family ID
                </label>
                <input
                  type="text"
                  id="joinFamilyName"
                  value={joinFamilyName}
                  onChange={(e) => setJoinFamilyName(e.target.value)}
                  placeholder="Enter the family ID to join"
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
                  💡 Ask the family creator for the family ID
                </p>
              </div>

              <button 
                type="submit" 
                className="btn btn-secondary btn-lg" 
                disabled={loading || joinFamilyName.trim().length === 0}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: 'var(--spacing-sm)' }}></div>
                    Joining...
                  </>
                ) : (
                  '🤝 Join Family'
                )}
              </button>
            </form>
          </div>
        )}



        {/* Error and Success Messages */}
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
    </div>
  );
};

export default FamilyManager; 