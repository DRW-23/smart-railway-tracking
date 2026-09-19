import { useState, useEffect } from 'react';
import { listTrainSchedules, listTrainPrices } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import "./SeatReservation.css";

// SeatReservation component: multi-step booking (details -> availability -> payment -> confirmation)
export default function SeatReservation() {
  const [currentStep, setCurrentStep] = useState(1);
  const [passengerType, setPassengerType] = useState("general");
  const location = useLocation();
  const landingState = location.state || {};
  const [formData, setFormData] = useState({
    departureStation: landingState.departureStation?.toLowerCase().replace(/\s+/g,'') || "",
    arrivalStation: landingState.arrivalStation?.toLowerCase().replace(/\s+/g,'') || "",
    travelDate: landingState.travelDate || "",
    passengers: landingState.passengers || ""
  });
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState({
    fullName: '',
    gender: 'Male',
    email: '',
    nicPassport: '',
    mobileNo: ''
  });
  const [paymentData, setPaymentData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  
  const navigate = useNavigate();
  // location already declared above

  // Handle browser back button
  // Popstate listener for browser back button to move one step back instead of leaving
  useEffect(() => {
    const handlePopState = (event) => {
      if (currentStep > 1) {
        event.preventDefault();
        setCurrentStep(prev => prev - 1);
        // Push the current state back to maintain the URL
        window.history.pushState({ step: currentStep - 1 }, '', location.pathname);
      }
    };

    // Add initial state
    window.history.replaceState({ step: currentStep }, '', location.pathname);

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentStep, location.pathname]);

  // Update history when step changes
  // Push new history state each time currentStep advances (for controlled back nav)
  useEffect(() => {
    if (currentStep > 1) {
      window.history.pushState({ step: currentStep }, '', location.pathname);
    }
  }, [currentStep, location.pathname]);

  // Navigate home/dashboard
  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  // Placeholder profile handler
  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  // Derive login state + elapsed time string
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

  // Clear login keys and redirect
  const handleLogout = () => {
    ['role','userId','passengerId','email'].forEach(k=> localStorage.removeItem(k));
    navigate('/login');
  };

  // Generic journey form update
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate journey and load trains
  const handleCheckAvailability = () => {
    // Basic validation
    if(!formData.departureStation || !formData.arrivalStation || !formData.travelDate || !formData.passengers){
      alert('Please fill all journey details first');
      return;
    }
    if(formData.travelDate < todayStr){
      alert('Travel date cannot be in the past');
      return;
    }
    // Trigger load
    loadAvailability();
  };

  // Select a train row
  const handleTrainSelect = (trainId) => {
    setSelectedTrain(trainId);
  };

  // Treat user as guest if role missing/invalid OR no id/email stored
  // Determine if current viewer lacks a valid session
  const isGuest = () => {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    const userId = localStorage.getItem('userId') || localStorage.getItem('passengerId');
    const email = localStorage.getItem('email');
    if(!role || role === 'guest' || role === 'null' || role === 'undefined') return true;
    if(!userId && !email) return true;
    return false;
  };

  // Ask guest to go to login
  const promptGuest = () => {
    const go = window.confirm('You need to register / log in to continue. Go to login now?');
    if (go) navigate('/login');
  };

  // Begin passenger details modal (guard guests)
  const handleBookNow = () => {
    console.log('[BookNow] isGuest=', isGuest(), 'role=', localStorage.getItem('role'), 'userId=', localStorage.getItem('userId'), 'email=', localStorage.getItem('email'));
    if (isGuest()) { promptGuest(); return; }
    if(!selectedTrain){ alert('Please select a train first.'); return; }
    setShowModal(true);
  };

  // Update passenger details modal fields
  const handleModalInputChange = (field, value) => {
    setPassengerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Advance from passenger modal to payment step
  const handleProceedToPayment = () => {
    if (isGuest()) { promptGuest(); return; }
    setShowModal(false);
    setCurrentStep(3);
  };

  // Update payment form fields
  const handlePaymentInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Finish payment (stub) and show confirmation
  const handleCompletePayment = () => {
    if (isGuest()) { promptGuest(); return; }
    setCurrentStep(4);
  };

  // Availability data state
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState(null);
  const [availableTrains, setAvailableTrains] = useState([]);
  const todayStr = (() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  })();

  // Fetch schedule + price lists then merge/filter client-side
  const loadAvailability = async () => {
    setAvailLoading(true); setAvailError(null); setAvailableTrains([]);
    try {
      const [schedRes, priceRes] = await Promise.all([
        // Pass selected travel date to backend so it filters server-side
        listTrainSchedules({ date: formData.travelDate }),
        listTrainPrices()
      ]);
      const prices = priceRes.data;
      // Match logic: allow exact, slug (remove spaces), or substring to accommodate schedule values like 'Colombo Fort' vs select value 'colombo'
      const dep = formData.departureStation.trim().toLowerCase();
      const arr = formData.arrivalStation.trim().toLowerCase();
      const matches = (scheduleCity, selected) => {
        if(!selected) return true;
        const sc = (scheduleCity || '').trim().toLowerCase();
        if(sc === selected) return true;
        if(sc.replace(/\s+/g,'') === selected) return true; // slug match
        return sc.includes(selected);
      };
      const filtered = schedRes.data.filter(s => matches(s.departCity, dep) && matches(s.arriveCity, arr));
      const merged = filtered.map(s => {
        const price = prices.find(p => p.name === s.name && (p.departTime?.substring(0,5) === s.departTime?.substring(0,5)));
        return {
          id: s.id,
            name: s.name,
            departTime: s.departTime?.substring(0,5) || s.departTime,
            arriveTime: s.arriveTime?.substring(0,5) || s.arriveTime,
            departCity: s.departCity,
            arriveCity: s.arriveCity,
            trainClass: s.trainClass,
            classDetails: s.classDetails,
            availability: s.availability,
            scheduleDate: s.scheduleDate,
            price: price ? price.priceLkr : null
        };
      });
      setAvailableTrains(merged);
      setCurrentStep(2);
    } catch(e){
      console.error(e); setAvailError('Failed to load availability');
    } finally { setAvailLoading(false); }
  };

  // If navigated from landing page with complete data, auto trigger availability
  // Auto-load availability when navigating from landing with pre-filled state
  useEffect(() => {
    if(landingState.fromLanding && formData.departureStation && formData.arrivalStation && formData.travelDate && formData.passengers){
      handleCheckAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Placeholder view ticket action
  const handleViewTicket = () => {
    console.log("View E-Ticket clicked");
  };

  // Placeholder download ticket action
  const handleDownloadTicket = () => {
    console.log("Download E-Ticket clicked");
  };

  // Close passenger details modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Navigate via header pills
  const handleTabNavigation = (path) => {
    navigate(path);
  };

  return (
    <>
    <div className="sr-container">
      {/* Background image removed */}

      {/* Top bar */}
      <header className="sr-topbar">
        <button className="sr-brand" onClick={handleLogoClick}>
          <div className="sr-logo">
            <img src={`${process.env.PUBLIC_URL}/assets/logo.png`} alt="Railway Digital Portal logo" />
          </div>
          <span className="sr-brand-text">Smart Train Tracker</span>
        </button>
        <div className="sr-top-right">
          {(() => {
            const status = getLoginStatus();
            return (
              <div className="sr-user-status">
                <span className={`sr-status-indicator ${status.isLoggedIn ? 'logged-in' : 'guest'}`}>
                  {status.isLoggedIn ? '🟢' : '🔴'} {status.display}
                </span>
                {status.isLoggedIn && (
                  <button className="sr-logout" onClick={handleLogout}>Log out</button>
                )}
              </div>
            );
          })()}
          <button className="sr-notification" title="Notifications">🔔</button>
          <button className="sr-profile-btn" onClick={handleProfileClick} title="Profile">
            <img src={`${process.env.PUBLIC_URL}/assets/default-avatar.png`} alt="User Profile" className="sr-profile-img" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="sr-main">
        {/* Title Section */}
        <div className="sr-hero">
          <h1>Seat Reservation</h1>
          <p>Book your train seats for general or warrant passengers</p>
        </div>

        {/* Navigation Pills */}
        {(() => {
          const current = location.pathname;
          const links = [
            { to: '/elephant-map', label: 'Live Elephant Tracking' },
            { to: '/train-schedule', label: 'Train Schedule' },
            { to: '/seat-reservation', label: 'Seat Reservation' },
            { to: '/lost-found', label: 'Lost & Found' },
            { to: '/feedback', label: 'Feedback & Complaints' }
          ];
          return (
            <nav className="sr-header-tabs sr-nav-pills" aria-label="Main navigation">
              {links.map(l => (
                <button
                  key={l.to}
                  className={`sr-pill ${current === l.to ? 'active' : ''}`}
                  onClick={() => current === l.to ? void 0 : handleTabNavigation(l.to)}
                  aria-current={current === l.to ? 'page' : undefined}
                >
                  {l.label}
                </button>
              ))}
            </nav>
          );
        })()}

        {/* Passenger Type Selection */}
        <div className="sr-passenger-type">
          <button 
            className={`sr-type-btn ${passengerType === 'general' ? 'active' : ''}`}
            onClick={() => setPassengerType('general')}
          >
            General Passenger
          </button>
        </div>

        {/* Progress Steps */}
        <div className="sr-progress">
          <div className="sr-step-container">
            <div className={`sr-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="sr-step-number">1</div>
              <div className="sr-step-label">Journey Details</div>
            </div>
            
            <div className="sr-step-line" />
            
            <div className={`sr-step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="sr-step-number">2</div>
              <div className="sr-step-label">Availability</div>
            </div>
            
            <div className="sr-step-line" />
            
            <div className={`sr-step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="sr-step-number">3</div>
              <div className="sr-step-label">Payment</div>
            </div>
            
            <div className="sr-step-line" />
            
            <div className={`sr-step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="sr-step-number">4</div>
              <div className="sr-step-label">Confirmation</div>
            </div>
          </div>
        </div>

        {/* Journey Details Form */}
        {currentStep === 1 && (
          <div className="sr-form-container">
            <h2>Journey Details</h2>
            
            <div className="sr-form-grid">
              <div className="sr-form-group">
                <label>Departure Station</label>
                <select 
                  value={formData.departureStation}
                  onChange={(e) => handleInputChange('departureStation', e.target.value)}
                >
                  <option value="">Select departure station</option>
                  <option value="anuradhapura">Anuradhapura Town</option>
                  <option value="aluthgama">Aluthgama</option>
                  <option value="badulla">Badulla</option>
                  <option value="bandarawela">Bandarawela</option>
                  <option value="beliatta">Beliatta</option>
                  <option value="beruwala">Beruwala</option>
                  <option value="colombo">Colombo Fort</option>
                  <option value="diyathalawa">Diyathalawa</option>
                  <option value="ella">Ella</option>
                  <option value="galagamua">Galagamua</option>
                  <option value="galle">Galle</option>
                  <option value="galoya">Galoya</option>
                  <option value="gampaha">Gampaha</option>
                  <option value="jaffna">Jaffna</option>
                  <option value="kakirawa">Kakirawa</option>
                  <option value="kandy">Kandy</option>
                  <option value="kanthale">Kanthale</option>
                </select>
              </div>

              <div className="sr-form-group">
                <label>Arrival Station</label>
                <select 
                  value={formData.arrivalStation}
                  onChange={(e) => handleInputChange('arrivalStation', e.target.value)}
                >
                  <option value="">Select arrival station</option>
                  <option value="anuradhapura">Anuradhapura Town</option>
                  <option value="aluthgama">Aluthgama</option>
                  <option value="badulla">Badulla</option>
                  <option value="bandarawela">Bandarawela</option>
                  <option value="beliatta">Beliatta</option>
                  <option value="beruwala">Beruwala</option>
                  <option value="colombo">Colombo Fort</option>
                  <option value="diyathalawa">Diyathalawa</option>
                  <option value="ella">Ella</option>
                  <option value="galagamua">Galagamua</option>
                  <option value="galle">Galle</option>
                  <option value="galoya">Galoya</option>
                  <option value="gampaha">Gampaha</option>
                  <option value="jaffna">Jaffna</option>
                  <option value="kakirawa">Kakirawa</option>
                  <option value="kandy">Kandy</option>
                  <option value="kanthale">Kanthale</option>
                </select>
              </div>



              <div className="sr-form-group">
                <label>Travel Date</label>
                <input 
                  type="date"
                  value={formData.travelDate}
                  min={todayStr}
                  onChange={(e) => handleInputChange('travelDate', e.target.value)}
                />
              </div>

              <div className="sr-form-group">
                <label>No. of Passengers</label>
                <select 
                  value={formData.passengers}
                  onChange={(e) => handleInputChange('passengers', e.target.value)}
                >
                  <option value="">Select Number</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>

            <button className="sr-check-btn" onClick={handleCheckAvailability}>
              Check Availability
            </button>
          </div>
        )}

        {/* Availability Page */}
        {currentStep === 2 && (
          <div className="sr-availability-container">
            {/* Train Info Header */}
            <div className="sr-train-info">
              <div className="sr-train-icon">🚂</div>
              <div className="sr-train-details">
                <h3>Train Info</h3>
                <div className="sr-route">
                  <span className="sr-route-text">
                    {formData.departureStation ? formData.departureStation.charAt(0).toUpperCase() + formData.departureStation.slice(1) : 'Colombo Fort'} 
                    <span className="sr-arrow"> → </span>
                    {formData.arrivalStation ? formData.arrivalStation.charAt(0).toUpperCase() + formData.arrivalStation.slice(1) : 'Galle'}
                  </span>
                  <div className="sr-train-emoji">🚊</div>
                </div>
                <div className="sr-date">Date - {formData.travelDate || '2025-10-31'}</div>
                <div className="sr-select-train">Select a train and proceed →</div>
              </div>
            </div>

            {/* Available Trains Table */}
            <div className="sr-trains-table">
              <div className="sr-table-header">
                <div className="sr-header-cell">Train Name</div>
                <div className="sr-header-cell">Price</div>
                <div className="sr-header-cell">Departs</div>
                <div className="sr-header-cell">Arrives</div>
                <div className="sr-header-cell">Date</div>
                <div className="sr-header-cell">Class</div>
                <div className="sr-header-cell">Availability</div>
              </div>
              {availLoading && (
                <div className="sr-train-row"><div style={{padding:'12px'}}>Loading...</div></div>
              )}
              {availError && (
                <div className="sr-train-row"><div style={{padding:'12px', color:'red'}}>{availError}</div></div>
              )}
              {!availLoading && !availError && availableTrains.length === 0 && (
                <div className="sr-train-row"><div style={{padding:'12px'}}>No matching trains for selected date and route.</div></div>
              )}
              {!availLoading && !availError && availableTrains.map(t => (
                <div key={t.id} className={`sr-train-row ${selectedTrain === t.id ? 'selected' : ''}`} onClick={()=> handleTrainSelect(t.id)}>
                  <div className="sr-train-name">
                    {t.name}<br />
                    {(t.departCity||'') + ' - ' + (t.arriveCity||'')}
                  </div>
                  <div className="sr-price">{t.price != null ? 'LKR ' + t.price.toLocaleString() : <span style={{opacity:.5}}>N/A</span>}</div>
                  <div className="sr-train-time">{t.departTime}</div>
                  <div className="sr-train-time">{t.arriveTime}</div>
                  <div className="sr-train-date">{t.scheduleDate || formData.travelDate}</div>
                  <div className="sr-train-class">
                    {t.classDetails ? <span className="sr-class-badge">{t.classDetails}</span> : <span className="sr-class-badge muted">{t.trainClass || '—'}</span>}
                  </div>
                  <div className="sr-available">{t.availability || '—'}</div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="sr-pagination">
              <button className="sr-page-btn">Previous</button>
              <button className="sr-page-btn active">1</button>
              <button className="sr-page-btn">Next</button>
            </div>

            {/* Book Now Button */}
            <div className="sr-book-section">
              <button className="sr-book-btn" onClick={handleBookNow}>
                Book Now
              </button>
            </div>

        {/* Passenger Details Modal */}
        {showModal && !isGuest() && (
          <div className="sr-modal-overlay" onClick={handleCloseModal}>
            <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sr-modal-header">
                <h2>Primary Passenger Details</h2>
                <button className="sr-modal-close" onClick={handleCloseModal}>×</button>
              </div>
              
              <div className="sr-modal-content">
                <div className="sr-modal-form">
                  <div className="sr-modal-field">
                    <label>Full name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={passengerDetails.fullName}
                      onChange={(e) => handleModalInputChange('fullName', e.target.value)}
                    />
                  </div>

                  <div className="sr-modal-field">
                    <label>Gender</label>
                    <select
                      value={passengerDetails.gender}
                      onChange={(e) => handleModalInputChange('gender', e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sr-modal-field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={passengerDetails.email}
                      onChange={(e) => handleModalInputChange('email', e.target.value)}
                    />
                  </div>

                  <div className="sr-modal-field">
                    <label>NIC / Passport</label>
                    <input
                      type="text"
                      placeholder="Enter your NIC or Passport No."
                      value={passengerDetails.nicPassport}
                      onChange={(e) => handleModalInputChange('nicPassport', e.target.value)}
                    />
                  </div>

                  <div className="sr-modal-field">
                    <label>Mobile No.</label>
                    <input
                      type="tel"
                      placeholder="Enter your Mobile Number"
                      value={passengerDetails.mobileNo}
                      onChange={(e) => handleModalInputChange('mobileNo', e.target.value)}
                    />
                  </div>

                  <button className="sr-proceed-btn" onClick={handleProceedToPayment}>
                    Proceed to payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        )}

        {/* Payment Page */}
        {currentStep === 3 && (
          <div className="sr-payment-container">
            <h2>Payment Details</h2>
            
            <div className="sr-payment-form">
              <div className="sr-payment-grid">
                <div className="sr-payment-field">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="Enter card holder name"
                    value={paymentData.cardholderName}
                    onChange={(e) => handlePaymentInputChange('cardholderName', e.target.value)}
                  />
                </div>

                <div className="sr-payment-field">
                  <label>Card Number</label>
                  <input
                    type="text"
                    placeholder="Enter Card Number"
                    value={paymentData.cardNumber}
                    onChange={(e) => handlePaymentInputChange('cardNumber', e.target.value)}
                    maxLength="19"
                  />
                </div>

                <div className="sr-payment-field">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/DD/YY"
                    value={paymentData.expiryDate}
                    onChange={(e) => handlePaymentInputChange('expiryDate', e.target.value)}
                    maxLength="8"
                  />
                </div>

                <div className="sr-payment-field">
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="000"
                    value={paymentData.cvv}
                    onChange={(e) => handlePaymentInputChange('cvv', e.target.value)}
                    maxLength="4"
                  />
                </div>
              </div>

              <button className="sr-complete-payment-btn" onClick={handleCompletePayment}>
                Complete Payment
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Page */}
        {currentStep === 4 && (
          <div className="sr-confirmation-container">
            <h2>Confirmation</h2>
            
            <div className="sr-confirmation-content">
              <div className="sr-success-icon">
                <div className="sr-checkmark">✓</div>
              </div>
              
              <h3>Booking Confirmed!</h3>
              <p>Your e-ticket has been generated successfully</p>
              
              <div className="sr-confirmation-buttons">
                <button className="sr-view-ticket-btn" onClick={handleViewTicket}>
                  View E - Ticket
                </button>
                <button className="sr-download-ticket-btn" onClick={handleDownloadTicket}>
                  Download E - Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    {/* Guest popup replaced with simple window.confirm; no extra JSX needed */}
    </>
  );
}

// Auth popup overlay (simple CSS-in-file addition via SeatReservation.css)