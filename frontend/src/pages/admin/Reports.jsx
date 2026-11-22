import { useEffect, useState } from "react";
import api from "../../api/axios";
import { peso } from "../../utils/format";

const LABEL = { daily: "Day", weekly: "Week starting", monthly: "Month starting" };

export default function Reports() {
  const [period, setPeriod] = useState("daily");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api
      .get("/admin/reports", { params: { period } })
      .then((res) => setRows(res.data.rows))
      .catch(() => setError("Could not load the report."));
  }, [period]);

  return (
    <div className="card">
      <div className="toolbar">
        {["daily", "weekly", "monthly"].map((p) => (
          <button key={p} className={`chip ${period === p ? "on" : ""}`} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{LABEL[period]}</th>
              <th>Total</th>
              <th>Pending</th>
              <th>Confirmed</th>
              <th>Completed</th>
              <th>Cancelled / rejected</th>
              <th>Expected amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.period}>
                <td>{r.period}</td>
                <td>{r.total}</td>
                <td>{r.pending}</td>
                <td>{r.confirmed}</td>
                <td>{r.completed}</td>
                <td>{r.cancelled}</td>
                <td>{peso(r.expected_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted">No bookings yet.</p>}
      </div>
      <p className="muted small">
        "Expected amount" is the total of confirmed and completed bookings. It is not proof of payment, because
        customers pay at the facility.
      </p>
    </div>
  );
}
