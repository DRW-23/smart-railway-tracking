import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import "./TrainSchedule.css";
import { listTrainSchedules } from "../services/api";

// Passenger view pulls schedules from backend; shows limited columns.

// TrainSchedule component: passenger-facing schedule table (read-only)
export default function TrainSchedule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate(); // Add this hook

  // Go to landing
  const handleLogoClick = () => {
    navigate('/'); // Navigate to landing page (adjust path as needed)
  };

  // Navigate to profile page
  const handleProfileClick = () => {
    navigate('/user-profile'); // Try this alternative path
    // or navigate('/profile'); // Keep the original
  };

  // Produce user status text and styling
  const getLoginStatus = () => {
    const loginTime = localStorage.getItem('loginTime');
    const userName = localStorage.getItem('userName');
    
    if (!loginTime || !userName) {
      return { isLoggedIn: false, displayText: 'Guest', statusClass: 'guest' };
    }
    
    const now = new Date();
    const loginDate = new Date(parseInt(loginTime));
    const timeDiff = now - loginDate;
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeAgo;
    if (hours > 0) {
      timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = 'Just now';
    }
    
    return {
      isLoggedIn: true,
      displayText: `🟢 ${userName} (${timeAgo})`,
      statusClass: 'logged-in'
    };
  };

  // Clear session and redirect
  const handleLogout = () => {
    localStorage.removeItem('loginTime');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // Fetch schedules from backend
  // Load schedules + poll every 60s
  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await listTrainSchedules();
        if (!alive) return;
        const mapped = data.map(d => ({
          id: d.id,
          name: d.name,
          route: d.route,
          departTime: (d.departTime || '').substring(0,5),
          departCity: d.departCity,
          arriveTime: (d.arriveTime || '').substring(0,5),
          arriveCity: d.arriveCity,
          scheduleDate: d.scheduleDate,
          status: d.statusText,
          statusKind: d.statusKind
        }));
        setRows(mapped);
        if (mapped.length) setSelected(mapped[0].id);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('Failed to load schedules');
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchData();
    // Optional polling every 30s to pick up Train Master changes automatically
  // Poll every 60 seconds (previously 30s) for schedule updates
  const interval = setInterval(fetchData, 60000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  return (
    <div className="ts-container">
      {/* Background from public/assets */}
      <div className="ts-bg">
        <div
          className="ts-bg-img"
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/assets/dashboardImage.jpg)`, // change to .png/.jpeg if needed
          }}
        />
        <div className="ts-overlay" />
      </div>

      {/* Top bar */}
      <header className="ts-topbar">
        <button className="ts-brand" onClick={handleLogoClick}>
          <div className="ts-logo">
            <img
              src={`${process.env.PUBLIC_URL}/assets/logo.png`}
              alt="Railway Digital Portal logo"
            />
          </div>
          <span className="ts-brand-text">Railway Digital Portal</span>
        </button>
        <div className="ts-top-right">
          <div className="ts-user-status">
            <div className={`ts-status-indicator ${getLoginStatus().statusClass}`}>
              {getLoginStatus().displayText}
            </div>
            {getLoginStatus().isLoggedIn && (
              <button onClick={handleLogout} className="ts-logout">
                Log out
              </button>
            )}
          </div>
          <button className="ts-profile-btn" onClick={handleProfileClick}>
            <img
              src={`${process.env.PUBLIC_URL}/assets/default-avatar.png`}
              alt="User Profile"
              className="ts-profile-img"
            />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="ts-tabs">
        <button className="ts-tab" onClick={() => navigate('/elephant-tracking')}>Live Elephant Tracking</button>
        <button className="ts-tab active">Train Schedule</button>
        <button className="ts-tab" onClick={() => navigate('/seat-reservation')}>Seat Reservation</button>
        <button className="ts-tab" onClick={() => navigate('/lost-found')}>Lost &amp; Found</button>
        <button className="ts-tab" onClick={() => navigate('/feedback')}>Feedback &amp; Complaints</button>
      </nav>

      {/* Title */}
      <section className="ts-hero">
        <h1>Train Schedule</h1>
        <p>View departure and arrival times for all trains</p>
      </section>

      {/* Table */}
      <section className="ts-table passenger">
        <div className="ts-head passenger">
          <div>TRAIN DETAIL</div>
          <div>ROUTE</div>
          <div>DATE</div>
          <div>DEPARTURE</div>
          <div>ARRIVAL</div>
          <div>STATUS</div>
          {/* removed AVAILABILITY */}
        </div>

        <div className="ts-rows passenger">
          {loading && (
            <div className="ts-row passenger" style={{gridTemplateColumns:'1fr'}}>
              <div className="td"><div className="td-title">Loading schedules...</div></div>
            </div>
          )}
          {error && !loading && (
            <div className="ts-row passenger" style={{gridTemplateColumns:'1fr'}}>
              <div className="td"><div className="td-title" style={{color:'#b91c1c'}}>{error}</div></div>
            </div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="ts-row passenger" style={{gridTemplateColumns:'1fr'}}>
              <div className="td"><div className="td-title">No train schedules available</div></div>
            </div>
          )}
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`ts-row passenger ${selected === r.id ? "selected" : ""}`}
              onClick={() => setSelected(r.id)}
            >
              <div className="td train">
                <div className="td-text">
                  <div className="td-title">{r.name}</div>
                </div>
              </div>

              <div className="td route">
                <div className="td-title">{r.route}</div>
              </div>

              <div className="td date">
                <div className="td-title">{r.scheduleDate || '—'}</div>
              </div>

              <div className="td depart">
                <div className="td-title">{r.departTime}</div>
                <div className="td-sub">{r.departCity}</div>
              </div>

              <div className="td arrive">
                <div className="td-title">{r.arriveTime}</div>
                <div className="td-sub">{r.arriveCity}</div>
              </div>

              <div className="td status">
                <span className={`status-dot ${r.statusKind || "on"}`} />
                <div className="td-title">{r.status}</div>
              </div>

              {/* removed Availability cell */}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}