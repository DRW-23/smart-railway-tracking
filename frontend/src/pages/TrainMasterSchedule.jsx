import { useState, useEffect, useCallback } from 'react';
import { listTrainSchedules, createTrainSchedule, deleteTrainSchedule, updateTrainSchedule } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './TrainSchedule.css';

// Start with empty array; fill from backend
const initialRows = [];

// TrainMasterSchedule component: CRUD interface for schedules
export default function TrainMasterSchedule() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialRows);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null => add mode
  const [formData, setFormData] = useState({
    name: '',
    route: '',
    departTime: '',
    departCity: '',
    arriveTime: '',
    arriveCity: '',
    scheduleDate: '',
    trainClass: '',
    availability: '',
    classDetails: '',
    status: 'On Time',
    statusKind: 'on'
  });

  // Reset modal form to blank / defaults
  const resetForm = () => {
    const today = new Date().toISOString().substring(0,10);
    setFormData({ name: '', route: '', departTime: '', departCity: '', arriveTime: '', arriveCity: '', scheduleDate: today, trainClass: '', availability: '', classDetails: '', status: 'On Time', statusKind: 'on' });
  };

  // Open add form
  const openForm = () => { resetForm(); setEditingId(null); setShowForm(true); };
  // Close modal form
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  // Populate form with existing row for edit
  const openEdit = (row) => {
    setFormData({
      name: row.name || '',
      route: row.route || '',
      departTime: row.departTime || '',
      departCity: row.departCity || '',
      arriveTime: row.arriveTime || '',
      arriveCity: row.arriveCity || '',
      scheduleDate: row.scheduleDate || new Date().toISOString().substring(0,10),
      trainClass: row.trainClass || '',
      availability: row.availability || '',
      classDetails: row.classDetails || row.classDescription || '',
      status: row.status || 'On Time',
      statusKind: row.statusKind || 'on'
    });
    setEditingId(row.id);
    setShowForm(true);
  };

  // Close on ESC key
  // ESC closes modal
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') closeForm();
  }, []);

  // Manage key listener lifecycle
  useEffect(() => {
    if (showForm) {
      window.addEventListener('keydown', handleKey);
    } else {
      window.removeEventListener('keydown', handleKey);
    }
    return () => window.removeEventListener('keydown', handleKey);
  }, [showForm, handleKey]);

  // Update form field value
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  // Create or update schedule on submit
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.departTime || !formData.arriveTime) {
      alert('Please fill at least Name, Depart Time and Arrive Time');
      return;
    }
    try {
      if (editingId) {
        const payload = {
          name: formData.name,
          route: formData.route || null,
          departTime: formData.departTime,
          departCity: formData.departCity || null,
          arriveTime: formData.arriveTime,
          arriveCity: formData.arriveCity || null,
          scheduleDate: formData.scheduleDate || null,
          trainClass: formData.trainClass || null,
          availability: formData.availability || null,
          classDetails: formData.classDetails || null,
          statusText: formData.status || 'On Time',
          statusKind: formData.statusKind || 'on'
        };
        const { data: updated } = await updateTrainSchedule(editingId, payload);
        setRows(rs => rs.map(r => r.id === editingId ? {
          id: updated.id,
          name: updated.name,
          route: updated.route,
          departTime: updated.departTime?.substring(0,5) || updated.departTime,
          departCity: updated.departCity,
          arriveTime: updated.arriveTime?.substring(0,5) || updated.arriveTime,
          arriveCity: updated.arriveCity,
          trainClass: updated.trainClass || updated.classType || updated.class || '',
          availability: updated.availability || '',
          classDetails: updated.classDetails || updated.classDescription || '',
          status: updated.statusText,
          statusKind: updated.statusKind,
          scheduleDate: updated.scheduleDate
        } : r));
        closeForm();
        return;
      }
      const payload = {
        name: formData.name,
        route: formData.route || null,
        departTime: formData.departTime,
        departCity: formData.departCity || null,
        arriveTime: formData.arriveTime,
        arriveCity: formData.arriveCity || null,
        scheduleDate: formData.scheduleDate || null,
        trainClass: formData.trainClass || null,
        availability: formData.availability || null,
        classDetails: formData.classDetails || null,
        statusText: formData.status || 'On Time',
        statusKind: formData.statusKind || 'on'
      };
      const { data: created } = await createTrainSchedule(payload);
      // Adapt to UI shape
      const uiRow = {
        id: created.id,
        name: created.name,
        route: created.route,
        departTime: created.departTime?.substring(0,5) || created.departTime,
        departCity: created.departCity,
        arriveTime: created.arriveTime?.substring(0,5) || created.arriveTime,
        arriveCity: created.arriveCity,
        trainClass: created.trainClass || created.classType || created.class || '',
        availability: created.availability || '',
        classDetails: created.classDetails || created.classDescription || '',
        status: created.statusText,
        statusKind: created.statusKind,
        scheduleDate: created.scheduleDate
      };
      setRows(rs => [uiRow, ...rs]);
      closeForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save schedule');
    }
  };

  // Delete selected schedule after confirm
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this train schedule?')) return;
    try {
      await deleteTrainSchedule(id);
      setRows(rs => rs.filter(r => r.id !== id));
      if (selected === id) setSelected(null);
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };
  // Fetch schedules on mount
  // Initial fetch of schedule list
  useEffect(() => {
    (async () => {
      try {
        const { data } = await listTrainSchedules();
        const mapped = data.map(d => ({
          id: d.id,
            name: d.name,
            route: d.route,
            departTime: d.departTime?.substring(0,5) || d.departTime,
            departCity: d.departCity,
            arriveTime: d.arriveTime?.substring(0,5) || d.arriveTime,
            arriveCity: d.arriveCity,
            trainClass: d.trainClass || d.classType || d.class || '',
            availability: d.availability || '',
      classDetails: d.classDetails || d.classDescription || '',
            status: d.statusText,
            statusKind: d.statusKind,
            scheduleDate: d.scheduleDate
        }));
        setRows(mapped);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Go home
  const handleLogoClick = () => navigate('/');
  // Open profile page
  const handleProfileClick = () => navigate('/train-master/profile');

  return (
    <div className="ts-container">
      <div className="ts-bg">
        <div className="ts-bg-img" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/dashboardImage.jpg)` }} />
        <div className="ts-overlay" />
      </div>

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
        <button className="ts-tab active">Train Schedule</button>
        <button className="ts-tab" onClick={() => navigate('/train-master/elephant-tracking')}>Live Elephant Map</button>
        <button className="ts-tab" onClick={() => navigate('/train-master/feedback')}>Feedback & Complaints</button>
      </nav>

      <section className="ts-hero">
        <h1>Train Schedule (Master)</h1>
        <p>Manage train timetable entries</p>
        <div style={{ marginTop: '28px', display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap' }}>
          <button className="ts-add-btn" type="button" onClick={openForm}>
            <span style={{ fontSize:'20px', lineHeight:1, marginRight:8 }}>+</span> Add Train Schedule
          </button>
          <button className="ts-add-btn ts-btn-secondary" type="button" onClick={()=> navigate('/train-master/prices')}>
            <span style={{ fontSize:'20px', lineHeight:1, marginRight:8 }}>💲</span> Prices
          </button>
        </div>
      </section>

      <section className="ts-table">
        <div className="ts-head">
          <div>TRAIN DETAIL</div>
          <div>ROUTE</div>
          <div>DATE</div>
          <div>CLASS</div>
          <div>AVAILABILITY</div>
          <div>DEPARTURE</div>
          <div>ARRIVAL</div>
          <div>STATUS</div>
          <div aria-hidden="true" />
        </div>
        <div className="ts-rows">
          {rows.map(r => (
            <div key={r.id} className={`ts-row ${selected === r.id ? 'selected' : ''}`} onClick={() => setSelected(r.id)}>
              <div className="td train" onDoubleClick={() => openEdit(r)}>
                <div className="td-text">
                  <div className="td-title">{r.name}</div>
                </div>
              </div>
              <div className="td route" onDoubleClick={() => openEdit(r)}><div className="td-title">{r.route}</div></div>
              <div className="td date" onDoubleClick={() => openEdit(r)}><div className="td-title">{r.scheduleDate || '—'}</div></div>
              <div className="td class" onDoubleClick={() => openEdit(r)}>
                <div className="td-title">{r.trainClass || '—'}</div>
                {r.classDetails && <div className="td-sub" style={{maxWidth:180}}>{r.classDetails}</div>}
              </div>
              <div className="td availability" onDoubleClick={() => openEdit(r)}><div className="td-title">{r.availability || '—'}</div></div>
              <div className="td depart" onDoubleClick={() => openEdit(r)}><div className="td-title">{r.departTime}</div><div className="td-sub">{r.departCity}</div></div>
              <div className="td arrive" onDoubleClick={() => openEdit(r)}><div className="td-title">{r.arriveTime}</div><div className="td-sub">{r.arriveCity}</div></div>
              <div className="td status" onDoubleClick={() => openEdit(r)}><span className={`status-dot ${r.statusKind || 'on'}`} /><div className="td-title">{r.status}</div></div>
              <div className="td actions" onClick={(e)=> e.stopPropagation()}>
                <button
                  className="ts-edit-btn"
                  onClick={() => openEdit(r)}
                  aria-label="Edit schedule"
                  title="Edit schedule"
                  style={{marginRight:6}}
                >
                  <span aria-hidden="true">✏️</span>
                </button>
                <button
                  className="ts-delete-btn"
                  onClick={() => handleDelete(r.id)}
                  aria-label="Delete schedule"
                  title="Delete schedule"
                >
                  <span aria-hidden="true">🗑</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showForm && (
        <div className="ts-modal-overlay" onClick={closeForm}>
          <div
            className="ts-modal ts-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-train-schedule-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="ts-modal-header">
              <h2 id="add-train-schedule-title">{editingId ? 'Edit Train Schedule' : 'Add Train Schedule'}</h2>
              <button className="ts-modal-close" onClick={closeForm} aria-label="Close dialog">×</button>
            </div>
            <form className="ts-modal-body" onSubmit={handleAdd}>
              <div className="ts-field-group">
                <label>Train Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="ts-field-group">
                <label>Route</label>
                <input type="text" name="route" value={formData.route} onChange={handleChange} />
              </div>
              <div className="ts-grid-2">
                <div className="ts-field-group">
                  <label>Depart Time</label>
                  <input type="time" name="departTime" value={formData.departTime} onChange={handleChange} required />
                </div>
                <div className="ts-field-group">
                  <label>Depart City</label>
                  <input type="text" name="departCity" value={formData.departCity} onChange={handleChange} />
                </div>
              </div>
              <div className="ts-grid-2">
                <div className="ts-field-group">
                  <label>Arrive Time</label>
                  <input type="time" name="arriveTime" value={formData.arriveTime} onChange={handleChange} required />
                </div>
                <div className="ts-field-group">
                  <label>Arrive City</label>
                  <input type="text" name="arriveCity" value={formData.arriveCity} onChange={handleChange} />
                </div>
              </div>
              <div className="ts-field-group">
                <label>Schedule Date</label>
                <input type="date" name="scheduleDate" value={formData.scheduleDate} onChange={handleChange} required />
              </div>
              <div className="ts-grid-2">
                <div className="ts-field-group">
                  <label>Class</label>
                  <select name="trainClass" value={formData.trainClass} onChange={handleChange}>
                    <option value="">Select class</option>
                    <option value="All">All Classes</option>
                    <option value="1st">1st Class</option>
                    <option value="2nd">2nd Class</option>
                    <option value="3rd">3rd Class</option>
                  </select>
                </div>
                <div className="ts-field-group">
                  <label>Availability</label>
                  <input
                    type="number"
                    name="availability"
                    min="0"
                    placeholder="Enter available train cars"
                    value={formData.availability}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="ts-field-group">
                <label>Class Details / Description</label>
                <input type="text" name="classDetails" value={formData.classDetails} onChange={handleChange} placeholder="e.g. AC compartments, reclining seats" />
              </div>
              <div className="ts-grid-2">
                <div className="ts-field-group">
                  <label>Status</label>
                  <input type="text" name="status" value={formData.status} onChange={handleChange} />
                </div>
                <div className="ts-field-group">
                  <label>Status Kind</label>
                  <select name="statusKind" value={formData.statusKind} onChange={handleChange}>
                    <option value="on">On Time</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="ts-actions-row">
                <button type="button" className="ts-secondary-btn" onClick={closeForm}>Cancel</button>
                <button type="submit" className="ts-primary-btn">{editingId ? 'Save Changes' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
