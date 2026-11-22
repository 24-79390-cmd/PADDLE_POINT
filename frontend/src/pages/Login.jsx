
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.user);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Is the backend running?"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* LEFT SIDE - BRANDING */}
        <section className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-brand-logo">
              <span className="logo-icon">P</span>
              <span className="logo-name">PADDLE POINT</span>
            </div>

            <div className="login-brand-text">
              <span className="login-eyebrow">YOUR GAME. YOUR COURT.</span>

              <h1>
                Play your game.
                <br />
                <span>Own your moment.</span>
              </h1>

              <p>
                Your next match starts here. Book your court, find your people,
                and experience the game at Paddle Point.
              </p>
            </div>

            <div className="login-brand-bottom">
              <div className="brand-line" />
              <span>PLAY • CONNECT • COMPETE</span>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE - LOGIN FORM */}
        <section className="login-form-panel">
          <div className="login-form-content">

            <div className="login-mobile-brand">
              <span className="logo-icon">P</span>
              <span className="logo-name">PADDLE POINT</span>
            </div>

            <div className="login-heading">
              <span className="login-eyebrow">WELCOME BACK</span>
              <h2>Log in to your account</h2>
              <p>Enter your details to get back in the game.</p>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <form className="login-form" onSubmit={onSubmit}>
              <div className="login-input-group">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={onChange}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button className="login-submit-btn" type="submit" disabled={busy}>
                {busy ? "Signing in..." : "Log in"}
                {!busy && <span className="login-btn-arrow">→</span>}
              </button>
            </form>

            <div className="login-register-link">
              <span>Don't have an account?</span>
              <Link to="/register">Create an account</Link>
            </div>

            <div className="login-form-footer">
              <span>© PADDLE POINT</span>
              <span>PLAY YOUR WAY.</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
