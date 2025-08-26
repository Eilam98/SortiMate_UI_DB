import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

const WaitingScreen = ({ 
  onIdentificationReceived, 
  userData, 
  sessionBottles, 
  sessionPoints, 
  onFinishSession, 
  sessionStartTime, 
  lastBottleTime 
}) => {
  const [showAdminDemo, setShowAdminDemo] = useState(false);
  const [selectedBottleType, setSelectedBottleType] = useState('');
  const [timeSinceLastBottle, setTimeSinceLastBottle] = useState(0);

  // Timer effect to show time since last bottle
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastBottleTime) {
        const now = new Date();
        const timeDiff = Math.floor((now - lastBottleTime) / 1000);
        setTimeSinceLastBottle(timeDiff);
      } else if (sessionStartTime) {
        // If no bottles yet, show time since session started
        const now = new Date();
        const timeDiff = Math.floor((now - sessionStartTime) / 1000);
        setTimeSinceLastBottle(timeDiff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBottleTime, sessionStartTime]);

  const handleAdminDemo = () => {
    if (!selectedBottleType) {
      alert('Please select a bottle type first');
      return;
    }

    // Simulate waste event data structure based on the provided image
    const simulatedWasteEvent = {
      bin_id: "bin_001",
      confidence: 0.95,
      error_message: "",
      fill_levels_after: {
        metal: 0,
        glass: 0,
        other: 0,
        plastic: 0
      },
      is_error: false,
      latency_ms: 25,
      location: "Karnaf",
      raw_image_path: "",
      timestamp: new Date(),
      user_id: getAuth().currentUser?.uid,
      waste_type: selectedBottleType.toLowerCase()
    };

    onIdentificationReceived(simulatedWasteEvent);
  };

  // Calculate total bottles
  const totalBottles = Object.values(sessionBottles || {}).reduce((sum, count) => sum + count, 0);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <div className="card">
        <div className="text-center">
          {/* SortiMate Logo */}
          <div className="sortimate-logo mb-4">
            <div className="logo-container" style={{
              width: '120px',
              height: '120px',
              margin: '0 auto',
              backgroundColor: '#2c3e50',
              borderRadius: 'var(--border-radius-lg)',
              padding: 'var(--spacing-sm)',
              position: 'relative'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: '4px',
                height: '100%'
              }}>
                {/* Top Left - Orange with Plastic Bottle */}
                <div style={{
                  backgroundColor: '#FF9600',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '20px',
                    height: '30px',
                    backgroundColor: '#2c3e50',
                    borderRadius: '4px 4px 8px 8px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#2c3e50',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '-4px',
                      left: '6px'
                    }}></div>
                  </div>
                </div>

                {/* Top Right - Green with Metal Can */}
                <div style={{
                  backgroundColor: '#58CC02',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '16px',
                    height: '24px',
                    backgroundColor: '#2c3e50',
                    borderRadius: '8px',
                    position: 'relative'
                  }}></div>
                </div>

                {/* Bottom Left - Yellow with Plastic Bottle */}
                <div style={{
                  backgroundColor: '#FFC800',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '20px',
                    height: '30px',
                    backgroundColor: '#2c3e50',
                    borderRadius: '4px 4px 8px 8px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#2c3e50',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '-4px',
                      left: '6px'
                    }}></div>
                  </div>
                </div>

                {/* Bottom Right - Blue with Recycling Symbol */}
                <div style={{
                  backgroundColor: '#1CB0F6',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#2c3e50',
                      position: 'absolute',
                      top: '7px',
                      left: '7px',
                      borderRadius: '50%'
                    }}></div>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #2c3e50',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '0',
                      left: '0'
                    }}></div>
                    <div style={{
                      width: '0',
                      height: '0',
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: '8px solid #2c3e50',
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      transform: 'rotate(45deg)'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="loading-spinner mb-4"></div>

          {/* Waiting Message */}
          <h2 className="text-success mb-2">Waiting for Recycling System</h2>
          <p className="text-secondary mb-4">Please wait while the smart bin identifies your bottle...</p>

          {/* Session Tracking Display */}
          <div className="card mt-4 mb-4">
            <h4 className="text-primary mb-3">📊 Current Session</h4>
            
            {/* Timer Display */}
            <div className="mb-3">
              <p className="text-secondary mb-1">⏰ Time since last bottle:</p>
              <h3 className="text-warning" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {formatTime(timeSinceLastBottle)}
              </h3>
            </div>

            {/* Bottle Counts */}
            <div className="grid grid-2 mb-3">
              <div className="text-center">
                <p className="text-secondary mb-1">🥤 Plastic</p>
                <h4 className="text-primary">{sessionBottles?.plastic || 0}</h4>
              </div>
              <div className="text-center">
                                    <p className="text-secondary mb-1">🥫 Metal</p>
                    <h4 className="text-primary">{sessionBottles?.metal || 0}</h4>
              </div>
              <div className="text-center">
                <p className="text-secondary mb-1">🍾 Glass</p>
                <h4 className="text-primary">{sessionBottles?.glass || 0}</h4>
              </div>
              <div className="text-center">
                <p className="text-secondary mb-1">📦 Other</p>
                <h4 className="text-primary">{sessionBottles?.other || 0}</h4>
              </div>
            </div>

            {/* Total Points */}
            <div className="text-center">
              <p className="text-secondary mb-1">🏆 Total Points</p>
              <h3 className="text-success" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {sessionPoints || 0}
              </h3>
            </div>

            {/* Finish Session Button */}
            <button
              onClick={onFinishSession}
              className="btn btn-outline btn-lg mt-3"
              style={{ width: '100%' }}
            >
              🏁 Finish Current Process
            </button>
          </div>

          {/* Admin Manual Demo (Admin Only) */}
          {userData?.role === 'admin' && (
            <div className="card mt-4">
              <h4 className="text-warning mb-3">🎯 Admin Demo Mode</h4>
              <p className="text-secondary mb-3">Simulate bottle identification for testing</p>
              
              <div className="grid grid-1 mb-3">
                <select
                  value={selectedBottleType}
                  onChange={(e) => setSelectedBottleType(e.target.value)}
                  className="card"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    border: '2px solid var(--medium-gray)',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                >
                  <option value="">Select Bottle Type</option>
                  <option value="plastic">🥤 Plastic</option>
                  <option value="metal">🥫 Metal</option>
                  <option value="glass">🍾 Glass</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>

              <button
                onClick={handleAdminDemo}
                disabled={!selectedBottleType}
                className="btn btn-warning btn-lg"
              >
                🎯 Simulate Identification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingScreen; 