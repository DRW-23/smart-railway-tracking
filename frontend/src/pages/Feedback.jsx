import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feedback.css';
import { listComplaintReplies } from '../services/api';

const dashboardBg = process.env.PUBLIC_URL + '/assets/dashboardImage.jpg';

// Feedback component: submit/view passenger feedback & complaints with replies
export default function Feedback() {
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'complaints'
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [rating, setRating] = useState(0); // feedback only (not yet persisted server-side)
  const [feedbackTitle, setFeedbackTitle] = useState(''); // feedback title
  const [complaintTitle, setComplaintTitle] = useState(''); // complaint title
  const [textBody, setTextBody] = useState(''); // shared multiline body

  // Lists
  const [feedbackList, setFeedbackList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [repliesMap, setRepliesMap] = useState({}); // complaintId -> replies
  const [loadingReplies, setLoadingReplies] = useState({});

  // Loading & errors
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState(null);

  // Derive login status display (badge)
  const getLoginStatus = () => {
    const role = localStorage.getItem('role');
    const userName = localStorage.getItem('userName');
    const loginTime = localStorage.getItem('loginTime');
    
    if (!role || !loginTime) return { isLoggedIn: false, display: 'Guest' };
    
    const elapsed = Date.now() - parseInt(loginTime);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeDisplay = '';
    if (hours > 0) timeDisplay = `${hours}h ${minutes}m ago`;
    else if (minutes > 0) timeDisplay = `${minutes}m ago`;
    else timeDisplay = 'Just now';
    
    return {
      isLoggedIn: true,
      display: `${userName || 'User'} (${timeDisplay})`,
      role: role
    };
  };

  // Clear session & redirect
  const handleLogout = () => {
    ['role','userId','passengerId','email','loginTime','userName'].forEach(k=> localStorage.removeItem(k));
    navigate('/login');
  };

  // Fetch feedback from backend
  // Load feedback list from backend
  const fetchFeedback = async () => {
    setFeedbackLoading(true); setFeedbackError(null);
    try {
      const res = await fetch('http://localhost:8080/feedback');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const items = (data.items || []).map(it => {
        const fullMsg = it.message || '';
        let title = it.title || '';
        let body = fullMsg;
        if (!title && fullMsg.includes('\n')) {
          const parts = fullMsg.split('\n');
            title = parts[0];
            body = parts.slice(1).join('\n');
        }
        return {
          id: it.id,
          title: title || '(No Title)',
            text: body,
          rating: 0, // not stored yet
          date: it.createdAt ? new Date(it.createdAt).toLocaleDateString('en-GB') : ''
        };
      });
      setFeedbackList(items.sort((a,b)=> b.id - a.id));
    } catch (e) {
      setFeedbackError('Failed to load feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Fetch complaints (pending & in-progress, could add filters later)
  // Load complaints list from backend
  const fetchComplaints = async () => {
    setComplaintsLoading(true); setComplaintsError(null);
    try {
      const res = await fetch('http://localhost:8080/complaints');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const items = (data.items || []).map(it => {
        const desc = it.description || '';
        const title = (it.title && it.title.trim()) ? it.title.trim() : '(No Title)';
        let body = '';
        // If backend didn't separate, attempt to reconstruct body (not strictly needed now that title column exists)
        if (desc && !it.title) body = desc;
        const d = it.createdAt ? new Date(it.createdAt) : null;
        const datePart = d ? d.toLocaleDateString('en-GB') : '';
        const timePart = d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
        return {
          id: it.id,
          title,
          text: body,
          status: it.status || 'PENDING',
          dateTime: d ? `${datePart} - ${timePart}` : ''
        };
      });
      setComplaintsList(items.sort((a,b)=> b.id - a.id));
    } catch (e) {
      setComplaintsError('Failed to load complaints');
    } finally {
      setComplaintsLoading(false);
    }
  };

  // Load replies for a specific complaint (lazy)
  const loadReplies = useCallback(async (id) => {
    setLoadingReplies(l => ({ ...l, [id]: true }));
    try {
      const { data } = await listComplaintReplies(id);
      setRepliesMap(m => ({ ...m, [id]: data.items || [] }));
    } catch(e){ /* ignore */ } finally { setLoadingReplies(l => ({ ...l, [id]: false })); }
  }, []);

  // On mount load both
  // Initial lists load on mount
  useEffect(() => {
    fetchFeedback();
    fetchComplaints();
  }, []);

  // When switching to complaints tab, ensure replies are loaded (lazy per complaint)
  // When complaints tab active, ensure replies fetched
  useEffect(()=> {
    if (activeTab !== 'complaints') return;
    complaintsList.forEach(c => { if(!repliesMap[c.id] && !loadingReplies[c.id]) loadReplies(c.id); });
  }, [activeTab, complaintsList, repliesMap, loadingReplies, loadReplies]);

  // Open submission modal
  const openModal = () => {
    // Reset form values each time
    setRating(0);
    setFeedbackTitle('');
    setComplaintTitle('');
    setTextBody('');
    setShowModal(true);
  };

  // Close submission modal
  const closeModal = () => setShowModal(false);

  // Set rating value
  const handleStarClick = (val) => setRating(val);

  // Submission handler (feedback or complaint based on activeTab)
  // Save feedback or complaint based on active tab
  const handleSubmit = async () => {
    if (activeTab === 'feedback') {
      if (!feedbackTitle.trim()) {
        alert('Please enter a feedback title.');
        return;
      }
      if (!textBody.trim()) {
        alert('Please enter your feedback message.');
        return;
      }
      if (!rating) {
        alert('Please select a rating.');
        return;
      }
      try {
        const res = await fetch('http://localhost:8080/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: feedbackTitle.trim(), message: textBody.trim(), type: 'FEEDBACK' })
        });
        const data = await res.json();
        if (data.success && data.item) {
          const it = data.item;
          const createdDate = it.createdAt ? new Date(it.createdAt).toLocaleDateString('en-GB') : '';
          setFeedbackList(list => [
            { id: it.id, title: it.title || feedbackTitle.trim(), text: textBody.trim(), rating, date: createdDate },
            ...list
          ]);
          closeModal();
        } else {
          alert(data.error || 'Failed to save feedback');
        }
      } catch (e) {
        alert('Network error saving feedback');
      }
    } else {
      // Complaint
      if (!complaintTitle.trim()) {
        alert('Please enter a complaint title.');
        return;
      }
      if (!textBody.trim()) {
        alert('Please enter complaint details.');
        return;
      }
      try {
        const res = await fetch('http://localhost:8080/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: complaintTitle.trim(), description: textBody.trim(), passengerId: 1 })
        });
        const data = await res.json();
        if (data.success && data.item) {
          const it = data.item;
          const d = it.createdAt ? new Date(it.createdAt) : new Date();
          const datePart = d.toLocaleDateString('en-GB');
          const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          setComplaintsList(list => [
            { id: it.id, title: it.title || complaintTitle.trim(), text: '', status: it.status || 'PENDING', dateTime: `${datePart} - ${timePart}` },
            ...list
          ]);
          closeModal();
        } else {
          alert(data.error || 'Failed to save complaint');
        }
      } catch (e) {
        alert('Network error saving complaint');
      }
    }
  };

  // Navigation helper
  // Simple navigation helper
  const go = (path) => navigate(path);

  return (
    <div className="feedback-container">
      {/* Background */}
      <div className="feedback-bg">
        <img src={dashboardBg} alt="Railway background" className="feedback-bg-img" />
        <div className="feedback-overlay" />
      </div>

      {/* Top bar */}
      <div className="feedback-topbar">
        <button className="feedback-brand" onClick={() => go('/')}> 
          <div className="feedback-logo">
            <img src={process.env.PUBLIC_URL + '/assets/logo.png'} alt="Logo" />
          </div>
          <span className="feedback-brand-text">Smart Train Tracker</span>
        </button>
        <div className="feedback-top-right">
          {(() => {
            const status = getLoginStatus();
            return (
              <div className="feedback-user-status">
                <span className={`feedback-status-indicator ${status.isLoggedIn ? 'logged-in' : 'guest'}`}>
                  {status.isLoggedIn ? '🟢' : '🔴'} {status.display}
                </span>
                {status.isLoggedIn && (
                  <button className="feedback-logout" onClick={handleLogout}>Log out</button>
                )}
              </div>
            );
          })()}
          <button className="feedback-notification">🔔</button>
          <button className="feedback-profile-btn">
            <img src={process.env.PUBLIC_URL + '/assets/profile.jpg'} alt="Profile" className="feedback-profile-img" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs (global) */}
      <div className="feedback-tabs">
        <button className="feedback-tab" onClick={() => go('/elephant-map')}>Live Elephant Tracking</button>
        <button className="feedback-tab" onClick={() => go('/train-schedule')}>Train Schedule</button>
        <button className="feedback-tab" onClick={() => go('/seat-reservation')}>Seat Reservation</button>
        <button className="feedback-tab" onClick={() => go('/lost-found')}>Lost & Found</button>
        <button className="feedback-tab active">Feedback & Complaints</button>
      </div>

      {/* Hero */}
      <div className="feedback-hero">
        <div className="feedback-header">
          <div className="feedback-title-section">
            <h1>Feedback & Complaints</h1>
            <p>Share your experience and help us improve our services</p>
          </div>
          <button className="feedback-submit-btn" onClick={openModal}>
            + Submit {activeTab === 'feedback' ? 'Feedback' : 'Complaint'}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="feedback-content-tabs">
        <button
          className={`feedback-content-tab ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >Feedback</button>
        <button
          className={`feedback-content-tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >Complaints</button>
      </div>

      {/* Lists */}
      <div className="feedback-items">
        {activeTab === 'feedback' ? (
          <>
            {feedbackLoading && <div>Loading...</div>}
            {feedbackError && <div style={{ color: 'red' }}>{feedbackError}</div>}
            {!feedbackLoading && !feedbackError && feedbackList.length === 0 && (
              <div className="feedback-item" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                <p style={{ margin: 0 }}>No feedback submitted yet.</p>
              </div>
            )}
            {feedbackList.map(item => (
              <div className="feedback-item" key={item.id}>
                <h3>{item.title}</h3>
                {item.text && <p>{item.text}</p>}
                <div className="feedback-rating">
                  <span className="stars">{item.rating ? Array.from({ length: item.rating }).map(() => '★').join(' ') : ''}</span>
                  <span className="date">{item.date}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {complaintsLoading && <div>Loading...</div>}
            {complaintsError && <div style={{ color: 'red' }}>{complaintsError}</div>}
            {!complaintsLoading && !complaintsError && complaintsList.length === 0 && (
              <div className="feedback-item" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                <p style={{ margin: 0 }}>No complaints submitted yet.</p>
              </div>
            )}
            {complaintsList.map(item => {
              const replies = repliesMap[item.id] || [];
              const isLoading = loadingReplies[item.id] && !replies.length;
              return (
                <div className="feedback-item complaint-item" key={item.id}>
                  <h3>{item.title}</h3>
                  {item.text && <p>{item.text}</p>}
                  <div className="feedback-rating">
                    <span className={`complaint-status ${item.status.toLowerCase()}`}>⏳ {item.status}</span>
                    <span className="date">{item.dateTime}</span>
                  </div>
                  <div className={`complaint-replies ${replies.length? 'has-replies':''}`}>
                    <div className="replies-header">Replies</div>
                    {isLoading && <div className="replies-loading">Loading replies...</div>}
                    {!isLoading && !replies.length && <div className="no-replies">No replies yet.</div>}
                    {replies.map(r => (
                      <div key={r.id} className={`reply-bubble ${r.authorRole==='MASTER'?'master':'passenger'}`}>
                        <div className="meta">{r.authorRole} • {new Date(r.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        <div className="body">{r.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="feedback-modal-overlay" onClick={closeModal}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h2>Submit {activeTab === 'feedback' ? 'Feedback' : 'Complaint'}</h2>
              <button className="feedback-modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="feedback-modal-content">
              {activeTab === 'feedback' ? (
                <>
                  <div className="feedback-modal-section">
                    <h3>Title</h3>
                    <input
                      type="text"
                      placeholder="e.g. Excellent Service on RM-1205"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                      className="feedback-input"
                    />
                  </div>
                  <div className="feedback-modal-section">
                    <h3>Rate us</h3>
                    <div className="star-rating">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          className={`star ${star <= rating ? 'filled' : ''}`}
                          onClick={() => handleStarClick(star)}
                        >★</button>
                      ))}
                    </div>
                  </div>
                  <div className="feedback-modal-section">
                    <h3>Feedback</h3>
                    <textarea
                      placeholder="Your Message..."
                      value={textBody}
                      onChange={(e) => setTextBody(e.target.value)}
                      className="feedback-textarea"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="feedback-modal-section">
                    <h3>Complaint Title</h3>
                    <input
                      type="text"
                      placeholder="Short summary (e.g. Door malfunction)"
                      value={complaintTitle}
                      onChange={(e) => setComplaintTitle(e.target.value)}
                      className="feedback-input"
                    />
                  </div>
                  <div className="feedback-modal-section">
                    <h3>Complaint Details</h3>
                    <textarea
                      placeholder="Describe your complaint in detail..."
                      value={textBody}
                      onChange={(e) => setTextBody(e.target.value)}
                      className="feedback-textarea"
                    />
                  </div>
                </>
              )}
              <button className="feedback-submit-modal-btn" onClick={handleSubmit}>
                Submit {activeTab === 'feedback' ? 'Feedback' : 'Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}