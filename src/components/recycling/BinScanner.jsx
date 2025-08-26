import React, { useState, useEffect } from 'react';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const BinScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [currentBin, setCurrentBin] = useState(null);
  const [binData, setBinData] = useState(null);
  const [activeTab, setActiveTab] = useState('scan');
  const [scanner, setScanner] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scanning) {
      const videoElement = document.getElementById('qr-video');
      if (videoElement) {
        const newScanner = new QrScanner(
          videoElement,
          (result) => {
            console.log('QR Code detected:', result);
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
  }, [scanning]);

  const handleScan = async (scannedText) => {
    console.log('Processing scan:', scannedText);
    if (scannedText.startsWith('bin_')) {
      navigate(`/bin/${scannedText}`);
      setScanning(false);
      return;
    }
    try {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert('Please sign in to use the bin');
        return;
      }
      alert('Invalid bin ID');
    } catch (error) {
      console.error('Error scanning bin:', error);
      alert('Error scanning bin: ' + error.message);
    }
  };

  const leaveBin = async () => {
    if (!currentBin) return;

    try {
      const db = getFirestore();
      await updateDoc(currentBin.ref, {
        status: 'available',
        current_user: null,
        last_update: new Date()
      });

      setBinData(prev => ({
        ...prev,
        status: 'available',
        current_user: null
      }));
      setCurrentBin(null);
      setActiveTab('scan');
    } catch (error) {
      console.error('Error leaving bin:', error);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="card mb-4">
        <div className="text-center">
          <div className="text-success" style={{ fontSize: '3rem' }}>📱</div>
          <h1 className="text-success">Bin Scanner</h1>
          <p className="text-secondary">Scan QR codes to access recycling bins</p>
        </div>
      </div>

      {activeTab === 'scan' ? (
        <div className="card">
          <div className="text-center">
            <h3>🔍 Scan Bin QR Code</h3>
            <p className="text-secondary mb-4">Point your camera at a bin's QR code to start recycling</p>
            
            <button 
              onClick={() => setScanning(true)} 
              className="btn btn-primary btn-lg"
            >
              📷 Start Scanning
            </button>
            
            {scanning && (
              <div className="mt-4">
                <div className="card">
                  <h4 className="text-center">📱 Scanner Active</h4>
                  <p className="text-center text-secondary">Point camera at QR code</p>
                  <video 
                    id="qr-video" 
                    className="card"
                    style={{ 
                      width: '100%', 
                      maxWidth: '400px', 
                      height: '300px',
                      objectFit: 'cover',
                      borderRadius: 'var(--border-radius-md)'
                    }}
                  ></video>
                  <div className="text-center mt-3">
                    <button 
                      onClick={() => setScanning(false)} 
                      className="btn btn-outline"
                    >
                      ❌ Cancel Scan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="text-center">
            <div className="text-info" style={{ fontSize: '3rem' }}>⏳</div>
            <h3>Waiting for recycling event...</h3>
            <p className="text-secondary">Bin ID: {currentBin?.id}</p>
            <div className="badge badge-info">{binData?.status}</div>
            
            <div className="card mt-4">
              <h4>📊 Current Capacity</h4>
              <div className="grid grid-2">
                <div className="text-center">
                  <div className="text-info font-bold">🥤</div>
                  <p className="text-secondary">Plastic: {binData?.capacity?.plastic || 0}</p>
                </div>
                <div className="text-center">
                  <div className="text-warning font-bold">🍾</div>
                  <p className="text-secondary">Glass: {binData?.capacity?.glass || 0}</p>
                </div>
                <div className="text-center">
                  <div className="text-purple font-bold">🥫</div>
                  <p className="text-secondary">Metal: {binData?.capacity?.metal || 0}</p>
                </div>
                <div className="text-center">
                  <div className="text-success font-bold">📦</div>
                  <p className="text-secondary">Other: {binData?.capacity?.other || 0}</p>
                </div>
              </div>
            </div>
            
            <button onClick={leaveBin} className="btn btn-danger mt-4">
              🚪 Leave Bin
            </button>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="text-center mt-4">
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default BinScanner;
