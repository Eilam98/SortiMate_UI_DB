import React from 'react';

const SortiMateLogo = ({ size = 'medium', className = '' }) => {
  // Size configurations
  const sizeConfigs = {
    small: {
      width: 60,
      height: 60
    },
    medium: {
      width: 100,
      height: 100
    },
    large: {
      width: 150,
      height: 150
    },
    xlarge: {
      width: 200,
      height: 200
    }
  };

  const config = sizeConfigs[size] || sizeConfigs.medium;

  return (
    <div 
      className={`sortimate-logo ${className}`}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        position: 'relative'
      }}
    >
      <img 
        src="/logo192.png" 
        alt="SortiMate Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
        }}
      />
    </div>
  );
};

export default SortiMateLogo;
