import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import '../../styles/Statistics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const Statistics = () => {
  const [connectionData, setConnectionData] = useState({
    labels: [],
    datasets: []
  });
  const [accuracyData, setAccuracyData] = useState({
    labels: [],
    datasets: []
  });
  const [peakHoursData, setPeakHoursData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState('all');

  const db = getFirestore();

  // Get date 30 days ago
  const getThirtyDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  };

  // Filter events by material type
  const filterByMaterial = (events, material) => {
    if (material === 'all') return events;
    return events.filter(event => {
      const wasteType = event.waste_type?.toLowerCase() || event.model_classification_waste_type?.toLowerCase();
      return wasteType === material.toLowerCase();
    });
  };

  // Calculate accuracy metrics
  const calculateAccuracyMetrics = async () => {
    try {
      const thirtyDaysAgo = getThirtyDaysAgo();
      
      // Get all waste events from past 30 days
      const wasteEventsQuery = query(
        collection(db, 'waste_events'),
        where('timestamp', '>=', thirtyDaysAgo)
      );
      const wasteEventsSnapshot = await getDocs(wasteEventsQuery);
      const wasteEvents = wasteEventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all wrong classifications from past 30 days
      const wrongClassificationsQuery = query(
        collection(db, 'wrong_classifications'),
        where('timestamp', '>=', thirtyDaysAgo)
      );
      const wrongClassificationsSnapshot = await getDocs(wrongClassificationsQuery);
      const wrongClassifications = wrongClassificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by selected material
      const filteredWasteEvents = filterByMaterial(wasteEvents, selectedMaterial);
      const filteredWrongClassifications = filterByMaterial(wrongClassifications, selectedMaterial);

      // Calculate metrics
      const totalEvents = filteredWasteEvents.length;
      const totalCorrections = filteredWrongClassifications.length;
      const accurateClassifications = totalEvents - totalCorrections;

      // Split corrections by confidence
      const highConfidenceCorrections = filteredWrongClassifications.filter(
        wc => (wc.confidence || 0) >= 0.85
      ).length;
      const lowConfidenceCorrections = totalCorrections - highConfidenceCorrections;

      // Calculate percentages
      const accuratePercentage = totalEvents > 0 ? (accurateClassifications / totalEvents) * 100 : 0;
      const highConfPercentage = totalEvents > 0 ? (highConfidenceCorrections / totalEvents) * 100 : 0;
      const lowConfPercentage = totalEvents > 0 ? (lowConfidenceCorrections / totalEvents) * 100 : 0;

      setAccuracyData({
        labels: [
          `Accurate (${accuratePercentage.toFixed(1)}%)`,
          `High Confidence Corrections (${highConfPercentage.toFixed(1)}%)`,
          `Low Confidence Corrections (${lowConfPercentage.toFixed(1)}%)`
        ],
        datasets: [{
          data: [accurateClassifications, highConfidenceCorrections, lowConfidenceCorrections],
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 99, 132, 0.8)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 2,
        }]
      });
      
    } catch (error) {
      console.error('Error calculating accuracy metrics:', error);
    }
  };

  // Calculate peak hours data
  const calculatePeakHours = async () => {
    try {
      const thirtyDaysAgo = getThirtyDaysAgo();
      
      // Get all waste events from past 30 days
      const wasteEventsQuery = query(
        collection(db, 'waste_events'),
        where('timestamp', '>=', thirtyDaysAgo)
      );
      const wasteEventsSnapshot = await getDocs(wasteEventsQuery);
      const wasteEvents = wasteEventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Initialize hourly data (0-23 hours)
      const hourlyData = Array(24).fill(0);
      
      // Count events by hour
      wasteEvents.forEach(event => {
        const timestamp = event.timestamp?.toDate?.() || new Date(event.timestamp);
        const hour = timestamp.getHours();
        hourlyData[hour]++;
      });

      // Find top 3 peak hours
      const peakHours = hourlyData
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Create labels for hours
      const labels = hourlyData.map((_, hour) => {
        const timeLabel = hour === 0 ? '12 AM' : 
                         hour === 12 ? '12 PM' : 
                         hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
        return timeLabel;
      });

      // Create background colors (highlight peaks)
      const backgroundColors = hourlyData.map((_, hour) => {
        const isPeak = peakHours.some(peak => peak.hour === hour);
        return isPeak ? 'rgba(255, 99, 132, 0.8)' : 'rgba(54, 162, 235, 0.6)';
      });

      // Create border colors
      const borderColors = hourlyData.map((_, hour) => {
        const isPeak = peakHours.some(peak => peak.hour === hour);
        return isPeak ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)';
      });

      setPeakHoursData({
        labels: labels,
        datasets: [{
          label: 'Items Recycled',
          data: hourlyData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 4,
        }]
      });

      // Generate collection suggestions
      const suggestions = generateCollectionSuggestions(peakHours);
      console.log('📊 Collection Suggestions:', suggestions);
      
    } catch (error) {
      console.error('Error calculating peak hours:', error);
    }
  };

  // Generate collection time suggestions
  const generateCollectionSuggestions = (peakHours) => {
    if (peakHours.length === 0) return [];
    
    const suggestions = [];
    
    // Morning collection (before peak)
    const morningPeaks = peakHours.filter(peak => peak.hour >= 8 && peak.hour <= 12);
    if (morningPeaks.length > 0) {
      const earliestPeak = Math.min(...morningPeaks.map(p => p.hour));
      suggestions.push(`Morning: Collect before ${earliestPeak === 12 ? '12 PM' : earliestPeak > 12 ? `${earliestPeak - 12} PM` : `${earliestPeak} AM`}`);
    }
    
    // Afternoon collection (after peak)
    const afternoonPeaks = peakHours.filter(peak => peak.hour >= 12 && peak.hour <= 17);
    if (afternoonPeaks.length > 0) {
      const latestPeak = Math.max(...afternoonPeaks.map(p => p.hour));
      suggestions.push(`Afternoon: Collect after ${latestPeak === 12 ? '12 PM' : latestPeak > 12 ? `${latestPeak - 12} PM` : `${latestPeak} AM`}`);
    }
    
    // Evening collection (after peak)
    const eveningPeaks = peakHours.filter(peak => peak.hour >= 17 && peak.hour <= 22);
    if (eveningPeaks.length > 0) {
      const latestPeak = Math.max(...eveningPeaks.map(p => p.hour));
      suggestions.push(`Evening: Collect after ${latestPeak > 12 ? `${latestPeak - 12} PM` : `${latestPeak} AM`}`);
    }
    
    return suggestions;
  };

  // Get the current week key (YYYY-WW format)
  const getCurrentWeekKey = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  // Get week label for display
  const getWeekLabel = (weekKey) => {
    const [year, week] = weekKey.split('-W');
    const startOfYear = new Date(parseInt(year), 0, 1);
    const weekStart = new Date(startOfYear.getTime() + (parseInt(week) - 1) * 7 * 24 * 60 * 60 * 1000);
    return `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
  };



  // Update connection count for current week
  const updateConnectionCount = async (isGuest = false) => {
    const statsRef = doc(db, 'statistics', 'user_connections');
    const currentWeek = getCurrentWeekKey();
    
    try {
      const statsDoc = await getDoc(statsRef);
      if (statsDoc.exists()) {
        const data = statsDoc.data();
        const weeks = data.weeks || {};
        
        // Initialize current week if it doesn't exist
        if (!weeks[currentWeek]) {
          weeks[currentWeek] = { guests: 0, users: 0 };
        }
        
        // Update the count
        if (isGuest) {
          weeks[currentWeek].guests += 1;
        } else {
          weeks[currentWeek].users += 1;
        }
        
        // Keep only the last 12 weeks
        const weekKeys = Object.keys(weeks).sort();
        if (weekKeys.length > 12) {
          const weeksToRemove = weekKeys.slice(0, weekKeys.length - 12);
          weeksToRemove.forEach(key => delete weeks[key]);
        }
        
        await updateDoc(statsRef, {
          weeks: weeks,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating connection count:', error);
    }
  };

  // Set up real-time listener for statistics
  useEffect(() => {
    const statsRef = doc(db, 'statistics', 'user_connections');
    
    const unsubscribe = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const weeks = data.weeks || {};
        
        // Sort weeks and get the last 12
        const weekKeys = Object.keys(weeks).sort().slice(-12);
        
        const labels = weekKeys.map(key => getWeekLabel(key));
        const guestData = weekKeys.map(key => weeks[key]?.guests || 0);
        const userData = weekKeys.map(key => weeks[key]?.users || 0);
        
        setConnectionData({
          labels: labels,
          datasets: [
            {
              label: 'Guest Users',
              data: guestData,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              borderWidth: 3,
              fill: false,
              tension: 0.4,
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Registered Users',
              data: userData,
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              borderWidth: 3,
              fill: false,
              tension: 0.4,
              pointBackgroundColor: 'rgba(54, 162, 235, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
          ],
        });
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to statistics:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time listeners for accuracy metrics and peak hours
  useEffect(() => {
    const thirtyDaysAgo = getThirtyDaysAgo();
    
    // Listen to waste events
    const wasteEventsQuery = query(
      collection(db, 'waste_events'),
      where('timestamp', '>=', thirtyDaysAgo)
    );
    
    // Listen to wrong classifications
    const wrongClassificationsQuery = query(
      collection(db, 'wrong_classifications'),
      where('timestamp', '>=', thirtyDaysAgo)
    );
    
    const unsubscribeWasteEvents = onSnapshot(wasteEventsQuery, () => {
      calculateAccuracyMetrics();
      calculatePeakHours();
    });
    
    const unsubscribeWrongClassifications = onSnapshot(wrongClassificationsQuery, () => {
      calculateAccuracyMetrics();
    });
    
    // Initial calculations
    calculateAccuracyMetrics();
    calculatePeakHours();
    
    return () => {
      unsubscribeWasteEvents();
      unsubscribeWrongClassifications();
    };
  }, [selectedMaterial]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Weekly User Connections (Last 12 Weeks)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Week',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Connections',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: `AI Classification Accuracy (Past 30 Days) - ${selectedMaterial.charAt(0).toUpperCase() + selectedMaterial.slice(1)}`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Hourly Recycling Activity (Past 30 Days)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return `Time: ${context[0].label}`;
          },
          label: function(context) {
            return `Items Recycled: ${context.parsed.y}`;
          }
        }
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Hour of Day',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Items',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
    },
  };



  if (loading) {
    return (
      <div className="statistics-container">
        <h2>📊 System Statistics</h2>
        <div className="chart-container">
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <h2>📊 System Statistics</h2>
      
      <div className="chart-container">
        <div className="chart-wrapper">
          <Line data={connectionData} options={options} />
        </div>
        
        <div className="stats-summary">
          <div className="stat-card">
            <h3>Guests This Week</h3>
            <p className="stat-number guest">
              {connectionData.datasets[0]?.data?.[connectionData.datasets[0]?.data?.length - 1] || 0}
            </p>
          </div>
          
          <div className="stat-card">
            <h3>Registered Users This Week</h3>
            <p className="stat-number registered">
              {connectionData.datasets[1]?.data?.[connectionData.datasets[1]?.data?.length - 1] || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Accuracy Metrics Section */}
      <div className="chart-container mt-4">
        <div className="chart-wrapper">
          <Pie data={accuracyData} options={pieOptions} />
        </div>
        
        <div className="accuracy-controls mt-3">
          <label htmlFor="material-select" className="form-label fw-bold">
            Material Filter:
          </label>
          <select
            id="material-select"
            className="form-select"
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
          >
            <option value="all">All Materials</option>
            <option value="plastic">Plastic</option>
            <option value="metal">Metal</option>
            <option value="glass">Glass</option>
          </select>
        </div>
      </div>

      {/* Peak Hours Analysis Section */}
      <div className="chart-container mt-4">
        <div className="chart-wrapper">
          <Bar data={peakHoursData} options={barOptions} />
        </div>
        
        <div className="peak-hours-info mt-3">
          <div className="peak-highlight">
            <h4>📊 Peak Hours Analysis</h4>
            <p className="text-muted">
              Red bars indicate the busiest recycling hours. Use this data to optimize collection schedules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
