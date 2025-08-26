import React from 'react';

const SessionSummary = ({ sessionBottles, sessionPoints, sessionStartTime, onAwardPoints, onReset, userData }) => {
  const totalBottles = Object.values(sessionBottles).reduce((a, b) => a + b, 0);
  const sessionDuration = sessionStartTime ? Math.round((new Date() - sessionStartTime) / 1000) : 0;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <div className="card">
        <div className="text-center">
          <div className="mb-4">
            <div style={{
              width: '80px', height: '80px', margin: '0 auto', backgroundColor: '#4CAF50',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px'
            }}>
              🎉
            </div>
          </div>
          <h2 className="text-success mb-2">Session Complete!</h2>
          <p className="text-secondary mb-4">
            Great job! Here's your recycling session summary.
          </p>

          {/* Session Stats */}
          <div className="card mb-4">
            <h4 className="text-primary mb-3">📊 Session Statistics</h4>
            <div className="grid grid-2 text-center">
              <div>
                <div className="text-success" style={{ fontSize: '2rem' }}>🥤</div>
                <h3>{totalBottles}</h3>
                <p className="text-secondary">Total Bottles</p>
              </div>
              <div>
                <div className="text-warning" style={{ fontSize: '2rem' }}>⭐</div>
                <h3>{sessionPoints}</h3>
                <p className="text-secondary">Points Earned</p>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-secondary">
                <strong>Duration:</strong> {formatDuration(sessionDuration)}
              </p>
            </div>
          </div>

          {/* Bottle Breakdown */}
          <div className="card mb-4">
            <h4 className="text-primary mb-3">🥤 Bottle Breakdown</h4>
            <div className="grid grid-2">
              <div className="text-center">
                <div className="text-info" style={{ fontSize: '1.5rem' }}>🥤</div>
                <h4>{sessionBottles.plastic}</h4>
                <p className="text-secondary">Plastic</p>
              </div>
              <div className="text-center">
                <div className="text-info" style={{ fontSize: '1.5rem' }}>🍾</div>
                <h4>{sessionBottles.glass}</h4>
                <p className="text-secondary">Glass</p>
              </div>
              <div className="text-center">
                <div className="text-info" style={{ fontSize: '1.5rem' }}>🥫</div>
                <h4>{sessionBottles.metal}</h4>
                <p className="text-secondary">Metal</p>
              </div>
              <div className="text-center">
                <div className="text-info" style={{ fontSize: '1.5rem' }}>📦</div>
                <h4>{sessionBottles.other}</h4>
                <p className="text-secondary">Other</p>
              </div>
            </div>
          </div>

          {/* Guest User Warning */}
          {userData?.role === 'guest' && (
            <div className="card mb-4" style={{ backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }}>
              <div className="text-center">
                <div className="text-warning" style={{ fontSize: '2rem' }}>⚠️</div>
                <h4 className="text-warning">Guest Session</h4>
                <p className="text-secondary">
                  Your points will be lost when your guest session expires (15 minutes).
                  Sign up to keep your progress!
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <button onClick={onAwardPoints} className="btn btn-success btn-lg">
              🎯 Award Points & Return
            </button>
            <button onClick={onReset} className="btn btn-primary btn-lg">
              🔄 Continue Session
            </button>
          </div>

          {/* Session Info */}
          <div className="card mt-4">
            <h4 className="text-secondary">ℹ️ Session Info</h4>
            <div className="text-sm text-secondary">
              <p>• Session ID: {sessionStartTime ? sessionStartTime.getTime() : 'N/A'}</p>
              <p>• Points per bottle: 1 point</p>
              <p>• Session timeout: 3 minutes of inactivity</p>
              <p>• "Continue Session" keeps accumulating points</p>
              {userData?.role === 'guest' && (
                <p>• Guest session timeout: 15 minutes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;
