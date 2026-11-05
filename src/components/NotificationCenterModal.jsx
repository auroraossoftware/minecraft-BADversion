import React, { useState } from 'react';
import { acceptFriendRequest, declineFriendRequest } from '../firebase.js';
import { toast } from '../ui.js';

export default function NotificationCenterModal({ currentUser, friendRequests = [], roomInvites = [], onClose, onJoinRoom }) {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState({});

  const handleAccept = async (req) => {
    setLoading(prev => ({ ...prev, [req.senderUid]: true }));
    const ok = await acceptFriendRequest(req.senderUid, req.senderEmail);
    if (ok) {
      toast(`💚 Accepted friend request from ${req.senderEmail}!`);
    } else {
      toast(`⚠️ Could not accept request.`);
    }
    setLoading(prev => ({ ...prev, [req.senderUid]: false }));
  };

  const handleDecline = async (req) => {
    await declineFriendRequest(req.senderUid);
    toast(`Declined request.`);
  };

  const totalCount = friendRequests.length + roomInvites.length;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0, 0, 60, 0.85)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#c0c0c0',
        borderTop: '4px solid #ffffff', borderLeft: '4px solid #ffffff',
        borderRight: '4px solid #000000', borderBottom: '4px solid #000000',
        borderRadius: 0,
        width: '560px', maxWidth: '95vw', padding: '16px 20px',
        boxShadow: '8px 8px 0px #000000', color: '#000080', textAlign: 'left',
        position: 'relative'
      }}>
        {/* Retro Titlebar */}
        <div className="retro-win-titlebar" style={{ margin: '0 0 10px 0' }}>
          <span>🔔 C:\BEEPER\PAGER_ALERTS_AND_INVITES_2004.EXE</span>
          <div className="retro-win-controls">
            <button className="retro-win-btn" onClick={onClose}>X</button>
          </div>
        </div>

        <h2 style={{ color: '#ff0000', margin: '0 0 4px 0', fontSize: '18px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '1px' }}>
          🔔 MOTOROLA PAGER &amp; BEEPER DISPATCH ({totalCount})
        </h2>
        <p style={{ color: '#000080', fontSize: '11px', margin: '0 0 14px 0', fontWeight: 'bold' }}>
          Check incoming telegrams from neighbor players and party invites.
        </p>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              background: activeTab === 'all' ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'all' ? '#000' : '#ccc'
            }}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              background: activeTab === 'friends' ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'friends' ? '#000' : '#ccc'
            }}
          >
            📩 Friend Requests ({friendRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            style={{
              padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              background: activeTab === 'invites' ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'invites' ? '#000' : '#ccc'
            }}
          >
            ✉️ Room Invites ({roomInvites.length})
          </button>
        </div>

        {/* List View */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#888', fontSize: '12px' }}>
              🎉 You have no pending notifications right now.
            </div>
          ) : (
            <>
              {/* Friend Requests */}
              {(activeTab === 'all' || activeTab === 'friends') && friendRequests.map(req => (
                <div
                  key={req.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(214,178,120,0.3)',
                    borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gold-bright)' }}>
                      📩 Incoming Friend Request
                    </div>
                    <div style={{ fontSize: '11px', color: '#fff', marginTop: '2px' }}>
                      <strong>{req.senderEmail}</strong> wants to be your friend!
                    </div>
                    <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
                      {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      disabled={loading[req.senderUid]}
                      onClick={() => handleAccept(req)}
                      style={{
                        background: '#4cd964', color: '#000', border: 'none', padding: '6px 12px',
                        borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      {loading[req.senderUid] ? '...' : 'Accept 💚'}
                    </button>
                    <button
                      onClick={() => handleDecline(req)}
                      style={{
                        background: 'rgba(255,255,255,0.1)', color: '#ccc', border: 'none', padding: '6px 10px',
                        borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      Decline ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Room Invites */}
              {(activeTab === 'all' || activeTab === 'invites') && roomInvites.map(inv => (
                <div
                  key={inv.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(76,217,100,0.3)',
                    borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4cd964' }}>
                      ✉️ Team Room Invitation
                    </div>
                    <div style={{ fontSize: '11px', color: '#fff', marginTop: '2px' }}>
                      <strong>{inv.senderEmail}</strong> invited you to <strong>{inv.roomName}</strong>
                    </div>
                    <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
                      {new Date(inv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onJoinRoom(inv.roomId, inv.roomName);
                      onClose();
                    }}
                    style={{
                      background: '#4cd964', color: '#000', border: 'none', padding: '6px 14px',
                      borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    Join Room 🚀
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
          }}
        >
          Close Notification Center
        </button>
      </div>
    </div>
  );
}
