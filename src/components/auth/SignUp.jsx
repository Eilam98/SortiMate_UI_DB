// ✅ SignUp.jsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { getFirestore, doc, setDoc, getDoc, getDocs, query, collection, where, deleteDoc } from 'firebase/firestore';

const isValidIsraeliID = (id) => {
  id = String(id).trim();
  if (id.length !== 9 || !/^\d+$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let num = +id[i] * ((i % 2) + 1);
    if (num > 9) num -= 9;
    sum += num;
  }
  return sum % 10 === 0;
};

const SignUp = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const db = getFirestore();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => setShowPasswords(!showPasswords);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { firstName, lastName, idNumber, email, password, confirmPassword } = formData;

    if (!isValidIsraeliID(idNumber)) {
      setError('Invalid ID number');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const existingUser = await getDocs(query(collection(db, 'users'), where('user_id', '==', idNumber)));
      if (!existingUser.empty) {
        setError('A user with this ID already exists');
        setLoading(false);
        return;
      }

      const fakeEmail = `${idNumber}@sortimate.local`;
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
      const { uid } = userCredential.user;
      const userRef = doc(db, 'users', uid);

      await setDoc(userRef, {
        user_id: idNumber,
        auth_uid: uid,
        first_name: firstName,
        last_name: lastName,
        email,
        created_at: new Date(),
        recycle_stats: { aluminium: 0, glass: 0, other: 0, plastic: 0 },
        total_points: 0,
        items_recycled: 0,
        family: { group_id: '', is_current_winner: false, total_wins: 0 },
        role: 'user',
        last_activity: new Date()
      });

             // Check if there's a guest user to delete
       const currentUser = auth.currentUser;
       if (currentUser) {
         try {
           const db = getFirestore();
           const userDocRef = doc(db, 'users', currentUser.uid);
           const userDocSnap = await getDoc(userDocRef);
           
           if (userDocSnap.exists() && userDocSnap.data().role === 'guest') {
             console.log('🎯 Deleting guest user after successful signup');
             await deleteDoc(userDocRef);
             await currentUser.delete();
             console.log('🎯 Guest user deleted successfully after signup');
           }
         } catch (error) {
           console.error('Error deleting guest user after signup:', error);
         }
       }
       
       onSuccess('Account created successfully! You can now sign in.');

    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-sm">
      <div className="card">
        <div className="text-center mb-4">
          <div className="text-success" style={{ fontSize: '4rem' }}>🌱</div>
          <h1 className="text-success">Join SortiMate!</h1>
          <p className="text-secondary">Start your recycling journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-1">
          <div className="grid grid-2">
            <div>
              <label htmlFor="firstName" className="font-semibold">👤 First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
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
            <div>
              <label htmlFor="lastName" className="font-semibold">👤 Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
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
          </div>

          <div>
            <label htmlFor="idNumber" className="font-semibold">🆔 ID Number</label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="ID (9 digits)"
              required
              pattern="\d{9}"
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

          <div>
            <label htmlFor="email" className="font-semibold">📧 Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
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

          <div>
            <label htmlFor="password" className="font-semibold">🔒 Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
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
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: 'var(--spacing-md)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                {showPasswords ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="font-semibold">🔐 Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
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
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: 'var(--spacing-md)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                {showPasswords ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="message message-error">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="message message-success">
              <p>{success}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', marginRight: 'var(--spacing-sm)' }}></div>
                Creating Account...
              </>
            ) : (
              '🚀 Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button className="btn btn-outline" onClick={onBack}>
            ← Back to Welcome
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
