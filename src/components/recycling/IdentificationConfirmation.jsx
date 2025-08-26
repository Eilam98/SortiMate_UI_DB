import React from 'react';

const IdentificationConfirmation = ({ wasteEvent, onCorrect, onIncorrect }) => {
  const getBottleEmoji = (type) => {
    switch (type.toLowerCase()) {
      case 'plastic': return '🥤';
      case 'metal': return '🥫';
      case 'glass': return '🍾';
      case 'other': return '📦';
      default: return '♻️';
    }
  };

  const getBottleTypeDisplay = (type) => {
    switch (type.toLowerCase()) {
      case 'plastic': return 'Plastic';
      case 'metal': return 'Metal';
      case 'glass': return 'Glass';
      case 'other': return 'Other';
      default: return type;
    }
  };

  const bottleType = wasteEvent?.waste_type || 'unknown';
  const confidence = wasteEvent?.confidence || 0;

  return (
    <div className="container">
      <div className="card">
        <div className="text-center">
          {/* Success Icon */}
          <div className="text-success mb-4" style={{ fontSize: '4rem' }}>
            {getBottleEmoji(bottleType)}
          </div>

          {/* Identification Result */}
          <h2 className="text-success mb-2">Bottle Identified!</h2>
          <p className="text-secondary mb-4">
            The smart bin identified your bottle as:
          </p>

          {/* Bottle Type Display */}
          <div className="card mb-4" style={{ 
            backgroundColor: 'var(--light-gray)',
            border: '2px solid var(--primary-green)'
          }}>
            <h3 className="text-success font-bold">
              {getBottleEmoji(bottleType)} {getBottleTypeDisplay(bottleType)} Bottle
            </h3>
            <p className="text-secondary">
              Confidence: {Math.round(confidence * 100)}%
            </p>
          </div>

          {/* Question */}
          <h3 className="mb-4">Is this identification correct?</h3>

          {/* Action Buttons */}
          <div className="grid grid-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <button 
              onClick={onCorrect}
              className="btn btn-success btn-lg"
            >
              ✅ Yes, that's correct!
            </button>
            <button 
              onClick={onIncorrect}
              className="btn btn-danger btn-lg"
            >
              ❌ No, that's wrong!
            </button>
          </div>

          {/* Additional Info */}
          <div className="card mt-4">
            <h4 className="text-secondary">📊 Identification Details</h4>
            <div className="grid grid-2 text-sm">
              <div>
                <p className="text-secondary">Bin ID: {wasteEvent?.bin_id}</p>
                <p className="text-secondary">Location: {wasteEvent?.location}</p>
              </div>
              <div>
                <p className="text-secondary">Latency: {wasteEvent?.latency_ms}ms</p>
                <p className="text-secondary">Time: {wasteEvent?.timestamp?.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentificationConfirmation; 