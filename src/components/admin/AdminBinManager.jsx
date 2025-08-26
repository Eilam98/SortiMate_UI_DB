import React, { useState, useEffect } from 'react';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import '../../styles/AdminBinManager.css';
import { QRCode } from 'react-qr-code';

const AdminBinManager  = () => {
  const [allBins, setAllBins] = useState([]);

  const generateBinId = (bins) => {
    // Find the highest serial number among existing bins
    let maxSerial = 0;
    bins.forEach(bin => {
      const match = bin.bin_id && bin.bin_id.match(/^bin_(\d{3})$/i);
      if (match) {
        const serial = parseInt(match[1], 10);
        if (serial > maxSerial) maxSerial = serial;
      }
    });
    const nextSerial = (maxSerial + 1).toString().padStart(3, '0');
    return `bin_${nextSerial}`;
  };

  const createNewBin = async () => {
    try {
      const db = getFirestore();
      // Fetch all bins to determine the next serial number
      const binsSnapshot = await getDocs(collection(db, 'bins'));
      const bins = binsSnapshot.docs.map(doc => doc.data());
      const binId = generateBinId(bins);
      const binRef = doc(db, 'bins', binId);
      const bin = {
        bin_id: binId,
        created_at: new Date(),
        location: '',
        capacity: { metal: 0, glass: 0, plastic: 0, other: 0 },
        alert: { metal: false, glass: false, plastic: false, other: false, bin_id: binId },
        status: 'available',
        admin_notes: '',
        rpi_connected: false,
        last_update: new Date(),
        current_user: null,
        active_user: false
      };

      await setDoc(binRef, bin);
      fetchAllBins(); // Refresh bin list
    } catch (error) {
      console.error('Error creating bin:', error);
      alert('Error creating bin. Please try again.');
    }
  };



  const fetchAllBins = async () => {
    try {
      const db = getFirestore();
      console.log('🔍 Fetching bins from Firestore...');
      const binsSnapshot = await getDocs(collection(db, 'bins'));
      console.log('📊 Total bins found:', binsSnapshot.size);
      console.log('📋 All bins in database:', binsSnapshot.docs.map(doc => ({
        docId: doc.id,
        data: doc.data()
      })));
      const binsData = binsSnapshot.docs.map(doc => doc.data());
      console.log('🎯 Setting bins state:', binsData);
      setAllBins(binsData);
    } catch (error) {
      console.error('❌ Error fetching bins:', error);
      alert('Error fetching bins: ' + error.message);
    }
  };

  useEffect(() => {
    fetchAllBins();
  }, []);

  return (
    <div className="recycling-bin-container">
      <h2>Recycling Bins (Admin)</h2>

      <div className="admin-buttons">
        <button onClick={createNewBin} className="create-bin-btn">Create New Bin</button>
      </div>

      <div className="all-bins-list">
        <h3>All Bins ({allBins.length} found)</h3>
        {console.log('🎨 Rendering bins:', allBins)}
        {allBins.length === 0 && <div>No bins found.</div>}
        {allBins.map((bin) => (
          <div key={bin.bin_id} className="bin-info-card">
            <h4>Bin ID: {bin.bin_id}</h4>
            <div>Location: {bin.location}</div>
            <div>Status: {bin.status}</div>
            <div>
              Capacity: Plastic: {bin.capacity?.plastic || 0}, Glass: {bin.capacity?.glass || 0},
              Metal: {bin.capacity?.metal || 0}, Other: {bin.capacity?.other || 0}
            </div>
            <div>Admin Notes: {bin.admin_notes}</div>
            <div>
              Created:{' '}
              {bin.created_at?.toDate
                ? bin.created_at.toDate().toLocaleString()
                : String(bin.created_at)}
            </div>

            {/* ✅ Show QR code for each bin */}
            <div className="qr-display">
              <p>Scan to identify this bin:</p>
              <QRCode value={`https://sortimate0.web.app/bin/${bin.bin_id}`} size={120} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBinManager;

