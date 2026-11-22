
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Overview from "./admin/Overview";
import Bookings from "./admin/Bookings";
import Courts from "./admin/Courts";
import Schedule from "./admin/Schedule";
import Customers from "./admin/Customers";
import AdminOpenPlays from "./admin/AdminOpenPlays";
import Reports from "./admin/Reports";

const TABS = [
  ["Overview", Overview],
  ["Bookings", Bookings],
  ["Courts", Courts],
  ["Schedule", Schedule],
  ["Customers", Customers],
  ["Open Plays", AdminOpenPlays],
  ["Reports", Reports],
  ["Profile", Profile],
];

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-profile-card">
      <div className="admin-profile-heading">
        <div>
          <span className="admin-section-eyebrow">ACCOUNT SETTINGS</span>
          <h2>Admin Profile</h2>
          <p>View your administrator account information.</p>
        </div>
      </div>

      <div className="admin-profile-info">
        <div className="admin-profile-avatar">
          {user?.full_name?.charAt(0)?.toUpperCase() || "A"}
        </div>

        <div className="admin-profile-details">
          <h3>{user.full_name}</h3>
          <p>{user.email}</p>
          <span className="admin-profile-badge">Administrator</span>
        </div>
      </div>

      <div className="admin-profile-divider"></div>

      <button
        className="admin-profile-logout"
        onClick={() => {
          logout();
          navigate("/admin/login");
        }}
      >
        Logout from account
        <span>→</span>
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");
  const Active = TABS.find(([name]) => name === tab)[1];

  return (
    <div className="page wide admin-dashboard-page">

      {/* DASHBOARD HEADER */}
      <div className="admin-dashboard-heading">
        <div className="admin-dashboard-heading-text">
          <span className="admin-dashboard-eyebrow">
            PADDLE POINT MANAGEMENT
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Manage bookings, courts, players, and facility operations.
          </p>
        </div>

        <div className="admin-dashboard-heading-badge">
          <span className="admin-dashboard-status-dot"></span>
          Management Portal
        </div>
      </div>

      {/* ADMIN NAVIGATION */}
      <div className="admin-dashboard-navigation">
        <div className="admin-dashboard-navigation-label">
          MANAGEMENT MENU
        </div>

        <div className="admin-dashboard-tabs">
          {TABS.map(([name]) => (
            <button
              key={name}
              className={`admin-dashboard-tab ${
                tab === name ? "active" : ""
              }`}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div className="admin-dashboard-content" key={tab}>
        <Active />
      </div>

    </div>
  );
}
