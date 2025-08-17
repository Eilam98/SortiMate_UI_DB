import React, { useState } from 'react';
import CreateFamily from './CreateFamily';
import JoinRequests from './JoinRequests';

const FamilyManager = ({ onFamilyCreated, onInvitationAccepted, onInvitationDeclined }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join'

  return (
    <div className="container">
      <div className="card">
        <div className="text-center mb-4">
          <div className="text-warning" style={{ fontSize: '4rem' }}>👨‍👩‍👧‍👦</div>
          <h1 className="text-success">Family Management</h1>
          <p className="text-secondary">Create or join a family to compete together!</p>
        </div>

        {/* Tabs */}
        <div className="nav nav-tabs mb-4" role="tablist">
          <button
            className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
            type="button"
            role="tab"
          >
            Create Family
          </button>
          <button
            className={`nav-link ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
            type="button"
            role="tab"
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
    </div>
  );
};

export default FamilyManager; 