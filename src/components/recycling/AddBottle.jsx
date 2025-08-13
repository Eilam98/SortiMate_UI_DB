import React, { useState, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { useNavigate } from 'react-router-dom';

const AddBottle = ({ onUpdate, userData, binId }) => {
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const navigate = useNavigate();

  // Auto-start if binId is provided (from external QR scan)
  useEffect(() => {
    if (binId) {
      console.log('🎯 AddBottle: Auto-navigating to recycling session for binId:', binId);
      navigate(`/recycling-session/${binId}`);
    }
  }, [binId, navigate]);

  useEffect(() => {
    if (scanning) {
      const videoElement = document.getElementById('qr-video');
      if (videoElement) {
        const newScanner = new QrScanner(
          videoElement,
          (result) => {
            handleScan(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
        newScanner.start();
        setScanner(newScanner);
      }
    }
    return () => {
      if (scanner) {
        scanner.stop();
      }
    };
    // eslint-disable-next-line
  }, [scanning]);

  const handleScan = (data) => {
    console.log('🎯 QR Code scanned:', data);
    
    // Stop scanning
    setScanning(false);
    if (scanner) {
      scanner.stop();
    }

    // Extract bin ID from QR code
    let binId = null;
    
    // Handle different QR code formats
    if (data.includes('sortimate0.web.app/bin/')) {
      // Format: https://sortimate0.web.app/bin/bin_001
      binId = data.split('/bin/')[1];
    } else if (data.includes('sortimate://bin/')) {
      // Format: sortimate://bin/bin_001
      binId = data.split('/bin/')[1];
    } else {
      // Assume the data is directly the bin ID
      binId = data;
    }

    if (binId) {
      console.log('🎯 Extracted binId:', binId);
      // Navigate to the new recycling session page
      navigate(`/recycling-session/${binId}`);
    } else {
      alert('Invalid QR code format. Please scan a valid SortiMate bin QR code.');
      setScanning(true); // Restart scanning
    }
  };

  const startScanning = () => {
    setScanning(true);
  };

  const stopScanning = () => {
    setScanning(false);
    if (scanner) {
      scanner.stop();
    }
  };

  // Legacy manual entry handler (for admin manual entry)
  const [bottleData, setBottleData] = useState({ type: '', volume: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBottleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!bottleData.type || !bottleData.volume) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // This is for admin manual entry - navigate to recycling session with manual flag
      navigate(`/recycling-session/manual?type=${bottleData.type}&volume=${bottleData.volume}`);
    } catch (error) {
      alert('Error processing manual entry: ' + error.message);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="text-center">
          <h2 className="text-primary mb-4">📱 Scan Bin QR Code</h2>
          <p className="text-secondary mb-4">
            Point your camera at a SortiMate bin QR code to start recycling
          </p>

          {!scanning ? (
            <button onClick={startScanning} className="btn btn-primary btn-lg mb-4">
              🎥 Start Scanning
            </button>
          ) : (
            <div>
              <div className="mb-4">
                <video
                  id="qr-video"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '300px',
                    border: '2px solid #4CAF50',
                    borderRadius: '10px'
                  }}
                ></video>
              </div>
              <button onClick={stopScanning} className="btn btn-outline btn-lg">
                ⏹️ Stop Scanning
              </button>
            </div>
          )}

          {/* Admin Manual Entry */}
          {userData?.role === 'admin' && (
            <div className="card mt-4">
              <h4 className="text-warning mb-3">🔧 Admin Manual Entry</h4>
              <form onSubmit={handleManualSubmit}>
                <div className="grid grid-2 mb-3">
                  <div>
                    <label className="form-label">Bottle Type</label>
                    <select
                      name="type"
                      value={bottleData.type}
                      onChange={handleChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="plastic">Plastic</option>
                      <option value="glass">Glass</option>
                      <option value="aluminum">Aluminum</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Volume (ml)</label>
                    <input
                      type="number"
                      name="volume"
                      value={bottleData.volume}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="500"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-warning">
                  ➕ Add Bottle Manually
                </button>
              </form>
            </div>
          )}

          {/* Instructions */}
          <div className="card mt-4">
            <h4 className="text-secondary">💡 How to Use</h4>
            <div className="text-sm text-secondary">
              <p>• Point your camera at a SortiMate bin QR code</p>
              <p>• The app will automatically detect and process the QR code</p>
              <p>• You'll be taken to the recycling session page</p>
              <p>• Follow the instructions to complete your recycling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBottle;