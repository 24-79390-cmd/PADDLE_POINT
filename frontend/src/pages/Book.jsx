import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { MAX_DURATION } from "../config";
import { errorMessage, fmtRange, hourLabel, peso, todayPH } from "../utils/format";

export default function Book() {
  const { user } = useAuth();
  const [params] = useSearchParams();

  const [courts, setCourts] = useState([]);
  const [courtId, setCourtId] = useState(Number(params.get("court")) || null);
  const [date, setDate] = useState(todayPH());
  const [slots, setSlots] = useState([]);
  const [startHour, setStartHour] = useState(null);
  const [duration, setDuration] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Load the three courts
  useEffect(() => {
    api
      .get("/courts")
      .then((res) => {
        setCourts(res.data.courts);
        setCourtId((current) => current || res.data.courts.find((c) => c.is_available)?.id || null);
      })
      .catch(() => setError("Could not load courts."));
  }, []);

  const loadSlots = () => {
    if (!courtId || !date) return;
    api
      .get(`/courts/${courtId}/availability`, { params: { date } })
      .then((res) => setSlots(res.data.slots))
      .catch((err) => setError(errorMessage(err, "Could not check availability.")));
  };

  // Re-check availability whenever court or date changes
  useEffect(() => {
    setStartHour(null);
    setDuration(1);
    setSlots([]);
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId, date]);

  const court = courts.find((c) => c.id === courtId);

  // How many consecutive free hours start at the chosen time?
  const maxDuration = (() => {
    if (startHour === null) return 1;
    let n = 0;
    while (n < MAX_DURATION && slots.find((s) => s.hour === startHour + n)?.available) n++;
    return Math.max(n, 1);
  })();

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/bookings", {
        court_id: courtId,
        date,
        start_hour: startHour,
        duration,
      });
      setConfirmation(res.data.booking);
    } catch (err) {
      setError(errorMessage(err, "Could not submit your booking."));
      loadSlots(); // the slot may have just been taken
      setStartHour(null);
    } finally {
      setBusy(false);
    }
  };

  // ---- Confirmation screen ----
  if (confirmation) {
    return (
      <div className="page">
        <div className="card confirm">
          <h1>Booking submitted ✔</h1>
          <p className="muted">Your reference code</p>
          <div className="code">{confirmation.booking_code}</div>
          <p>
            <strong>{confirmation.court_name}</strong>
            <br />
            {fmtRange(confirmation.start_at, confirmation.end_at)}
            <br />
            Total: {peso(confirmation.total_amount)}
          </p>
          <p>
            Status: <span className="badge s-pending">pending</span> — PADDLE POINT will confirm
            your reservation.
          </p>
          <div className="notice">
            Payment will be handled directly at the PADDLE POINT facility. Please settle your
            booking fee at the venue.
          </div>
          <div className="row-gap">
            <Link className="btn" to="/dashboard">
              View my bookings
            </Link>
            <button className="btn btn-ghost-dark" onClick={() => window.location.reload()}>
              Book another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const endHour = startHour === null ? null : startHour + duration;

  return (
    <div className="page">
      <h1>Book a Court</h1>
      <p className="muted">Booking as {user.full_name}</p>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>1. Choose a court</h3>
        <div className="chips">
          {courts.map((c) => (
            <button
              key={c.id}
              className={`chip ${courtId === c.id ? "on" : ""}`}
              disabled={!c.is_available}
              onClick={() => setCourtId(c.id)}
            >
              {c.court_name} · {peso(c.price_per_hour)}/hr
              {!c.is_available && " (unavailable)"}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>2. Choose a date</h3>
        <input type="date" value={date} min={todayPH()} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="card">
        <h3>3. Choose a start time</h3>
        <div className="slots">
          {slots.map((s) => (
            <button
              key={s.hour}
              disabled={!s.available}
              className={`slot ${startHour === s.hour ? "on" : ""}`}
              onClick={() => {
                setStartHour(s.hour);
                setDuration(1);
              }}
            >
              {hourLabel(s.hour)}
            </button>
          ))}
        </div>
        <p className="muted small">Greyed-out times are already booked, blocked, or in the past.</p>
      </div>

      {startHour !== null && (
        <div className="card">
          <h3>4. How long?</h3>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {Array.from({ length: maxDuration }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {h} hour{h > 1 ? "s" : ""}
              </option>
            ))}
          </select>

          <div className="summary">
            <p>
              <strong>{court?.court_name}</strong> on {date}
              <br />
              {hourLabel(startHour)} – {hourLabel(endHour)}
            </p>
            <p className="total">Total: {peso(Number(court?.price_per_hour || 0) * duration)}</p>
          </div>
          <div className="notice">
            Payment will be handled directly at the PADDLE POINT facility. Please settle your
            booking fee at the venue.
          </div>
          <button className="btn" onClick={submit} disabled={busy}>
            {busy ? "Submitting..." : "Submit reservation"}
          </button>
        </div>
      )}
    </div>
  );
}
