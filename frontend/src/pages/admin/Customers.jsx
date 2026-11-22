import { useEffect, useState } from "react";
import api from "../../api/axios";
import { errorMessage, fmtDate } from "../../utils/format";

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/admin/customers")
      .then((res) => setRows(res.data.customers))
      .catch(() => setError("Could not load customers."));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (c) => {
    setError("");
    try {
      await api.patch(`/admin/customers/${c.id}/active`, { is_active: !c.is_active });
    } catch (err) {
      setError(errorMessage(err));
    }
    load();
  };

  return (
    <div className="card">
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Joined</th>
              <th>Bookings</th>
              <th>Account</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.full_name}</td>
                <td>{c.email}</td>
                <td>{c.mobile_number}</td>
                <td>{fmtDate(c.created_at)}</td>
                <td>{c.bookings}</td>
                <td>
                  <button className={`btn btn-sm ${c.is_active ? "btn-danger" : ""}`} onClick={() => toggle(c)}>
                    {c.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted">No customers yet.</p>}
      </div>
    </div>
  );
}
