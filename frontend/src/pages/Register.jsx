import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await api.post("/auth/register", form);
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">

        {/* LEFT BRAND PANEL */}
        <div className="register-brand-panel">
          <div className="register-brand-content">
            <img
              src="/images/logopaddlep.jpeg"
              alt="Paddle Point Logo"
              className="register-brand-logo"
            />

            <span className="register-brand-label">
              WELCOME TO PADDLE POINT
            </span>

            <h1>
              Your game.
              <br />
              Your court.
              <br />
              <span>Your community.</span>
            </h1>

            <p className="register-brand-description">
              Create your account and get ready to book courts,
              join open plays, and enjoy the game with the
              Paddle Point community.
            </p>

            <div className="register-brand-divider"></div>

            <div className="register-brand-bottom">
              <span className="register-brand-dot"></span>
              PLAY. RALLY. CONNECT.
            </div>
          </div>

          <div className="register-brand-decoration">
            PP
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="register-form-panel">
          <div className="register-form-card">

            <div className="register-form-heading">
              <span className="register-form-eyebrow">
                JOIN THE COMMUNITY
              </span>

              <h2>Create your account</h2>

              <p>
                Fill in your details below to get started.
              </p>
            </div>

            {error && (
              <div className="register-error">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="register-form">

              <label>
                Full name
                <input
                  name="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.full_name}
                  onChange={onChange}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Mobile number
                <input
                  name="mobile_number"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={form.mobile_number}
                  onChange={onChange}
                  autoComplete="tel"
                  required
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={onChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                Confirm password
                <input
                  name="confirm_password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirm_password}
                  onChange={onChange}
                  autoComplete="new-password"
                  required
                />
              </label>

              <button
                className="register-submit-btn"
                type="submit"
                disabled={busy}
              >
                {busy ? "Creating your account..." : "Create Account"}
              </button>

            </form>

            <div className="register-login-prompt">
              Already have an account?
              <Link to="/login">Log in</Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}