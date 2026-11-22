import { useEffect, useState } from "react";
import api from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";
import { errorMessage, fmtRange, peso } from "../../utils/format";

const ACTIONS = {
  pending: [
    ["confirmed", "Confirm", "btn-sm"],
    ["rejected", "Reject", "btn-sm btn-danger"],
    ["cancelled", "Cancel", "btn-sm btn-danger"],
  ],
  confirmed: [
    ["completed", "Complete", "btn-sm"],
    ["cancelled", "Cancel", "btn-sm btn-danger"],
  ],
};

export default function Bookings() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/admin/bookings", { params: { status: status || undefined, q: q || undefined } })
      .then((res) => setRows(res.data.bookings))
      .catch(() => setError("Could not load bookings."));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const change = async (b, next) => {
    setError("");
    try {
      await api.patch(`/admin/bookings/${b.id}/status`, { status: next });
    } catch (err) {
      setError(errorMessage(err));
    }
    load();
  };

  return (
    <div className="card">
      <div className="toolbar">
        <input
          placeholder="Search code, name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button className="btn btn-sm" onClick={load}>
          Search
        </button>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["pending", "confirmed", "rejected", "cancelled", "completed"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer</th>
              <th>Court</th>
              <th>When</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.booking_code}</strong>
                </td>
                <td>
                  {b.full_name}
                  <br />
                  <span className="muted small">
                    {b.mobile_number} · {b.email}
                  </span>
                </td>
                <td>{b.court_name}</td>
                <td>{fmtRange(b.start_at, b.end_at)}</td>
                <td>{peso(b.total_amount)}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td className="actions">
                  {(ACTIONS[b.status] || []).map(([next, label, cls]) => (
                    <button key={next} className={`btn ${cls}`} onClick={() => change(b, next)}>
                      {label}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted">No bookings found.</p>}
      </div>
    </div>
  );
}
