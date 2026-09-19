import React, { useEffect, useState } from "react";
import "./AddItem.css";
import { createLostItem } from "../services/api";

// AddItem modal component: submit a new lost item with optional image
export default function AddItem({ onClose, onSaved }) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [lostDate, setLostDate] = useState("");
  const [phone, setPhone] = useState("");
  const [trainNumber, setTrainNumber] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Collect identity from storage
  // Try to derive passenger identity (email/id) from storage
  const getIdentity = () => {
    const email = localStorage.getItem('email');
    const id = localStorage.getItem('userId') || localStorage.getItem('passengerId');
    // try nested objects too
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        email: email || user?.email || null,
        id: id || user?.id || user?.userId || user?.passengerId || null
      };
    } catch {
      return { email: email || null, id: id || null };
    }
  };

  // Handle file select + create preview URL
  const onImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Submit lost item form to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic front-end validation for required train number (backend has NOT NULL constraint)
    if(!trainNumber.trim()){
      alert('Please enter the Train Number (required).');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('itemName', itemName);
      fd.append('description', description);
      fd.append('location', location);

      // Convert date to YYYY-MM-DD format if needed
      let isoDate = lostDate;
      if (lostDate && lostDate.includes('/')) {
        const [dd, mm, yyyy] = lostDate.split('/');
        isoDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }
      fd.append('lostDate', isoDate);

      // Backend expects 'phone' parameter name
      fd.append('phone', phone);
      
  // Backend column train_number is NOT NULL -> always send a value
  fd.append('trainNumber', trainNumber.trim());
      if (image) fd.append('image', image);

      const idt = getIdentity();
      if (idt.email) {
        fd.append('passengerEmail', idt.email);
      } else if (idt.id) {
        fd.append('passengerId', String(idt.id));
      } else {
        const shouldLogin = window.confirm('You need to log in first to submit items. Go to login page?');
        if (shouldLogin) window.location.href = '/login';
        return;
      }

      // Debug: log what we're sending
      console.log('Sending form data:');
      for (const [k, v] of fd.entries()) {
        console.log(`${k}:`, v);
      }

      const res = await createLostItem(fd);
      // Treat any 2xx response as success and prefer API's success flag/message
      const ok = res.status >= 200 && res.status < 300;
      const succeeded = ok && (res.data?.success !== false);
      if (succeeded) {
        // Show server message when available
        if (res.data?.message) console.log(res.data.message);
        onSaved?.();
      } else {
        const msg =
          (typeof res.data === 'string' ? res.data : res.data?.error || res.data?.message) ||
          'Failed to add item';
        alert(msg);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert(err?.response?.data || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lf-modal-overlay" onClick={onClose}>
      <div className="lf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lf-modal-header">
          <h2>Add Item</h2>
          <button className="lf-close" onClick={onClose}>×</button>
        </div>

        <form className="lf-modal-content" onSubmit={handleSubmit}>
          <label>Item Name
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} required />
          </label>

          <label>Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </label>

          <div className="lf-row">
            <label>Location
              <input value={location} onChange={(e) => setLocation(e.target.value)} required />
            </label>
            <label>Lost Date
              <input type="date" value={lostDate} onChange={(e) => setLostDate(e.target.value)} required />
            </label>
          </div>

          <div className="lf-row">
            <label>Mobile
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
            <label>Train Number
              <input value={trainNumber} onChange={(e) => setTrainNumber(e.target.value)} required pattern="[0-9A-Za-z-]+" title="Train number (letters, numbers, dashes)" />
            </label>
          </div>

          {/* SINGLE upload box */}
          <div className={`lf-upload-box ${preview ? 'has-preview' : ''}`}>
            {!preview ? (
              <div className="lf-upload-prompt">
                <span>Drag files to upload</span>
                <button type="button" className="lf-upload-btn">Upload</button>
              </div>
            ) : (
              <img className="lf-upload-img" src={preview} alt="Preview" />
            )}
            <input
              className="lf-file-input"
              type="file"
              accept="image/*"
              onChange={onImageChange}
              title=""
            />
          </div>

          <div className="lf-modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}