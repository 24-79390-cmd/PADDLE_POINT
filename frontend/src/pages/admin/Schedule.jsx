import { useEffect, useState } from "react";
import api from "../../api/axios";
import { CLOSE_HOUR, OPEN_HOUR } from "../../config";
import { errorMessage, fmtRange, hourLabel, todayPH } from "../../utils/format";

const startHours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
const endHours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i + 1);

export default function Schedule() {
  const [courts, setCourts] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [form, setForm] = useState({
    court_id: "",
    date: todayPH(),
    start_hour: OPEN_HOUR,
    end_hour: OPEN_HOUR + 1,
    reason: "",
  });
  const [error, setError] = useState("");

  const load = () => api.get("/admin/blocked").then((res) => setBlocked(res.data.blocked));

  useEffect(() => {
    api.get("/courts").then((res) => {
      setCourts(res.data.courts);
      setForm((f) => ({ ...f, court_id: res.data.courts[0]?.id || "" }));
    });
    load();
  }, []);

  const set = (name, value) => setForm({ ...form, [name]: value });

  const add = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/blocked", {
        ...form,
        court_id: Number(form.court_id),
        start_hour: Number(form.start_hour),
        end_hour: Number(form.end_hour),
      });
      set("reason", "");
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async (id) => {
    await api.delete(`/admin/blocked/${id}`);
    load();
  };

  return (
    <div className="grid-2">
      <form className="card form-grid" onSubmit={add}>
        <h3>Block a court (maintenance, private event)</h3>
        {error && <div className="error">{error}</div>}
        <label>
          Court
          <select value={form.court_id} onChange={(e) => set("court_id", e.target.value)}>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.court_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" min={todayPH()} value={form.date} onChange={(e) => set("date", e.target.value)} />
        </label>
        <label>
          From
          <select value={form.start_hour} onChange={(e) => set("start_hour", e.target.value)}>
            {startHours.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Until
          <select value={form.end_hour} onChange={(e) => set("end_hour", e.target.value)}>
            {endHours.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reason
          <input value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="e.g. Resurfacing" />
        </label>
        <button className="btn btn-sm">Block this time</button>
      </form>

      <div className="card">
        <h3>Upcoming blocked times</h3>
        {blocked.length === 0 && <p className="muted">Nothing blocked.</p>}
        {blocked.map((b) => (
          <div className="row list-row" key={b.id}>
            <div>
              <strong>{b.court_name}</strong>
              <br />
              <span className="small">{fmtRange(b.start_at, b.end_at)}</span>
              {b.reason && <div className="muted small">{b.reason}</div>}
            </div>
            <button className="btn btn-sm btn-danger" onClick={() => remove(b.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
