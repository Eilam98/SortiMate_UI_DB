import React from 'react';
import { useNavigate } from 'react-router-dom';

const BinOccupied = ({ binId, onBack }) => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="card">
        <div className="text-center">
          <div className="mb-4">
            <div style={{
              width: '80px', height: '80px', margin: '0 auto', backgroundColor: '#FF6B6B',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px'
            }}>
              🔒
            </div>
          </div>
          <h2 className="text-warning mb-2">Bin {binId} is Occupied</h2>
          <p className="text-secondary mb-4">
            Another user is currently using this recycling bin.
            Please wait for them to finish or try a different bin.
          </p>
          <div className="grid grid-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <button onClick={onBack} className="btn btn-outline btn-lg">
              🔄 Try Again
            </button>
            <button onClick={() => navigate('/dashboard?tab=profile')} className="btn btn-primary btn-lg">
              🔙 Go Back
            </button>
          </div>
          <div className="card mt-4">
            <h4 className="text-secondary">💡 Tips</h4>
            <div className="text-sm text-secondary">
              <p>• Sessions typically last 3 minutes</p>
              <p>• You can try scanning again in a few minutes</p>
              <p>• Look for other available bins nearby</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinOccupied;
