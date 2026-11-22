import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// The backend still enforces roles; this only controls what the UI shows.
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center-msg">Loading...</p>;

  if (!user) {
    return (
      <Navigate
        to={role === "admin" ? "/admin/login" : "/login"}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
