import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Animate logo appearance
    setTimeout(() => setShowLogo(true), 300);
    
    // Animate text appearance
    setTimeout(() => setShowText(true), 800);
    
    // Animate progress bar
    setTimeout(() => setShowProgress(true), 1200);
    
    // Simulate loading progress with slower, more realistic increments
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Add a small delay before fade out
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => onComplete(), 800); // Longer fade out
          }, 300);
          return 100;
        }
        return prev + Math.random() * 8 + 3; // Slower, more realistic progress
      });
    }, 150); // Slower progress updates

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="loading-screen" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      // Beautiful gradient background options:
      // Option 1: Green to Blue gradient (nature-inspired)
      background: 'linear-gradient(135deg, #58CC02 0%, #1CB0F6 50%, #58CC02 100%)',
      // Option 2: Green to Purple gradient (Duolingo-inspired)
      // background: 'linear-gradient(135deg, #58CC02 0%, #CE82FF 50%, #58CC02 100%)',
      // Option 3: Green to Orange gradient (warm and energetic)
      // background: 'linear-gradient(135deg, #58CC02 0%, #FF9600 50%, #58CC02 100%)',
      // Option 4: Multi-color gradient (vibrant and modern)
      // background: 'linear-gradient(135deg, #58CC02 0%, #1CB0F6 25%, #FF9600 50%, #CE82FF 75%, #58CC02 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s ease-in-out',
      // Add subtle animation to the background
      animation: 'gradientShift 8s ease-in-out infinite'
    }}>
      {/* SortiMate Logo */}
      <div className={`logo-container ${showLogo ? 'fade-in' : ''}`} style={{
        width: '150px',
        height: '150px',
        marginBottom: 'var(--spacing-xl)',
        opacity: showLogo ? 1 : 0,
        transform: showLogo ? 'scale(1)' : 'scale(0.8)',
        transition: 'all 0.8s ease-out'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#2c3e50',
          borderRadius: 'var(--border-radius-xl)',
          padding: 'var(--spacing-md)',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
          // Add subtle glow effect
          filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '6px',
            height: '100%'
          }}>
            {/* Top Left - Orange with Plastic Bottle */}
            <div style={{
              backgroundColor: '#FF9600',
              borderRadius: 'var(--border-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              animation: showLogo ? 'bounce-in 1s ease-out 0.3s both' : 'none'
            }}>
              <div style={{
                width: '24px',
                height: '36px',
                backgroundColor: '#2c3e50',
                borderRadius: '6px 6px 10px 10px',
                position: 'relative'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#2c3e50',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '-5px',
                  left: '7px'
                }}></div>
              </div>
            </div>

            {/* Top Right - Green with Aluminum Can */}
            <div style={{
              backgroundColor: '#58CC02',
              borderRadius: 'var(--border-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: showLogo ? 'bounce-in 1s ease-out 0.5s both' : 'none'
            }}>
              <div style={{
                width: '20px',
                height: '28px',
                backgroundColor: '#2c3e50',
                borderRadius: '10px',
                position: 'relative'
              }}></div>
            </div>

            {/* Bottom Left - Yellow with Plastic Bottle */}
            <div style={{
              backgroundColor: '#FFC800',
              borderRadius: 'var(--border-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              animation: showLogo ? 'bounce-in 1s ease-out 0.7s both' : 'none'
            }}>
              <div style={{
                width: '24px',
                height: '36px',
                backgroundColor: '#2c3e50',
                borderRadius: '6px 6px 10px 10px',
                position: 'relative'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#2c3e50',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '-5px',
                  left: '7px'
                }}></div>
              </div>
            </div>

            {/* Bottom Right - Blue with Recycling Symbol */}
            <div style={{
              backgroundColor: '#1CB0F6',
              borderRadius: 'var(--border-radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: showLogo ? 'bounce-in 1s ease-out 0.9s both' : 'none'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                position: 'relative'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#2c3e50',
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  borderRadius: '50%'
                }}></div>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #2c3e50',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '0',
                  left: '0'
                }}></div>
                <div style={{
                  width: '0',
                  height: '0',
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderBottom: '10px solid #2c3e50',
                  position: 'absolute',
                  top: '7px',
                  left: '7px',
                  transform: 'rotate(45deg)'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Title */}
      <div className={`app-title ${showText ? 'fade-in' : ''}`} style={{
        opacity: showText ? 1 : 0,
        transform: showText ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out 0.4s'
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '2.5rem',
          fontWeight: 'var(--font-weight-bold)',
          margin: 0,
          textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          letterSpacing: '1px'
        }}>
          SortiMate
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.95)',
          fontSize: '1.1rem',
          margin: 'var(--spacing-sm) 0 0 0',
          fontWeight: 'var(--font-weight-medium)',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Smart Recycling Made Fun
        </p>
      </div>

      {/* Progress Bar */}
      <div className={`progress-container ${showProgress ? 'fade-in' : ''}`} style={{
        width: '250px',
        marginTop: 'var(--spacing-xl)',
        opacity: showProgress ? 1 : 0,
        transform: showProgress ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out 0.6s'
      }}>
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 'var(--border-radius-full)',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 100%)',
            borderRadius: 'var(--border-radius-full)',
            transition: 'width 0.4s ease-out',
            boxShadow: '0 0 15px rgba(255,255,255,0.6)',
            animation: 'progressGlow 2s ease-in-out infinite'
          }}></div>
        </div>
        <p style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '0.9rem',
          textAlign: 'center',
          margin: 'var(--spacing-sm) 0 0 0',
          fontWeight: 'var(--font-weight-medium)',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}>
          Loading... {Math.round(progress)}%
        </p>
      </div>

      {/* Loading Dots */}
      <div className="loading-dots" style={{
        marginTop: 'var(--spacing-lg)',
        display: 'flex',
        gap: 'var(--spacing-sm)'
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: '50%',
              animation: `pulse 1.6s ease-in-out infinite both`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: '0 0 10px rgba(255,255,255,0.5)'
            }}
          ></div>
        ))}
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes progressGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(255,255,255,0.6);
          }
          50% {
            box-shadow: 0 0 25px rgba(255,255,255,0.8);
          }
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen; 