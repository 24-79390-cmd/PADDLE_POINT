
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import { errorMessage, fmtDate, fmtRange, fmtTime, peso } from "../utils/format";

export default function CustomerDashboard() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [plays, setPlays] = useState([]);
  const [cancelHours, setCancelHours] = useState(2);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError("");

    try {
      const res = await api.get("/bookings/mine");
      setBookings(res.data.bookings || []);
      setCancelHours(res.data.cancel_before_hours ?? 2);
    } catch (err) {
      setError(errorMessage(err) || "Could not load your bookings.");
    } finally {
      setLoading(false);
    }

    try {
      const res = await api.get("/open-plays/mine");
      setPlays(res.data.open_plays || []);
    } catch {
      setPlays([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancelBooking = async (b) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${b.booking_code}?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.patch(`/bookings/${b.id}/cancel`);
      setSuccess(`Booking ${b.booking_code} has been cancelled.`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const leavePlay = async (p) => {
    if (!window.confirm(`Are you sure you want to leave "${p.title}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(`/open-plays/${p.id}/join`);
      setSuccess(`You have left "${p.title}".`);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const now = Date.now();

  const upcoming = bookings.filter(
    (b) =>
      ["pending", "confirmed"].includes(b.status) &&
      new Date(b.end_at).getTime() > now
  );

  const history = bookings.filter((b) => !upcoming.includes(b));

  const BookingRow = ({ b }) => (
    <tr>
      <td>
        <strong className="booking-code">{b.booking_code}</strong>
      </td>
      <td>{b.court_name}</td>
      <td>
        <div className="booking-date">{fmtRange(b.start_at, b.end_at)}</div>
      </td>
      <td className="booking-total">{peso(b.total_amount)}</td>
      <td>
        <StatusBadge status={b.status} />
      </td>
      <td className="booking-action">
        {b.can_cancel && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => cancelBooking(b)}
          >
            Cancel
          </button>
        )}
      </td>
    </tr>
  );

  const bookingHead = (
    <thead>
      <tr>
        <th>Booking Code</th>
        <th>Court</th>
        <th>Date & Time</th>
        <th>Total</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
  );

  return (
    <div className="page wide customer-dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">PLAYER DASHBOARD</span>
          <h1>Welcome back, {user?.full_name || "Player"}!</h1>
          <p className="muted">
            Manage your bookings and keep track of your pickleball sessions.
          </p>
        </div>

        <Link to="/book" className="btn dashboard-book-btn">
          + Book a Court
        </Link>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="dashboard-success">{success}</div>}

      {/* SUMMARY CARDS */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div>
            <span className="dashboard-stat-label">Upcoming Bookings</span>
            <strong>{upcoming.length}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div>
            <span className="dashboard-stat-label">Open Play Sessions</span>
            <strong>{plays.length}</strong>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div>
            <span className="dashboard-stat-label">Booking History</span>
            <strong>{history.length}</strong>
          </div>
        </div>
      </div>

      {/* PROFILE */}
      <div className="dashboard-profile card">
        <div className="dashboard-profile-info">
          <h3>{user?.full_name || "Customer Profile"}</h3>
          <p>
            {user?.email || "No email available"}
            {user?.mobile_number ? ` · ${user.mobile_number}` : ""}
          </p>
        </div>
      </div>

      {/* UPCOMING BOOKINGS */}
      <section className="dashboard-section card">
        <div className="dashboard-section-header">
          <div>
            <span className="dashboard-eyebrow">YOUR SCHEDULE</span>
            <h2>Upcoming Bookings</h2>
          </div>
          <Link to="/book" className="dashboard-section-link">
            Book another →
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-empty">
            <p>Loading your bookings...</p>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No upcoming bookings</h3>
            <p>Ready for your next game? Book a court and get playing!</p>
            <Link to="/book" className="btn">
              Book a Court
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              {bookingHead}
              <tbody>
                {upcoming.map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="dashboard-note">
          Bookings can be cancelled until {cancelHours} hours before the start
          time. Payment is made at the facility.
        </p>
      </section>

      {/* OPEN PLAY */}
      <section className="dashboard-section card">
        <div className="dashboard-section-header">
          <div>
            <span className="dashboard-eyebrow">PLAY WITH OTHERS</span>
            <h2>My Open Play Sessions</h2>
          </div>
          <Link to="/open-plays" className="dashboard-section-link">
            Browse sessions →
          </Link>
        </div>

        {plays.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No Open Play registrations</h3>
            <p>Join an open play session and meet other players.</p>
            <Link to="/open-plays" className="btn">
              Explore Open Plays
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date & Time</th>
                  <th>Court</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {plays.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong>
                    </td>
                    <td>
                      {fmtDate(p.start_at)} · {fmtTime(p.start_at)}
                    </td>
                    <td>{p.court_name}</td>
                    <td>
                      <StatusBadge
                        status={
                          p.status === "open" || p.status === "full"
                            ? "confirmed"
                            : p.status
                        }
                      />
                    </td>
                    <td className="booking-action">
                      {["open", "full"].includes(p.status) &&
                        new Date(p.start_at) > new Date() && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => leavePlay(p)}
                          >
                            Leave
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* BOOKING HISTORY */}
      <section className="dashboard-section card">
        <div className="dashboard-section-header">
          <div>
            <span className="dashboard-eyebrow">PAST ACTIVITY</span>
            <h2>Booking History</h2>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-empty">
            <p>Loading booking history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No booking history yet</h3>
            <p>Your completed or cancelled bookings will appear here.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              {bookingHead}
              <tbody>
                {history.map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
