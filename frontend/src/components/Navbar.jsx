
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <img
          src="/images/logopaddlep.jpeg"
          alt="PADDLE POINT Logo"
          className="navbar-logo"
        />
    
      </Link>

      <div className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/courts">Courts</NavLink>
        <NavLink to="/book">Book a Court</NavLink>
        <NavLink to="/open-plays">Open Plays</NavLink>
        <NavLink to="/about">About</NavLink>

        {!user && (
          <>
            <NavLink to="/login">Login</NavLink>

            <Link to="/register" className="btn-small">
              Register
            </Link>

            <NavLink to="/admin/login">Admin Login</NavLink>
          </>
        )}

        {user?.role === "customer" && (
          <NavLink to="/dashboard">My Bookings</NavLink>
        )}

        {user?.role === "admin" && (
          <NavLink to="/admin">Admin</NavLink>
        )}

        {user && (
          <button className="btn-small" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
