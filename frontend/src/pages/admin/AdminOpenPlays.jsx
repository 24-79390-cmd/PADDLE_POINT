import { useEffect, useState } from "react";
import api from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";
import { CLOSE_HOUR, OPEN_HOUR, SKILL_LEVELS } from "../../config";
import { errorMessage, fmtRange, hourLabel, phParts, todayPH } from "../../utils/format";

const startHours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
const endHours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i + 1);

const EMPTY = {
  title: "",
  description: "",
  court_id: "",
  date: todayPH(),
  start_hour: 18,
  end_hour: 20,
  skill_level: "All Levels",
  max_players: 12,
};

export default function AdminOpenPlays() {
  const [courts, setCourts] = useState([]);
  const [plays, setPlays] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.get("/admin/open-plays").then((res) => setPlays(res.data.open_plays));

  useEffect(() => {
    api.get("/courts").then((res) => {
      setCourts(res.data.courts);
      setForm((f) => ({ ...f, court_id: res.data.courts[0]?.id || "" }));
    });
    load();
  }, []);

  const set = (name, value) => setForm({ ...form, [name]: value });

  const reset = () => {
    setEditingId(null);
    setForm({ ...EMPTY, court_id: courts[0]?.id || "" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const body = {
      ...form,
      court_id: Number(form.court_id),
      start_hour: Number(form.start_hour),
      end_hour: Number(form.end_hour),
      max_players: Number(form.max_players),
    };
    try {
      if (editingId) await api.put(`/admin/open-plays/${editingId}`, body);
      else await api.post("/admin/open-plays", body);
      reset();
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const edit = (p) => {
    const s = phParts(p.start_at);
    const e = phParts(p.end_at);
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description || "",
      court_id: p.court_id,
      date: s.date,
      start_hour: s.hour,
      end_hour: e.hour,
      skill_level: p.skill_level,
      max_players: p.max_players,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = async (p) => {
    if (!window.confirm(`Cancel "${p.title}"?`)) return;
    setError("");
    try {
      await api.patch(`/admin/open-plays/${p.id}/cancel`);
    } catch (err) {
      setError(errorMessage(err));
    }
    load();
  };

  return (
    <>
      <form className="card form-grid" onSubmit={submit}>
        <h3>{editingId ? "Edit Open Play" : "Create Open Play"}</h3>
        {error && <div className="error">{error}</div>}
        <label>
          Session name
          <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label>
          Description
          <textarea rows="2" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>
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
          Start
          <select value={form.start_hour} onChange={(e) => set("start_hour", e.target.value)}>
            {startHours.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </label>
        <label>
          End
          <select value={form.end_hour} onChange={(e) => set("end_hour", e.target.value)}>
            {endHours.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Skill level
          <select value={form.skill_level} onChange={(e) => set("skill_level", e.target.value)}>
            {SKILL_LEVELS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Max players
          <input type="number" min="2" max="40" value={form.max_players} onChange={(e) => set("max_players", e.target.value)} />
        </label>
        <div className="row-gap">
          <button className="btn btn-sm">{editingId ? "Save changes" : "Create session"}</button>
          {editingId && (
            <button type="button" className="btn btn-sm btn-ghost-dark" onClick={reset}>
              Stop editing
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3>All sessions</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>When</th>
                <th>Court</th>
                <th>Players</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plays.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.title}
                    <br />
                    <span className="muted small">{p.skill_level}</span>
                  </td>
                  <td>{fmtRange(p.start_at, p.end_at)}</td>
                  <td>{p.court_name}</td>
                  <td>
                    {p.registered} / {p.max_players}
                  </td>
                  <td>
                    <StatusBadge status={p.status === "open" || p.status === "full" ? "confirmed" : p.status} />
                    {p.status === "full" && <span className="muted small"> full</span>}
                  </td>
                  <td className="actions">
                    {["open", "full"].includes(p.status) && (
                      <>
                        <button className="btn btn-sm" onClick={() => edit(p)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => cancel(p)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plays.length === 0 && <p className="muted">No sessions yet.</p>}
        </div>
      </div>
    </>
  );
}
