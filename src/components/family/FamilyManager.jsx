import React, { useState } from 'react';
import CreateFamily from './CreateFamily';
import JoinRequests from './JoinRequests';

const FamilyManager = ({ onFamilyCreated, onInvitationAccepted, onInvitationDeclined }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join'

  return (
    <div className="card mt-4">
      <div className="text-center mb-4">
        <div className="text-warning" style={{ fontSize: '3rem' }}>👨‍👩‍👧‍👦</div>
        <h2 className="text-success mb-2">Family Management</h2>
        <p className="text-muted">Create or join a family to compete together!</p>
      </div>

      {/* Tabs */}
      <div className="nav nav-tabs nav-fill mb-4" role="tablist">
        <button
          className={`nav-link py-2 ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
          type="button"
          role="tab"
          style={{ fontSize: '0.9rem' }}
        >
          Create Family
        </button>
        <button
          className={`nav-link py-2 ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab('join')}
          type="button"
          role="tab"
          style={{ fontSize: '0.9rem' }}
        >
          Join Requests
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'create' && (
          <div className="tab-pane fade show active">
            <CreateFamily
              onClose={() => setActiveTab('join')}
              onSuccess={onFamilyCreated}
            />
          </div>
        )}
        
        {activeTab === 'join' && (
          <div className="tab-pane fade show active">
            <JoinRequests
              onInvitationAccepted={onInvitationAccepted}
              onInvitationDeclined={onInvitationDeclined}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyManager; 