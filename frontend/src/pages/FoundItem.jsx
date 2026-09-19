import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LostFound.css'; // Reuse the same CSS

// FoundItem component: manage/display found items and submit new report
const FoundItem = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [foundItems, setFoundItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const RETENTION_DAYS = 15; // mirror backend retention
  const [form, setForm] = useState({
    title: '',
    description: '',
    trainNumber: '',
    foundDate: '',
    phone: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // Load items from backend
  // Load found item list from backend
  const loadFound = async () => {
    try {
      const res = await fetch('http://localhost:8080/found-items');
      const data = await res.json();
      setFoundItems(data.items || []);
    } catch (e) {
      console.error('Failed to load found items', e);
      setFoundItems([]);
    }
  };

  // Initial load
  useEffect(() => { loadFound(); }, []);

  // Generic form field change
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Preview selected image file
  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    setImage(file || null);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  // Submit new found item form
  const submitFound = async (e) => {
    e.preventDefault();
    const fd = new FormData();
  fd.append('itemName', form.title);
  fd.append('description', form.description);
    if (form.trainNumber) fd.append('trainNumber', form.trainNumber);
    if (form.phone) fd.append('phone', form.phone);
  if (form.foundDate) fd.append('foundDate', form.foundDate);
    if (image) fd.append('image', image);
    try {
      const res = await fetch('http://localhost:8080/found-items', { method: 'POST', body: fd });
      const result = await res.json();
      if (res.ok && result.success) {
        setShowAddModal(false);
        setForm({ title: '', description: '', trainNumber: '', foundDate: '', phone: '' });
        setImage(null); setPreview(null);
        loadFound();
      } else {
        alert(result.error || 'Failed to add found item');
      }
    } catch (err) {
      console.error('Add found item error', err);
      alert('Failed to add found item');
    }
  };

  // Navigate to user profile
  const handleProfileClick = () => {
    navigate('/user-profile');
  };

  // Switch back to lost item list page
  const handleLostItemClick = () => {
    navigate('/lost-found'); // Navigate back to Lost Item page
  };

  return (
    <div className="lf-container">
      <div className="lf-bg">
        <div className="lf-bg-img" style={{backgroundImage: 'url(/your-background-image.jpg)'}}></div>
        <div className="lf-overlay"></div>
      </div>

      {/* Top Navigation */}
      <div className="lf-topbar">
        <button className="lf-brand" onClick={() => navigate('/')}>
          <div className="lf-logo">
            <img src="/assets/logo.png" alt="Logo" />
          </div>
          <span className="lf-brand-text">Railway Digital Portal</span>
        </button>
        
        <div className="lf-nav-actions">
          <button className="lf-profile-btn" onClick={handleProfileClick}>
            <span className="lf-profile-icon">👤</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="lf-tabs">
        <button className="lf-tab" onClick={() => navigate('/elephant-tracking')}>Live Elephant Tracking</button>
        <button className="lf-tab" onClick={() => navigate('/train-schedule')}>Train Schedule</button>
        <button className="lf-tab" onClick={() => navigate('/seat-reservation')}>Seat Reservation</button>
        <button className="lf-tab active">Lost & Found</button>
        <button className="lf-tab" onClick={() => navigate('/feedback')}>Feedback & Complaints</button>
      </div>

      {/* Hero Section */}
      <div className="lf-hero">
        <div className="lf-hero-content">
          <h1>Lost & Found</h1>
          <p>Help reunite passengers with their belongings</p>
        </div>
  <button className="lf-add-btn" onClick={() => setShowAddModal(true)}>+ Add Item</button>
      </div>

      {/* Item Type Tabs */}
      <div className="lf-item-tabs">
        <button 
          className="lf-item-tab"
          onClick={handleLostItemClick}
        >
          Lost Item
        </button>
        <button 
          className="lf-item-tab active"
        >
          Found Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="lf-search">
        <div className="lf-search-input">
          <span className="lf-search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search Train, Routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="lf-items">
        {foundItems.map(item => {
          const dateStr = item.foundAt || item.foundDate || item.found_date; // base date
          let remainingLabel = '—';
          let remainingClass = 'lf-remaining-neutral';
          if (dateStr) {
            const base = new Date(dateStr.startsWith('20') ? dateStr : dateStr.slice(0,10));
            const now = new Date();
            const msElapsed = now.getTime() - base.getTime();
            const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
            const msLeft = retentionMs - msElapsed;
            if (msLeft <= 0) { remainingLabel = 'Expired (pending removal)'; remainingClass='lf-remaining-expired'; }
            else {
              const days = Math.floor(msLeft / (1000*60*60*24));
              const hours = Math.floor((msLeft / (1000*60*60)) % 24);
              if (days > 0) remainingLabel = `${days}d ${hours}h remaining`;
              else {
                const minutes = Math.floor((msLeft / (1000*60)) % 60);
                remainingLabel = `${hours}h ${minutes}m remaining`;
              }
              if (days < 1) remainingClass = 'lf-remaining-danger';
              else if (days < 3) remainingClass = 'lf-remaining-warning';
            }
          }
          return (
            <div key={item.id || item.found_id} className="lf-item">
              <div className="lf-item-content">
                <h3>{item.title || item.itemName}</h3>
                <p className={`lf-remaining-time ${remainingClass}`}>{remainingLabel}</p>
                <p>{item.itemDescription || item.description}</p>
                <div className="lf-item-details">
                  <div className="lf-detail">
                    <span>{item.location || '-'}</span>
                  </div>
                  <div className="lf-detail">
                    <span>{item.foundDate || item.found_date || item.foundAt?.slice(0,10) || item.found_at?.slice(0,10)}</span>
                  </div>
                  <div className="lf-detail">
                    <span>{item.phoneNumber || item.phone || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="lf-item-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8080${item.imageUrl}`} alt={item.title || item.itemName} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="lf-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="lf-modal" onClick={e => e.stopPropagation()}>
            <div className="lf-modal-header">
              <h2>Add Found Item</h2>
              <button className="lf-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form className="lf-modal-content" onSubmit={submitFound}>
              <label>Title
                <input name="title" value={form.title} onChange={onChange} required />
              </label>
              <label>Description
                <textarea name="description" value={form.description} onChange={onChange} required />
              </label>
              <div className="lf-row">
                <label>Train Number
                  <input name="trainNumber" value={form.trainNumber} onChange={onChange} />
                </label>
                <label>Found Date
                  <input type="date" name="foundDate" value={form.foundDate} onChange={onChange} />
                </label>
              </div>
              <div className="lf-row">
                <label>Contact Phone
                  <input name="phone" value={form.phone} onChange={onChange} />
                </label>
              </div>
              <div className={`lf-upload-box ${preview ? 'has-preview' : ''}`}>
                {!preview ? (
                  <div className="lf-upload-prompt">
                    <span>Upload image</span>
                    <button type="button" className="lf-upload-btn">Browse</button>
                  </div>
                ) : (
                  <img className="lf-upload-img" src={preview} alt="Preview" />
                )}
                <input className="lf-file-input" type="file" accept="image/*" onChange={onImageChange} />
              </div>
              <div className="lf-modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoundItem;