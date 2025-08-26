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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import '../../styles/Statistics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [connectionData, setConnectionData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);

  const db = getFirestore();

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
    </div>
  );
};

export default Statistics;
