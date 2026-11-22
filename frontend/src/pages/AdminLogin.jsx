
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/auth/admin/login", form);
      login(res.data.token, res.data.user);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pp-admin-login-page">

      <div className="pp-admin-login-container">

        {/* LEFT BRAND PANEL */}
        <div className="pp-admin-brand-panel">
          <div className="pp-admin-brand">
            <span>PADDLE POINT</span>
          </div>

          <div className="pp-admin-brand-content">
            <span className="pp-admin-brand-eyebrow">
              MANAGEMENT PORTAL
            </span>

            <h1>
              Manage the game.
              <br />
              <span>Keep it moving.</span>
            </h1>

            <p>
              Welcome to the PADDLE POINT administration portal.
              Manage bookings, courts, players, and daily operations
              in one place.
            </p>
          </div>

          <div className="pp-admin-brand-graphic">
            <div className="pp-admin-graphic-court">
              <div className="pp-admin-graphic-center"></div>
              <div className="pp-admin-graphic-net"></div>
              <div className="pp-admin-graphic-ball"></div>
            </div>
          </div>

          <div className="pp-admin-brand-footer">
            <span className="pp-admin-brand-footer-dot"></span>
            PADDLE POINT · BALAYAN, BATANGAS
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="pp-admin-form-panel">

          <div className="pp-admin-form-content">

            <div className="pp-admin-mobile-brand">
              PADDLE POINT
            </div>

            <div className="pp-admin-form-heading">
              <span className="pp-admin-form-eyebrow">
                ADMINISTRATOR ACCESS
              </span>

              <h2>Welcome back</h2>

              <p>
                Sign in to access your administration dashboard.
              </p>
            </div>

            {error && <div className="error">{error}</div>}

            <form className="pp-admin-login-form" onSubmit={onSubmit}>
              <div className="pp-admin-input-group">
                <label htmlFor="admin-email">Email address</label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  placeholder="Enter your admin email"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="pp-admin-input-group">
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={onChange}
                  required
                />
              </div>

              <button
                className="pp-admin-submit-button"
                type="submit"
                disabled={busy}
              >
                {busy ? "Signing in..." : "Sign in to dashboard"}
                {!busy && <span>→</span>}
              </button>
            </form>

            <div className="pp-admin-login-security">

              <p>Authorized administrator access only.</p>
            </div>

          </div>

          <div className="pp-admin-form-footer">
            <span>© PADDLE POINT</span>
            <span>ADMIN PORTAL</span>
          </div>

        </div>

      </div>

    </div>
  );
}
