import React from 'react';
import './CustomLoader.css';

interface CustomLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

const CustomLoader: React.FC<CustomLoaderProps> = ({ 
  size = 'medium', 
  text = 'Loading...', 
  className = '' 
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'custom-loader-small';
      case 'large':
        return 'custom-loader-large';
      default:
        return 'custom-loader-medium';
    }
  };

  return (
    <div className={`custom-loader-wrapper ${getSizeClass()} ${className}`}>
      <div className="custom-loader">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <polyline
            id="back"
            points="0.5,0.5 63.5,0.5 63.5,63.5 0.5,63.5 0.5,0.5"
          />
          <polyline
            id="front"
            points="0.5,0.5 63.5,0.5 63.5,63.5 0.5,63.5 0.5,0.5"
          />
        </svg>
      </div>
      {text && <p className="custom-loader-text">{text}</p>}
    </div>
  );
};

export default CustomLoader;