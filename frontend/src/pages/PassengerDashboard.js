import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PassengerDashboard.css";

// Use dashboard image from public/assets - make sure the filename matches exactly
const dashboardBg = process.env.PUBLIC_URL + "/assets/dashboardImage.jpg";

// PassengerDashboard component: hub showing cards to app sections
function PassengerDashboard() {
  const navigate = useNavigate();
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const isLoggedIn = !!role;

  // Prevent page scroll while on dashboard
  // Prevent body scrolling while on dashboard
  useEffect(() => {
    document.body.classList.add("dashboard-no-scroll", "dashboard-page");
    return () => document.body.classList.remove("dashboard-no-scroll", "dashboard-page");
  }, []);

  // Open profile instead of logging out (design choice)
  const handleLogout = () => {
    // Navigate to user profile instead of logout
    navigate("/user-profile");
  };

  // Show support contact alert
  const handleContact = () => {
    alert("Contact support: support@railway.com or call +94 11 234 5678");
    // You can navigate to a contact page instead:
    // navigate("/contact");
  };

  // Route based on selected dashboard card
  const handleCardClick = (cardName) => {
    // Handle card navigation based on card name
    switch(cardName) {
      case "Live Elephant Map":
        navigate("/elephant-map");
        break;
      case "Train Schedule":
        navigate("/train-schedule");
        break;
      case "Seat Reservation":
        navigate("/seat-reservation");
        break;
      case "Lost & Found":
        navigate("/lost-found");
        break;
      case "Feedback & Complaints":
        navigate("/feedback");
        break;
      default:
        console.log(`Clicked on ${cardName}`);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Background Image */}
      <div className="dashboard-bg">
        <img src={dashboardBg} alt="Railway background" />
      </div>

      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="nav-left">
          <img src={process.env.PUBLIC_URL + "/assets/logo.png"} alt="Railway Digital Portal" className="nav-logo" />
          <span className="nav-brand">Railway Digital Portal</span>
        </div>
        <div className="nav-right" style={{display:'flex', gap:'12px', alignItems:'center'}}>
          <button className="contact-btn" onClick={handleContact}>Contact</button>
          {isLoggedIn ? (
            <button className="profile-btn" onClick={handleLogout} title="Profile / Account">
              <span className="profile-icon">👤</span>
            </button>
          ) : (
            <button
              className="login-cta-btn"
              onClick={() => navigate('/login')}
              style={{
                background:'#0f2d33',
                color:'#fff',
                padding:'10px 18px',
                borderRadius:'24px',
                fontWeight:600,
                border:'1px solid #0f2d33',
                cursor:'pointer',
                boxShadow:'0 2px 4px rgba(0,0,0,0.15)'
              }}
            >
              Sign in to book
            </button>
          )}
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <div className="cards-grid">
          <div className="dashboard-card" onClick={() => handleCardClick("Live Elephant Map")}>
            <div className="card-image">
              <img src={process.env.PUBLIC_URL + "/assets/live elephant map image.jpg"} alt="Live Elephant Map" />
            </div>
            <div className="card-content">
              <h3>Live Elephant Map</h3>
            </div>
          </div>

          <div className="dashboard-card" onClick={() => handleCardClick("Train Schedule")}>
            <div className="card-image">
              <img src={process.env.PUBLIC_URL + "/assets/train schedule image.jpg"} alt="Train Schedule" />
            </div>
            <div className="card-content">
              <h3>Train Schedule</h3>
            </div>
          </div>

          <div className="dashboard-card" onClick={() => handleCardClick("Seat Reservation")}>
            <div className="card-image">
              <img src={process.env.PUBLIC_URL + "/assets/seat resavation image.jpg"} alt="Seat Reservation" />
            </div>
            <div className="card-content">
              <h3>Seat Reservation</h3>
            </div>
          </div>

          <div className="dashboard-card" onClick={() => handleCardClick("Lost & Found")}>
            <div className="card-image">
              <img src={process.env.PUBLIC_URL + "/assets/lost and found image.jpg"} alt="Lost & Found" />
            </div>
            <div className="card-content">
              <h3>Lost & Found</h3>
            </div>
          </div>

          <div className="dashboard-card" onClick={() => handleCardClick("Feedback & Complaints")}>
            <div className="card-image">
              <img src={process.env.PUBLIC_URL + "/assets/feedback and complain image.jpg"} alt="Feedback & Complaints" />
            </div>
            <div className="card-content">
              <h3>Feedback & Complaints</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PassengerDashboard;
