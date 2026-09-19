import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestOtp, registerWithOtp } from "../services/api";
import "./Register.css";

// Use the image from public/assets
const signupBg = process.env.PUBLIC_URL + "/assets/signImage.jpg"; // adjust extension if needed

// Register component: two-step email OTP registration flow
export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    type: "Passenger", // changed from "Customer" to "Passenger"
    contact: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = collect info & send OTP, 2 = verify & register
  const [otp, setOtp] = useState("");
  const [otpSentEmail, setOtpSentEmail] = useState(null);
  const navigate = useNavigate();

  // Prevent page scroll while on register route
  // Lock body scroll while on register page
  useEffect(() => {
    document.body.classList.add("register-no-scroll", "register-page");
    return () => document.body.classList.remove("register-no-scroll", "register-page");
  }, []);

  // Generic field change handler
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Step 1 submit: request OTP email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!form.email) { alert("Email required"); return; }
    try {
      setLoading(true);
      await requestOtp(form.email);
      setOtpSentEmail(form.email);
      setStep(2);
      alert("OTP sent to your email. Please check your inbox (and spam folder).");
    } catch (err) {
      if (err.response && err.response.status === 409) {
        alert("Email already registered");
      } else {
        alert("Failed to send OTP");
      }
    } finally { setLoading(false); }
  };

  // Step 2 submit: finalize registration with OTP
  const handleRegisterWithOtp = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    if (!otp) { alert("Enter OTP"); return; }
    try {
      setLoading(true);
      const payload = { ...form, otp, type: form.type };
      const res = await registerWithOtp(payload);
      if (res.status === 201 || res.status === 200) {
        alert("Registration successful. You can now log in.");
        navigate('/login');
      } else {
        alert("Unexpected response");
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert("Invalid or expired OTP");
      } else {
        alert("Registration failed");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="register-container">
      {/* Left Side - Image only */}
      <aside className="register-visual-side">
        <img src={signupBg} alt="Railway signup background" />
      </aside>

      {/* Right Side - Form */}
      <section className="register-form-side">
        <div className="register-card">
          <h2>Create Account</h2>

          <form onSubmit={step === 1 ? handleRequestOtp : handleRegisterWithOtp} className="register-form">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Enter your name"
              onChange={handleChange}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required
            />

            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              onChange={handleChange}
              value={form.type}
              required
            >
              <option value="Passenger">Passenger</option>  {/* changed from Customer */}
              <option value="TrainMaster">Train Master</option>
            </select>

            <label htmlFor="contact">Contact</label>
            <input
              id="contact"
              type="tel"
              name="contact"
              placeholder="Enter phone number"
              onChange={handleChange}
              required
            />

            {step === 2 && (
              <>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a password"
              onChange={handleChange}
              required
            />

            <label htmlFor="confirmPassword">Re-enter password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              onChange={handleChange}
              required
            />
            <label htmlFor="otp">OTP Code</label>
            <input
              id="otp"
              type="text"
              name="otp"
              placeholder="Enter the OTP sent to your email"
              value={otp}
              onChange={(e)=>setOtp(e.target.value)}
              required
            />
              </>
            )}

            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? (step === 1 ? 'Sending...' : 'Submitting...') : (step === 1 ? 'Send OTP' : 'Complete Registration')}
            </button>
            {step === 2 && otpSentEmail && (
              <p style={{fontSize:'0.8rem', color:'#555'}}>OTP sent to: {otpSentEmail}</p>
            )}

            <p className="login-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
