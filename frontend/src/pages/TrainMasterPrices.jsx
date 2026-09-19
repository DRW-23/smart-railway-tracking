import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './TrainSchedule.css';
import { listTrainSchedules, listTrainPrices, createTrainPrice, updateTrainPrice } from '../services/api';

// TrainMasterPrices component: manage fare prices for schedules
export default function TrainMasterPrices() {
  const navigate = useNavigate();
  // Navigate home
  const handleLogoClick = () => navigate('/');
  // Open profile page
  const handleProfileClick = () => navigate('/train-master/profile');
  const [rows, setRows] = useState([]); // merged schedule + price info
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // price record id (NOT schedule id)
  const [formData, setFormData] = useState({ price:'', availability:'' });
  const [activeSchedule, setActiveSchedule] = useState(null); // schedule row we are pricing

  // Open price edit/add modal for a schedule row
  const openFormFor = (row) => {
    setActiveSchedule(row);
    setEditingId(row.priceId || null);
    setFormData({
      price: row.price ? String(row.price) : '',
      availability: row.availability || ''
    });
    setShowForm(true);
  };
  // Close price modal
  const closeForm = () => { setShowForm(false); setActiveSchedule(null); setEditingId(null); };
  // Update price form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  // Save new or updated price entry
  const submitPrice = async (e) => {
    e.preventDefault();
    if(!activeSchedule) return;
    if(!formData.price){ alert('Enter price'); return; }
    const payload = {
      name: activeSchedule.name,
      departTime: activeSchedule.departTime,
      departCity: activeSchedule.departCity || null,
      arriveTime: activeSchedule.arriveTime,
      arriveCity: activeSchedule.arriveCity || null,
      trainClass: activeSchedule.trainClass || null,
      classDetails: activeSchedule.classDetails || null,
      availability: formData.availability || null,
      priceLkr: Number(formData.price)
    };
    try {
      let saved;
      if(editingId){
        const { data } = await updateTrainPrice(editingId, payload); saved = data; }
      else { const { data } = await createTrainPrice(payload); saved = data; }
      setRows(rs => rs.map(r => r.id === activeSchedule.id ? { ...r, price: saved.priceLkr, availability: saved.availability, priceId: saved.id } : r));
      closeForm();
    } catch(err){ console.error(err); alert('Save failed'); }
  };

  // Load schedules + existing prices and merge
  // Load schedules & prices then merge
  useEffect(() => {
    (async () => {
      try {
        const [schedRes, priceRes] = await Promise.all([
          listTrainSchedules(),
          listTrainPrices()
        ]);
        const prices = priceRes.data; // array
        const rowsMerged = schedRes.data.map(s => {
          const match = prices.find(p => p.name === s.name && (p.departTime?.substring(0,5)=== s.departTime?.substring(0,5)));
          return {
            id: s.id,
            name: s.name,
            departTime: s.departTime?.substring(0,5) || s.departTime,
            departCity: s.departCity,
            arriveTime: s.arriveTime?.substring(0,5) || s.arriveTime,
            arriveCity: s.arriveCity,
            trainClass: s.trainClass,
            classDetails: s.classDetails,
            availability: match ? match.availability : s.availability,
            price: match ? match.priceLkr : null,
            priceId: match ? match.id : null
          };
        });
        setRows(rowsMerged);
      } catch(e){
        console.error(e); setError('Failed to load prices');
      } finally { setLoading(false); }
    })();
  }, []);
  return (
    <div className="ts-container">
      <div className="ts-bg" />
      <header className="ts-topbar">
        <button className="ts-brand" onClick={handleLogoClick}>
          <div className="ts-logo"><img src={`${process.env.PUBLIC_URL}/assets/logo.png`} alt="Logo" /></div>
          <span className="ts-brand-text">Railway Digital Portal</span>
        </button>
        <button className="ts-profile-btn" onClick={handleProfileClick}>
          <img src={`${process.env.PUBLIC_URL}/assets/default-avatar.png`} alt="Profile" className="ts-profile-img" />
        </button>
      </header>
      <nav className="ts-tabs">
        {/* Keep Train Schedule highlighted (active) even while viewing prices as a sub-section */}
        <button className="ts-tab active" onClick={()=> navigate('/train-master/schedule')}>Train Schedule</button>
        <button className="ts-tab" onClick={() => navigate('/train-master/elephant-tracking')}>Live Elephant Map</button>
        <button className="ts-tab" onClick={() => navigate('/train-master/feedback')}>Feedback & Complaints</button>
      </nav>
      <section className="ts-hero">
        <h1>Train Prices (Master)</h1>
        <p>Manage fare pricing (sub-section of Train Schedule)</p>
        <div style={{marginTop:'28px'}} />
      </section>
      <section className="ts-table">
        <div className="ts-head" style={{gridTemplateColumns:'2fr 1fr 1fr 0.9fr 1fr 0.9fr'}}>
          <div>TRAIN NAME</div>
          <div>DEPARTS</div>
          <div>ARRIVES</div>
          <div>CLASS</div>
          <div>AVAILABILITY</div>
          <div>PRICE (LKR)</div>
        </div>
        <div className="ts-rows">
          {loading && <div className="ts-row" style={{gridTemplateColumns:'1fr'}}><div className="td"><div className="td-title">Loading...</div></div></div>}
          {error && <div className="ts-row" style={{gridTemplateColumns:'1fr'}}><div className="td"><div className="td-title">{error}</div></div></div>}
          {!loading && !error && rows.map(r => (
            <div key={r.id} className="ts-row" style={{gridTemplateColumns:'2fr 1fr 1fr 0.9fr 1fr 0.9fr', cursor:'pointer'}} onClick={()=> openFormFor(r)} title={r.price ? 'Click to edit price' : 'Click to add price'}>
              <div className="td train">
                <div className="td-text">
                  <div className="td-title">{r.name}</div>
                </div>
              </div>
              <div className="td depart"><div className="td-title">{r.departTime}</div><div className="td-sub">{r.departCity}</div></div>
              <div className="td arrive"><div className="td-title">{r.arriveTime}</div><div className="td-sub">{r.arriveCity}</div></div>
              <div className="td class" style={{flexDirection:'column',alignItems:'flex-start'}}>
                <div className="badge-row">
                  {r.classDetails ? r.classDetails.split(/[,;]+/).map((part,idx)=>(
                    <span key={idx} className={`class-badge ${idx===0 ? 'primary' : 'secondary'}`}>{part.trim()}</span>
                  )) : <span className="class-badge muted">{r.trainClass || '—'}</span>}
                  {r.classDetails && !r.classDetails.toLowerCase().includes(r.trainClass?.toLowerCase()||'') && r.trainClass && (
                    <span className="class-badge outline">{r.trainClass}</span>
                  )}
                </div>
              </div>
              <div className="td availability"><div className="td-title">{r.availability || '—'}</div></div>
              <div className="td price"><div className="td-title">{r.price != null ? r.price.toLocaleString() : <span style={{opacity:.6}}>Add +</span>}</div></div>
            </div>
          ))}
          {!loading && !error && rows.length === 0 && (
            <div className="ts-row" style={{gridTemplateColumns:'1fr'}}>
              <div className="td"><div className="td-title">No price entries</div></div>
            </div>
          )}
        </div>
      </section>
      {showForm && (
        <div className="ts-modal-overlay" onClick={closeForm}>
          <div className="ts-modal ts-modal-wide" role="dialog" aria-modal="true" aria-labelledby="add-price-title" onClick={e=> e.stopPropagation()}>
            <div className="ts-modal-header">
              <h2 id="add-price-title">{editingId ? 'Edit Price' : 'Add Price'}</h2>
              <button className="ts-modal-close" onClick={closeForm} aria-label="Close dialog">×</button>
            </div>
            <form className="ts-modal-body" onSubmit={submitPrice}>
              <div className="ts-field-group">
                <label>Train</label>
                <input type="text" value={activeSchedule?.name || ''} disabled />
              </div>
              <div className="ts-grid-2">
                <div className="ts-field-group">
                  <label>Depart</label>
                  <input type="text" value={activeSchedule?.departTime || ''} disabled />
                </div>
                <div className="ts-field-group">
                  <label>Arrive</label>
                  <input type="text" value={activeSchedule?.arriveTime || ''} disabled />
                </div>
              </div>
              <div className="ts-grid-2">
                <div className="ts-field-group">
                  <label>Availability (override)</label>
                  <input name="availability" type="text" value={formData.availability} onChange={handleChange} placeholder="e.g. Limited" />
                </div>
                <div className="ts-field-group">
                  <label>Price (LKR)</label>
                  <input name="price" type="number" min="0" value={formData.price} onChange={handleChange} required />
                </div>
              </div>
              <div className="ts-actions-row">
                <button type="button" className="ts-secondary-btn" onClick={closeForm}>Cancel</button>
                <button type="submit" className="ts-primary-btn">{editingId ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
