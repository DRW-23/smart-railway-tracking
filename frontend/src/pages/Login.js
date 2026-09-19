import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";
import "./Login.css";

const loginBg = process.env.PUBLIC_URL + "/assets/loginImage.jpg";

// Login component: authenticates user and stores session details in localStorage
export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Add body classes on mount, clean up on unmount
  useEffect(() => {
    document.body.classList.add("login-no-scroll", "login-page");
    return () => document.body.classList.remove("login-no-scroll", "login-page");
  }, []);

  // Simple form field state updater
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Normalize backend role variations
  const normalizeRole = (r) => {
    const s = (r || "").toString().toLowerCase();
    if (s.includes("train") || s.includes("master") || s === "trainmaster") return "trainmaster";
    return "passenger";
  };

  // Submit login form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await login(form);

      // Support both shapes: { user: {...} } or user fields at root
      const data = res?.data ?? {};
      const user = data.user ?? data;

      const role = normalizeRole(user.role);
      // persist session info used by route guards
      if (user.email) localStorage.setItem("email", user.email);
      if (user.id != null) localStorage.setItem("userId", String(user.id));
      localStorage.setItem("role", role);
      localStorage.setItem("loginTime", Date.now().toString());
      localStorage.setItem("userName", user.name || user.email?.split('@')[0] || 'User');

      // navigate by role
      navigate(role === "trainmaster" ? "/trainmaster-dashboard" : "/passenger-dashboard", { replace: true });
    } catch (err) {
      alert(err?.response?.data || "Invalid login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <section className="login-form-side">
        <div className="login-card">
          <h2>Welcome back!</h2>
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" placeholder="Enter your email" onChange={handleChange} required />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" placeholder="Enter your password" onChange={handleChange} required />
            <div className="forgot-row">
              <span />
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <p className="register-link">
              Don’t have an account? <Link to="/register">Sign up</Link>
            </p>
          </form>
        </div>
      </section>
      <aside className="login-visual-side">
        <img src={loginBg} alt="Railway background" />
      </aside>
    </div>
  );
}
