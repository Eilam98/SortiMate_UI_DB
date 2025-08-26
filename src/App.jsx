import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase/config';
import wrongClassificationAutoResolver from './services/wrongClassificationAutoResolver';

import IntroductionPage from './components/common/IntroductionPage';
import SignUp from './components/auth/SignUp';
import SignIn from './components/auth/SignIn';
import UserDashboard from './components/dashboard/UserDashboard';

import BinScanner from './components/recycling/BinScanner';
import BinPage from './components/recycling/BinPage';
import LoadingScreen from './components/dashboard/LoadingScreen';
import RecyclingSessionWrapper from './components/recycling/RecyclingSessionWrapper';

import './App.css';

function AppRouterWrapper() {
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const isLoggedIn = !!user;
      setIsAuthenticated(isLoggedIn);

      if (isLoggedIn && location.pathname === '/') {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={
        <IntroductionPage
          onSignUpClick={() => navigate('/signup')}
          onSignInClick={() => navigate('/signin')}
          onGuestClick={() => navigate('/dashboard')}
          successMessage={successMessage}
        />
      } />
      <Route path="/signup" element={
        <SignUp
          onBack={() => navigate('/')}
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            // Check if there's a redirect bin ID stored
            const redirectBinId = sessionStorage.getItem('redirectBinId');
            if (redirectBinId) {
              sessionStorage.removeItem('redirectBinId');
              navigate(`/dashboard?bin=${redirectBinId}`);
            } else {
              navigate('/');
            }
          }}
        />
      } />
      <Route path="/signin" element={
        <SignIn
          onBack={() => navigate('/')}
        />
      } />
      <Route path="/dashboard" element={<UserDashboard />} />

      <Route path="/scan" element={<BinScanner />} />
      <Route path="/bin/:binId" element={<BinPage />} />
      <Route path="/recycling-session/:binId" element={<RecyclingSessionWrapper />} />
    </Routes>
  );
}

function App() {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Initialize wrong classification auto-resolver
    wrongClassificationAutoResolver.initialize();

    // Show loading screen for 4-5 seconds for a more polished experience
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 4500); // 4.5 seconds

    // Cleanup function
    return () => {
      clearTimeout(timer);
      wrongClassificationAutoResolver.cleanup();
    };
  }, []);

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  return (
    <div className="App">
      {showLoading ? (
        <LoadingScreen onComplete={handleLoadingComplete} />
      ) : (
        <Router>
          <AppRouterWrapper />
        </Router>
      )}
    </div>
  );
}

export default App;
