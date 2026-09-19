import "./LandingPage.css";
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// LandingPage component: shows hero section and booking form
export default function LandingPage() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);
  // Today's date in YYYY-MM-DD (local) for min attribute on date input
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  // Stations for the dropdown (edit this list as needed)
  const stations = [
    "Anuradhapura Town",
    "Aluthgama",
    "Badulla",
    "Bandarawela",
    "Beliatta",
    "Beruwala",
    "Colombo Fort",
    "Diyathalawa",
    "Ella",
    "Galagamuwa",
    "Galle",
    "Galoya",
    "Gampaha",
    "Jaffna",
    "Kakirawa",
    "Kandy",
    "Kanthale",
    "SOORIYAWEWA"
  ];

  // Departure dropdown state
  const [selectedDeparture, setSelectedDeparture] = useState("");
  const [depOpen, setDepOpen] = useState(false);
  const depDropdownRef = useRef(null);

  // Arrival dropdown state
  const [selectedArrival, setSelectedArrival] = useState("");
  const [arrOpen, setArrOpen] = useState(false);
  const arrDropdownRef = useRef(null);

  // Seats dropdown state
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [seatsOpen, setSeatsOpen] = useState(false);
  const seatsDropdownRef = useRef(null);
  const seatOptions = [1, 2, 3, 4, 5];

  // Close any open dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (depDropdownRef.current && !depDropdownRef.current.contains(e.target)) {
        setDepOpen(false);
      }
      if (arrDropdownRef.current && !arrDropdownRef.current.contains(e.target)) {
        setArrOpen(false);
      }
      if (seatsDropdownRef.current && !seatsDropdownRef.current.contains(e.target)) {
        setSeatsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <>
      <header className="navbar">
        <div className="nav-left">
          <img className="logo" src="/assets/logo.png" alt="Railway Digital Portal Logo" />
          <div className="brand">Railway Digital Portal</div>
        </div>
        <div className="nav-right">
          <Link to="/login" className="login-btn">Log in</Link>
          <a href="#contact" className="contact-link">Contact</a>
        </div>
      </header>

      {/* Two-column layout: Hero (left) + Booking (right) */}
      <main className="landing-two-column">
        <section className="hero">
          <div className="hero-content">
            <h1>Welcome to Railway Digital Portal</h1>
            <p className="subtitle">"Digital rails for a smarter future."</p>
            <div className="hero-buttons">
              <button
                className="cta-outline-btn"
                onClick={() => navigate("/passenger-dashboard")}
              >
                Find out more →
              </button>
            </div>
          </div>
        </section>

        <section id="booking" className="booking-section">
          <div className="booking-card">
            <div className="booking-title">Book your Journey</div>
            {/* Form submit: validate required fields then navigate to seat reservation */}
            <form className="form-grid" onSubmit={(e) => {
              e.preventDefault();
              const travelDate = dateInputRef.current?.value || "";
              if(!selectedDeparture || !selectedArrival || !travelDate || !selectedSeats){
                alert("Please fill all fields before checking availability");
                return;
              }
              navigate('/seat-reservation', {
                state: {
                  fromLanding: true,
                  departureStation: selectedDeparture,
                  arrivalStation: selectedArrival,
                  travelDate,
                  passengers: String(selectedSeats)
                }
              });
            }}>
              <div className="form-group">
                <label>Departure Station</label>
                <div className="input-wrap dropdown" ref={depDropdownRef}>
                  <button
                    type="button"
                    className="dropdown-toggle"
                    aria-haspopup="listbox"
                    aria-expanded={depOpen}
                    onClick={() => setDepOpen((o) => !o)}
                  >
                    <span>{selectedDeparture || "From"}</span>
                    <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {depOpen && (
                    <ul className="dropdown-menu" role="listbox">
                      {stations.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selectedDeparture === s}
                            className={selectedDeparture === s ? "selected" : ""}
                            onClick={() => {
                              setSelectedDeparture(s);
                              setDepOpen(false);
                            }}
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input type="hidden" name="departureStation" value={selectedDeparture} />
                </div>
              </div>

              <div className="form-group">
                <label>Arrival Station</label>
                <div className="input-wrap dropdown" ref={arrDropdownRef}>
                  <button
                    type="button"
                    className="dropdown-toggle"
                    aria-haspopup="listbox"
                    aria-expanded={arrOpen}
                    onClick={() => setArrOpen((o) => !o)}
                  >
                    <span>{selectedArrival || "To"}</span>
                    <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {arrOpen && (
                    <ul className="dropdown-menu" role="listbox">
                      {stations.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selectedArrival === s}
                            className={selectedArrival === s ? "selected" : ""}
                            onClick={() => {
                              setSelectedArrival(s);
                              setArrOpen(false);
                            }}
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input type="hidden" name="arrivalStation" value={selectedArrival} />
                </div>
              </div>

              <div className="form-group">
                <label>Travel Date</label>
                <div className="input-wrap">
                  <input
                    ref={dateInputRef}
                    type="date"
                    placeholder="dd/mm/yyyy"
                    min={todayStr}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>No. of Seats</label>
                <div className="input-wrap dropdown" ref={seatsDropdownRef}>
                  <button
                    type="button"
                    className="dropdown-toggle"
                    aria-haspopup="listbox"
                    aria-expanded={seatsOpen}
                    onClick={() => setSeatsOpen((o) => !o)}
                  >
                    <span>{selectedSeats} {selectedSeats === 1 ? 'Seat' : 'Seats'}</span>
                    <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {seatsOpen && (
                    <ul className="dropdown-menu" role="listbox">
                      {seatOptions.map((num) => (
                        <li key={num}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selectedSeats === num}
                            className={selectedSeats === num ? "selected" : ""}
                            onClick={() => {
                              setSelectedSeats(num);
                              setSeatsOpen(false);
                            }}
                          >
                            {num} {num === 1 ? 'Seat' : 'Seats'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input type="hidden" name="seats" value={selectedSeats} />
                </div>
              </div>

              <div className="form-actions">
                <button className="primary-btn" type="submit">Check Availability</button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}