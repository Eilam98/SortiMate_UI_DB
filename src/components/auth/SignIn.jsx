import React, { useState } from 'react';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { trackConnection } from '../../utils/connectionTracker';
import SortiMateLogo from '../common/SortiMateLogo';

const signInWithIDAndPassword = async (idNumber, password) => {
  // Get the fake email from the ID
  const db = getFirestore();
  const q = query(collection(db, 'users'), where('user_id', '==', idNumber));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error('No user found with this ID number');
  }
  // Create the fake email
  const fakeEmail = `${idNumber}@sortimate.local`;
  return signInWithEmailAndPassword(auth, fakeEmail, password);
};

const SignIn = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    idNumber: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

         try {
       await signInWithIDAndPassword(formData.idNumber, formData.password);
       
       // Track the user connection
       await trackConnection(false); // false = registered user
       
       // Check if there was a guest user that needs to be deleted
       const auth = getAuth();
       const currentUser = auth.currentUser;
       if (currentUser) {
         try {
           const db = getFirestore();
           const userDocRef = doc(db, 'users', currentUser.uid);
           const userDocSnap = await getDoc(userDocRef);
           
           if (userDocSnap.exists() && userDocSnap.data().role === 'guest') {
             console.log('🎯 Deleting guest user after successful signin');
             await deleteDoc(userDocRef);
             await currentUser.delete();
             console.log('🎯 Guest user deleted successfully after signin');
           }
         } catch (error) {
           console.error('Error deleting guest user after signin:', error);
         }
       }
       
       // Call onSuccess callback to handle navigation
       if (onSuccess) {
         onSuccess('Successfully signed in!');
       } else {
         // Fallback navigation if no callback provided
         const redirectBinId = sessionStorage.getItem('redirectBinId');
         if (redirectBinId) {
           sessionStorage.removeItem('redirectBinId');
           navigate(`/dashboard?bin=${redirectBinId}`);
         } else {
           navigate('/dashboard');
         }
       }
     } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-sm">
      <div className="card">
        <div className="text-center mb-4">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
            <SortiMateLogo size="large" />
          </div>
          <h1 className="text-success">Welcome Back!</h1>
          <p className="text-secondary">Continue your recycling journey</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-1">
          <div>
            <label htmlFor="idNumber" className="font-semibold">🆔 ID Number</label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="ID Number (any format for testing)"
              required
              // pattern="\d{9}" // REMOVED: ID pattern restriction for testing
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
                type={showPassword ? "text" : "password"}
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
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="message message-error">
              <p>{error}</p>
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
                Signing In...
              </>
            ) : (
              '🚀 Sign In'
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

export default SignIn;
