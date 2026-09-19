import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feedback.css';
import { listComplaints, listComplaintReplies, addComplaintReply } from '../services/api';

// Train Master Feedback & Complaints page – visually matches passenger Feedback page.
// TrainMasterFeedback component: master view to inspect & reply to complaints
export default function TrainMasterFeedback() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'complaints'

  // Feedback state (read-only)
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  // Complaints state
  const [complaintsList, setComplaintsList] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState(null);

  // Replies state
  const [repliesMap, setRepliesMap] = useState({}); // complaintId -> replies[]
  const [replyDrafts, setReplyDrafts] = useState({}); // complaintId -> draft text
  const [loadingReplies, setLoadingReplies] = useState({}); // complaintId -> bool

  // Simple navigation helper
  const go = (p) => navigate(p);

  // Fetch feedback (same parsing as passenger view)
  // Load feedback entries (read-only)
  const fetchFeedback = async () => {
    setFeedbackLoading(true); setFeedbackError(null);
    try {
      const res = await fetch('http://localhost:8080/feedback');
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      const items = (data.items || []).map(it => {
        const fullMsg = it.message || '';
        let title = it.title || '';
        let body = fullMsg;
        if(!title && fullMsg.includes('\n')) {
          const parts = fullMsg.split('\n');
          title = parts[0]; body = parts.slice(1).join('\n');
        }
        return {
          id: it.id,
          title: title || '(No Title)',
          text: body,
          rating: 0,
          date: it.createdAt ? new Date(it.createdAt).toLocaleDateString('en-GB') : ''
        };
      });
      setFeedbackList(items.sort((a,b)=> b.id - a.id));
    } catch(e){ setFeedbackError('Failed to load feedback'); } finally { setFeedbackLoading(false); }
  };

  // Fetch complaints list
  // Load complaints list
  const fetchComplaints = async () => {
    setComplaintsLoading(true); setComplaintsError(null);
    try {
      const { data } = await listComplaints();
      const items = (data.items || []).map(it => {
        const d = it.createdAt ? new Date(it.createdAt) : null;
        const datePart = d ? d.toLocaleDateString('en-GB') : '';
        const timePart = d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
        return {
          id: it.id,
            title: (it.title && it.title.trim()) ? it.title.trim() : '(No Title)',
          description: it.description || '',
          status: it.status || 'PENDING',
          dateTime: d ? `${datePart} - ${timePart}` : ''
        };
      });
      setComplaintsList(items.sort((a,b)=> b.id - a.id));
    } catch(e){ setComplaintsError('Failed to load complaints'); } finally { setComplaintsLoading(false); }
  };

  // Load replies for a complaint once
  // Load replies for single complaint (once)
  const loadReplies = useCallback(async (id) => {
    setLoadingReplies(l => ({ ...l, [id]: true }));
    try {
      const { data } = await listComplaintReplies(id);
      setRepliesMap(m => ({ ...m, [id]: data.items || [] }));
    } catch(e) { /* ignore */ } finally { setLoadingReplies(l => ({ ...l, [id]: false })); }
  }, []);

  // Post a reply as MASTER
  const submitReply = async (id) => {
    const txt = (replyDrafts[id]||'').trim();
    if(!txt) return;
    try {
      const { data } = await addComplaintReply(id, { message: txt, role: 'MASTER' });
      setRepliesMap(m => ({ ...m, [id]: [...(m[id]||[]), data] }));
      setReplyDrafts(d => ({ ...d, [id]: '' }));
    } catch(e){ alert('Reply failed'); }
  };

  // Effects
  // Lazy load feedback tab
  useEffect(()=> { if(activeTab==='feedback' && feedbackList.length===0) fetchFeedback(); }, [activeTab, feedbackList.length]);
  // Lazy load complaints tab
  useEffect(()=> { if(activeTab==='complaints' && complaintsList.length===0) fetchComplaints(); }, [activeTab, complaintsList.length]);
  // Auto-load replies for all complaints when complaints list updates and tab is active
  // Auto-load replies for complaints when tab active
  useEffect(()=> {
    if(activeTab !== 'complaints') return;
    complaintsList.forEach(c => {
      if(!repliesMap[c.id] && !loadingReplies[c.id]) loadReplies(c.id);
    });
  }, [activeTab, complaintsList, repliesMap, loadingReplies, loadReplies]);

  return (
    <div className="feedback-container">
      {/* Background */}
      <div className="feedback-bg">
        <img src={process.env.PUBLIC_URL + '/assets/dashboardImage.jpg'} alt="Railway background" className="feedback-bg-img" />
        <div className="feedback-overlay" />
      </div>

      {/* Top bar */}
      <div className="feedback-topbar">
        <button className="feedback-brand" onClick={() => go('/train-master/schedule')}>
          <div className="feedback-logo"><img src={process.env.PUBLIC_URL + '/assets/logo.png'} alt="Logo" /></div>
          <span className="feedback-brand-text">Smart Train Tracker</span>
        </button>
        <div className="feedback-top-right">
          {/* Add any role-based buttons if needed */}
          <button className="feedback-profile-btn"><img src={process.env.PUBLIC_URL + '/assets/profile.jpg'} alt="Profile" className="feedback-profile-img" /></button>
        </div>
      </div>

      {/* Navigation Tabs (master) */}
      <div className="feedback-tabs">
        <button className="feedback-tab" onClick={() => go('/train-master/elephant-map')}>Live Elephant Tracking</button>
        <button className="feedback-tab" onClick={() => go('/train-master/schedule')}>Train Schedule</button>
        <button className="feedback-tab active">Feedback & Complaints</button>
      </div>

      {/* Hero */}
      <div className="feedback-hero">
          <div className="feedback-header tm-center-header">
            <div className="feedback-title-section">
              <h1>Feedback & Complaints</h1>
              <p>Share your experience and help us improve our services</p>
            </div>
          </div>
      </div>

      {/* Inner content tabs */}
      <div className="feedback-content-tabs">
        <button className={`feedback-content-tab ${activeTab==='feedback'?'active':''}`} onClick={()=>setActiveTab('feedback')}>Feedback</button>
        <button className={`feedback-content-tab ${activeTab==='complaints'?'active':''}`} onClick={()=>setActiveTab('complaints')}>Complaints</button>
      </div>

      {/* Lists */}
      <div className="feedback-items">
        {activeTab==='feedback' ? (
          <>
            {feedbackLoading && <div>Loading...</div>}
            {feedbackError && <div style={{color:'red'}}>{feedbackError}</div>}
            {!feedbackLoading && !feedbackError && feedbackList.length===0 && (
              <div className="feedback-item" style={{textAlign:'center', fontStyle:'italic'}}><p style={{margin:0}}>No feedback submitted yet.</p></div>
            )}
            {feedbackList.map(item => (
              <div className="feedback-item" key={item.id}>
                <h3>{item.title}</h3>
                {item.text && <p>{item.text}</p>}
                <div className="feedback-rating">
                  <span className="stars">{item.rating ? Array.from({length:item.rating}).map(()=> '★').join(' ') : ''}</span>
                  <span className="date">{item.date}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {complaintsLoading && <div>Loading...</div>}
            {complaintsError && <div style={{color:'red'}}>{complaintsError}</div>}
            {!complaintsLoading && !complaintsError && complaintsList.length===0 && (
              <div className="feedback-item" style={{textAlign:'center', fontStyle:'italic'}}><p style={{margin:0}}>No complaints submitted yet.</p></div>
            )}
            {complaintsList.map(c => {
              const replies = repliesMap[c.id]||[];
              const isLoading = loadingReplies[c.id] && !replies.length;
              return (
                <div className="feedback-item complaint-item" key={c.id}>
                  <h3 className="complaint-title-line">{c.title}</h3>
                  {c.description && <p style={{whiteSpace:'pre-wrap'}}>{c.description}</p>}
                  <div className="complaint-meta-row">
                    <div className="left"><span className={`complaint-status ${c.status.toLowerCase()}`}>⏳ {c.status}</span></div>
                    <div className="right date">{c.dateTime}</div>
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
                    <div className="reply-compose">
                      <textarea
                        placeholder="Write a reply..."
                        value={replyDrafts[c.id]||''}
                        onChange={e=>setReplyDrafts(d=>({...d,[c.id]:e.target.value}))}
                      />
                      <button disabled={!replyDrafts[c.id]||!replyDrafts[c.id].trim()} onClick={()=>submitReply(c.id)}>Send</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
