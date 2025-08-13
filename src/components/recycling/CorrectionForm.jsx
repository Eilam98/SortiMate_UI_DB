import React, { useState } from 'react';

const CorrectionForm = ({ originalIdentification, onSubmit, onCancel }) => {
  const [selectedCorrection, setSelectedCorrection] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCorrection) {
      alert('Please select the correct bottle type');
      return;
    }
    onSubmit(selectedCorrection);
  };

  const getBottleEmoji = (type) => {
    switch (type.toLowerCase()) {
      case 'plastic': return '🥤';
      case 'aluminum': return '🥫';
      case 'glass': return '🍾';
      case 'other': return '📦';
      default: return '♻️';
    }
  };

  const getBottleTypeDisplay = (type) => {
    switch (type.toLowerCase()) {
      case 'plastic': return 'Plastic';
      case 'aluminum': return 'Aluminum';
      case 'glass': return 'Glass';
      case 'other': return 'Other';
      default: return type;
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="text-center">
          {/* Help Icon */}
          <div className="text-warning mb-4" style={{ fontSize: '4rem' }}>
            🤝
          </div>

          {/* Title and Subtitle */}
          <h2 className="text-warning mb-2">Help Us Improve!</h2>
          <p className="text-secondary mb-4">
            Help us better identify next time!
          </p>

          {/* Original Identification */}
          <div className="card mb-4" style={{ 
            backgroundColor: 'var(--light-gray)',
            border: '2px solid var(--accent-red)'
          }}>
            <h4 className="text-secondary mb-2">❌ Incorrectly Identified As:</h4>
            <h3 className="text-danger font-bold">
              {getBottleEmoji(originalIdentification)} {getBottleTypeDisplay(originalIdentification)} Bottle
            </h3>
          </div>

          {/* Correction Form */}
          <form onSubmit={handleSubmit} className="grid grid-1">
            <div>
              <label htmlFor="correction" className="font-semibold">
                🎯 What was the correct bottle type?
              </label>
              <select
                id="correction"
                value={selectedCorrection}
                onChange={(e) => setSelectedCorrection(e.target.value)}
                required
                className="card"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  border: '2px solid var(--medium-gray)',
                  borderRadius: 'var(--border-radius-md)',
                  marginTop: 'var(--spacing-sm)'
                }}
              >
                <option value="">Select Correct Type</option>
                <option value="plastic">🥤 Plastic</option>
                <option value="aluminum">🥫 Aluminum</option>
                <option value="glass">🍾 Glass</option>
                <option value="other">📦 Other</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-2 mt-4">
              <button 
                type="button"
                onClick={onCancel}
                className="btn btn-outline"
              >
                ↩️ Go Back
              </button>
              <button 
                type="submit"
                disabled={!selectedCorrection}
                className="btn btn-warning btn-lg"
              >
                📝 Submit Correction
              </button>
            </div>
          </form>

          {/* Info Card */}
          <div className="card mt-4">
            <h4 className="text-secondary">💡 Why This Matters</h4>
            <p className="text-secondary text-sm">
              Your feedback helps us improve our recycling system's accuracy. 
              This information will be reviewed by our team to enhance future identifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionForm; 