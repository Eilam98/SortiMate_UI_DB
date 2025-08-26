import React, { useState } from 'react';
import './WrongClassificationModal.css';

const WrongClassificationModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  wrongClassificationData 
}) => {
  const [selectedType, setSelectedType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wasteTypes = [
    { value: 'plastic', label: 'Plastic' },
            { value: 'metal', label: 'Metal' },
    { value: 'glass', label: 'Glass' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async () => {
    if (!selectedType) {
      alert('Please select what you actually inserted.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedType);
      setSelectedType('');
    } catch (error) {
      console.error('Error submitting classification:', error);
      alert('Error submitting your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wrong-classification-modal-overlay">
      <div className="wrong-classification-modal">
        <div className="modal-header">
          <h3>⚠️ Wrong Classification Detected</h3>
        </div>
        
        <div className="modal-content">
          <p>
            Our system detected an incorrect classification. 
          </p>
          
          <p>Please tell us what you actually inserted:</p>
          
          <div className="waste-type-options">
            {wasteTypes.map((type) => (
              <label key={type.value} className="waste-type-option">
                <input
                  type="radio"
                  name="wasteType"
                  value={type.value}
                  checked={selectedType === type.value}
                  onChange={(e) => setSelectedType(e.target.value)}
                />
                <span className="radio-label">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={!selectedType || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WrongClassificationModal;
