import { useEffect, useState } from "react";
import api from "../api/axios";
import CourtCard from "../components/CourtCard";

export default function Courts() {
  const [courts, setCourts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/courts")
      .then((res) => setCourts(res.data.courts))
      .catch(() => setError("Could not load courts. Is the backend running?"));
  }, []);

  return (
    <div className="page wide">
      <h1>Our Courts</h1>
      <p className="muted">Compare the three courts at PADDLE POINT and pick one to book.</p>
      {error && <div className="error">{error}</div>}
      <div className="grid-3">
        {courts.map((c) => (
          <CourtCard key={c.id} court={c} />
        ))}
      </div>
    </div>
  );
}
