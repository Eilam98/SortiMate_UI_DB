import React, { useState } from 'react';
import { getFirestore, doc, collection, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const CreateFamily = ({ onClose, onSuccess }) => {
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 20) {
      setFamilyName(value);
      setError('');
    } else {
      setError('Family name cannot be longer than 20 characters');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (familyName.trim().length === 0) {
      setError('Family name cannot be empty');
      return;
    }

    if (familyName.length > 20) {
      setError('Family name cannot be longer than 20 characters');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be signed in to create a family');
        return;
      }

      const db = getFirestore();
      
      // Create a new family document
      const familyRef = doc(collection(db, 'families'));
      const familyData = {
        name: familyName.trim(),
        created_at: serverTimestamp(),
        created_by: user.uid,
        members: [user.uid]
      };
      
      await setDoc(familyRef, familyData);

      // Update the user's document to include family info
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        family_id: familyRef.id,
        last_activity: serverTimestamp()
      });

      // Call onSuccess with the family data
      if (onSuccess) {
        onSuccess({
          id: familyRef.id,
          ...familyData,
          members: [{ id: user.uid, name: user.displayName || 'You' }]
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating family:', error);
      setError('Failed to create family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-sm">
      <div className="card">
        <div className="text-center mb-4">
          <div className="text-warning" style={{ fontSize: '4rem' }}>👨‍👩‍👧‍👦</div>
          <h1 className="text-success">Create a Family</h1>
          <p className="text-secondary">Start a recycling challenge with your family!</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-1">
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
              onChange={handleChange}
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

          {error && (
            <div className="message message-error">
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-2">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
            >
              ❌ Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFamily; 