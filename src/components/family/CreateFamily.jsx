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
        family_name: familyName.trim(),
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
          family_name: familyName.trim(),
          members: [user.uid]
        });
      }

    } catch (error) {
      console.error('Error creating family:', error);
      setError('Failed to create family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-warning" style={{ fontSize: '2.5rem' }}>👨‍👩‍👧‍👦</div>
        <h3 className="text-success mb-2">Create Family</h3>
        <p className="text-muted">Start your family recycling challenge!</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="familyName" className="form-label">Family Name</label>
          <input
            type="text"
            className={`form-control ${error ? 'is-invalid' : ''}`}
            id="familyName"
            value={familyName}
            onChange={handleChange}
            placeholder="Enter family name"
            maxLength={20}
            disabled={loading}
          />
          {error && <div className="invalid-feedback">{error}</div>}
          <div className="form-text">Maximum 20 characters</div>
        </div>

        <div className="d-grid gap-2">
          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating Family...
              </>
            ) : (
              'Create Family'
            )}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFamily; 