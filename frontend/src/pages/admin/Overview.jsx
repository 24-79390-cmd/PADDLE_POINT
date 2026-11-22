import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => setError("Could not load statistics."));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!stats) return <p className="muted">Loading...</p>;

  const b = stats.bookings;
  const tiles = [
    ["Total bookings", b.total],
    ["Pending", b.pending],
    ["Confirmed", b.confirmed],
    ["Cancelled", b.cancelled],
    ["Completed", b.completed],
    ["Customers", stats.customers],
  ];

  return (
    <>
      <div className="grid-6">
        {tiles.map(([label, value]) => (
          <div className="tile" key={label}>
            <div className="tile-num">{value}</div>
            <div className="muted small">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Bookings by session date</h3>
          <p>
            Today: <strong>{stats.periods.today}</strong>
          </p>
          <p>
            This week: <strong>{stats.periods.week}</strong>
          </p>
          <p>
            This month: <strong>{stats.periods.month}</strong>
          </p>
          <p className="muted small">Counts pending, confirmed and completed bookings.</p>
        </div>

        <div className="card">
          <h3>Court utilization (last 30 days)</h3>
          {stats.utilization.map((u) => (
            <div key={u.court_name} className="util">
              <div className="row">
                <span>{u.court_name}</span>
                <span className="muted small">
                  {u.booked_hours} h · {u.percent}%
                </span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${Math.min(u.percent, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
