import { useEffect, useState } from "react";
import api from "../../api/axios";
import { errorMessage } from "../../utils/format";

function CourtForm({ court, onSaved }) {
  const [form, setForm] = useState({
    description: court.description || "",
    court_type: court.court_type || "Outdoor",
    price_per_hour: court.price_per_hour,
    image_url: court.image_url || "",
    is_available: court.is_available,
  });
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const set = (name, value) => setForm({ ...form, [name]: value });

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.put(`/admin/courts/${court.id}`, { ...form, price_per_hour: Number(form.price_per_hour) });
      setIsError(false);
      setMsg("Saved.");
      onSaved();
    } catch (err) {
      setIsError(true);
      setMsg(errorMessage(err));
    }
  };

  return (
    <form className="card form-grid" onSubmit={save}>
      <h3>{court.court_name}</h3>
      <label>
        Description
        <textarea rows="2" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </label>
      <label>
        Type
        <select value={form.court_type} onChange={(e) => set("court_type", e.target.value)}>
          <option>Outdoor</option>
          <option>Indoor</option>
        </select>
      </label>
      <label>
        Price per hour (₱)
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.price_per_hour}
          onChange={(e) => set("price_per_hour", e.target.value)}
        />
      </label>
      <label>
        Image URL (optional)
        <input value={form.image_url} placeholder="https://..." onChange={(e) => set("image_url", e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" checked={form.is_available} onChange={(e) => set("is_available", e.target.checked)} />
        Available for booking
      </label>
      <div className="row-gap">
        <button className="btn btn-sm">Save</button>
        {msg && <span className={isError ? "err-text" : "ok-text"}>{msg}</span>}
      </div>
    </form>
  );
}

export default function Courts() {
  const [courts, setCourts] = useState([]);

  const load = () => api.get("/courts").then((res) => setCourts(res.data.courts));
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid-3">
      {courts.map((c) => (
        <CourtForm key={c.id + "-" + c.price_per_hour + c.is_available} court={c} onSaved={load} />
      ))}
    </div>
  );
}
