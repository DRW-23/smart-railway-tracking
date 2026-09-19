import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LostFound.css";
import AddItem from "./AddItem";

// LostFound component: list/search lost items and add new ones
const LostFound = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lost");
  const [searchQuery, setSearchQuery] = useState("");
  const [lostItems, setLostItems] = useState([]);
  const RETENTION_DAYS = 15; // mirror backend retention policy
  const [showAddModal, setShowAddModal] = useState(false);

  // Derive login indicator text
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

  // Clear stored session keys and redirect
  const handleLogout = () => {
    ['role','userId','passengerId','email','loginTime','userName'].forEach(k=> localStorage.removeItem(k));
    navigate('/login');
  };

  // Fetch lost items from backend
  const loadItems = async () => {
    try {
      const response = await fetch("http://localhost:8080/lost-items");
      const data = await response.json();

      // Extract the items array from the response
      setLostItems(data.items || []); // Use data.items instead of data directly
    } catch (error) {
      console.error("Error loading items:", error);
      setLostItems([]); // Ensure it's always an array
    }
  };

  // Load initial lost item list
  useEffect(() => {
    loadItems();
  }, []);

  // Switch to Found Item page
  const handleFoundItemClick = () => navigate("/found-item");
  // Open add-item modal (guard guests)
  const handleAddItem = () => {
    if (!localStorage.getItem('role')) {
      const shouldLogin = window.confirm('You need to log in first to add items. Go to login page?');
      if (shouldLogin) navigate('/login');
      return;
    }
    setShowAddModal(true);
  };

  // Filter items ONLY by the card header (itemName) as requested
  // Filter list by name only
  const filteredLostItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return lostItems;
    return lostItems.filter(it => (it.itemName || '').toLowerCase().includes(q));
  }, [searchQuery, lostItems]);

  return (
    <div className="lf-container">
      <div className="lf-bg">
        <div className="lf-bg-img" style={{ backgroundImage: "url(/your-background-image.jpg)" }} />
        <div className="lf-overlay" />
      </div>

      {/* Top navigation (mirrors TrainSchedule tabs) */}
      <header className="lf-topbar">
        <button className="lf-brand" onClick={() => navigate('/')}> 
          <div className="lf-logo">
            <img src={`${process.env.PUBLIC_URL}/assets/logo.png`} alt="Railway Digital Portal" />
          </div>
          <span className="lf-brand-text">Railway Digital Portal</span>
        </button>
        <div className="lf-top-right">
          {(() => {
            const status = getLoginStatus();
            return (
              <div className="lf-user-status">
                <span className={`lf-status-indicator ${status.isLoggedIn ? 'logged-in' : 'guest'}`}>
                  {status.isLoggedIn ? '🟢' : '🔴'} {status.display}
                </span>
                {status.isLoggedIn && (
                  <button className="lf-logout" onClick={handleLogout}>Log out</button>
                )}
              </div>
            );
          })()}
          <button className="lf-profile-btn" onClick={() => navigate('/user-profile')}>
            <img src={`${process.env.PUBLIC_URL}/assets/default-avatar.png`} alt="User" className="lf-profile-img" />
          </button>
        </div>
      </header>

      <nav className="lf-tabs">
        <button className="lf-tab" onClick={() => navigate('/elephant-tracking')}>Live Elephant Tracking</button>
        <button className="lf-tab" onClick={() => navigate('/train-schedule')}>Train Schedule</button>
        <button className="lf-tab" onClick={() => navigate('/seat-reservation')}>Seat Reservation</button>
        <button className="lf-tab active">Lost &amp; Found</button>
        <button className="lf-tab" onClick={() => navigate('/feedback')}>Feedback &amp; Complaints</button>
      </nav>

      {/* Hero Section */}
      <div className="lf-hero">
        <div className="lf-hero-content">
          <h1>Lost & Found</h1>
          <p>Help reunite passengers with their belongings</p>
        </div>
        <button className="lf-add-btn" onClick={handleAddItem}>
          + Add Item
        </button>
      </div>

      {/* Item Type Tabs */}
      <div className="lf-item-tabs">
        <button
          className={`lf-item-tab ${activeTab === "lost" ? "active" : ""}`}
          onClick={() => setActiveTab("lost")}
        >
          Lost Item
        </button>
        <button
          className={`lf-item-tab ${activeTab === "found" ? "active" : ""}`}
          onClick={handleFoundItemClick}
        >
          Found Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="lf-search">
        <div className="lf-search-input">
          <span className="lf-search-icon">�</span>
          <input
            type="text"
            placeholder="Search item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="lf-items">
  {filteredLostItems.map((item, index) => {
          const dateStr = item.reportedAt || item.lostDate; // base date
          let remainingLabel = '—';
          let remainingClass = 'lf-remaining-neutral';
          if (dateStr) {
            const base = new Date(dateStr.startsWith('20') ? dateStr : dateStr.slice(0, 10));
            const now = new Date();
            const msElapsed = now.getTime() - base.getTime();
            const msRetention = RETENTION_DAYS * 24 * 60 * 60 * 1000;
            const msLeft = msRetention - msElapsed;
            if (msLeft <= 0) {
              remainingLabel = 'Expired (pending removal)';
              remainingClass = 'lf-remaining-expired';
            } else {
              const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
              const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
              if (days > 0) remainingLabel = `${days}d ${hours}h remaining`;
              else {
                const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
                remainingLabel = `${hours}h ${minutes}m remaining`;
              }
              if (days < 1) remainingClass = 'lf-remaining-danger';
              else if (days < 3) remainingClass = 'lf-remaining-warning';
            }
          }
          return (
            <div key={index} className="lf-item">
              <div className="lf-item-content">
                <h3>{item.itemName}</h3>
                <p className={`lf-remaining-time ${remainingClass}`}>{remainingLabel}</p>
                <p>{item.itemDescription}</p>
                <div className="lf-item-details">
                  <div className="lf-detail">
                    <span>{item.location}</span>
                  </div>
                  <div className="lf-detail">
                    <span>{item.lostDate || item.reportedAt?.slice(0, 10)}</span>
                  </div>
                  <div className="lf-detail">
                    <span>{item.phoneNumber}</span>
                  </div>
                </div>
              </div>
              <div className="lf-item-image">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8080${item.imageUrl}`}
                    alt={item.itemName}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItem
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadItems();
          }}
        />
      )}
    </div>
  );
};

export default LostFound;