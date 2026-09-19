import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "../services/api";
import "./UserProfile.css";

// UserProfile component: displays current user info and placeholder travel history
export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Placeholder travel history until booking integration is added
  const [travelHistory] = useState([]); // stays empty until real reservations fetched

  // Load user details on mount; redirect if not logged in
  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) {
      navigate('/login');
      return;
    }
    const load = async () => {
      try {
        const res = await fetchCurrentUser(email);
  setUser(res.data);
  // TODO: When seat reservation & payment feature is ready, fetch real trips here.
        setError(null);
      } catch (e) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  // Clear session storage and go back to login
  const handleLogout = () => {
    localStorage.removeItem('email');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
    localStorage.removeItem('loginTime');
    navigate('/login');
  };


  return (
    <div className="user-profile-container">
      {/* Background */}
      <div className="profile-bg">
        <img
          src="/assets/profile page background image.jpg"
          alt="Train background"
        />
        <div className="bg-overlay" />
      </div>

      {/* Header */}
      <header className="profile-header">
        {/* Left-aligned user card */}
        <div className="profile-info">
          <div className="profile-avatar">
            <img
              src={process.env.PUBLIC_URL + "/assets/default-profile.svg"}
              alt="User avatar"
            />
          </div>
          <div className="profile-details">
            {loading && <p>Loading...</p>}
            {error && <p style={{color: '#b91c1c'}}>{error}</p>}
            {!loading && !error && user && (
              <>
                <h2>{(user.name || user.email || '').replace(/\s+/g,'_')}</h2>
                <p>{user.email}</p>
                <p className="user-type">{(user.role || 'Passenger').charAt(0).toUpperCase() + (user.role||'').slice(1)}</p>
                <p className="member-since">Member since {user.memberSince ? new Date(user.memberSince).toLocaleDateString() : '-'}</p>
                <p>{user.phone || '—'}</p>
              </>
            )}
          </div>
        </div>

        {/* Branding + logout on right */}
        <aside className="profile-actions">
          <div className="logo-container">
            <img 
              src={process.env.PUBLIC_URL + "/assets/images/logo.png"} 
              alt="Railway Logo" 
              className="railway-logo" 
            />
            <h3>Railway Digital Portal</h3>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </aside>
      </header>

      {/* Travel history */}
      <section className="travel-history-section">
        <div className="history-header">
          <h3>Travel History</h3>
        </div>

        {travelHistory.length === 0 ? (
          <p style={{textAlign:'center', marginTop:'1rem', color:'#555'}}>No travel history yet. Make a seat reservation to see it here.</p>
        ) : (
          <div className="history-list">
            {travelHistory.map((trip, idx) => (
              <div key={idx} className="history-item">
                <div className="trip-main-info">
                  <h4>{trip.id}</h4>
                  <p className="route">{trip.route}</p>
                </div>
                <div className="trip-details">
                  <div className="detail-item">
                    <div className="detail-content">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">{trip.date}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <span className="detail-label">Seats</span>
                      <span className="detail-value">{trip.seats}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <span className="detail-label">Passengers</span>
                      <span className="detail-value">{trip.passengers}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-content">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value">{trip.amount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}