import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PassengerDashboard.css'; // reuse styling for consistency

const dashboardBg = process.env.PUBLIC_URL + '/assets/dashboardImage.jpg';

// TrainMasterDashboard component: admin portal menu
export default function TrainMasterDashboard() {
  const navigate = useNavigate();

  // Add body styling on mount
  useEffect(() => {
    document.body.classList.add('dashboard-no-scroll', 'dashboard-page');
    return () => document.body.classList.remove('dashboard-no-scroll', 'dashboard-page');
  }, []);

  // Route to selected admin section
  const handleNav = (name) => {
    switch (name) {
      case 'Train Schedule':
        navigate('/train-master/schedule');
        break;
      case 'Feedback & Complaints':
        navigate('/train-master/feedback');
        break;
      case 'Live Elephant Map':
        navigate('/train-master/elephant-tracking');
        break;
      case 'Operations':
        // placeholder route
        navigate('/train-master/operations');
        break;
      case 'Settings':
        navigate('/train-master/settings');
        break;
      default:
        break;
    }
  };

  // Show internal support info
  const handleContact = () => alert('Support (internal): ops@railway.com');
  // Open profile
  const handleProfile = () => navigate('/train-master/profile');

  return (
    <div className="dashboard-container">
      <div className="dashboard-bg">
        <img src={dashboardBg} alt="Railway background" />
      </div>

      <nav className="dashboard-navbar">
        <div className="nav-left">
          <img src={process.env.PUBLIC_URL + '/assets/logo.png'} alt="Railway Digital Portal" className="nav-logo" />
          <span className="nav-brand">Railway Digital Portal</span>
        </div>
        <div className="nav-right">
          <button className="contact-btn" onClick={handleContact}>Contact</button>
          <button className="profile-btn" onClick={handleProfile}><span className="profile-icon">👤</span></button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="cards-grid">
          <div className="dashboard-card" onClick={() => handleNav('Train Schedule')}>
            <div className="card-image">
              <img src={process.env.PUBLIC_URL + '/assets/train schedule image.jpg'} alt="Train Schedule" />
            </div>
            <div className="card-content"><h3>Train Schedule</h3></div>
          </div>

          <div className="dashboard-card" onClick={() => handleNav('Live Elephant Map')}>
            <div className="card-image">
              <img src={process.env.PUBLIC_URL + '/assets/live elephant map image.jpg'} alt="Elephant Tracking" />
            </div>
            <div className="card-content"><h3>Live Elephant Map</h3></div>
          </div>

            <div className="dashboard-card" onClick={() => handleNav('Feedback & Complaints')}>
              <div className="card-image">
                <img src={process.env.PUBLIC_URL + '/assets/feedback and complain image.jpg'} alt="Feedback & Complaints" />
              </div>
              <div className="card-content"><h3>Feedback & Complaints</h3></div>
            </div>

          { /* Removed Operations & Settings cards as requested */ }
        </div>
      </div>
    </div>
  );
}