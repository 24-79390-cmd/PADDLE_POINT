
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { errorMessage, fmtDate, fmtTime } from "../utils/format";

export default function OpenPlays() {
  const { user } = useAuth();
  const [plays, setPlays] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    api
      .get("/open-plays")
      .then((res) => setPlays(res.data.open_plays))
      .catch(() => setError("Could not load Open Plays."));

  useEffect(() => {
    load();
  }, [user]);

  const act = async (play, joining) => {
    setError("");
    setBusyId(play.id);
    try {
      if (joining) await api.post(`/open-plays/${play.id}/join`);
      else await api.delete(`/open-plays/${play.id}/join`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
      load();
    }
  };

  return (
    <div className="page wide pp-openplays-page">

      {/* HERO */}
      <section className="pp-openplays-hero">
        <div className="pp-openplays-hero-content">
          <span className="pp-openplays-eyebrow">PLAY TOGETHER</span>

          <h1>
            Meet players.
            <br />
            <span>Enjoy the game.</span>
          </h1>

          <p>
            Join an Open Play session, meet fellow pickleball players,
            and enjoy the game in a fun and welcoming environment.
          </p>

          <div className="pp-openplays-hero-tag">
            <span className="pp-openplays-live-dot"></span>
            FIND YOUR NEXT GAME
          </div>
        </div>

        <div className="pp-openplays-hero-visual">
          <div className="pp-openplays-graphic">
            <span className="pp-openplays-graphic-ball">●</span>
            <span className="pp-openplays-graphic-text">OPEN PLAY</span>
          </div>
        </div>
      </section>

      {/* SESSION HEADER */}
      <section className="pp-openplays-section">
        <div className="pp-openplays-heading">
          <div>
            <span className="pp-openplays-section-label">YOUR NEXT GAME</span>
            <h2>Available Sessions</h2>
            <p>Choose a session and join the fun.</p>
          </div>

          <div className="pp-openplays-count">
            <span>{plays.length}</span>
            <div>
              <strong>Sessions</strong>
              <small>available on the list</small>
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* EMPTY STATE */}
        {plays.length === 0 && (
          <div className="pp-openplays-empty">
            <h3>No upcoming sessions</h3>
            <p>
              There are no Open Play sessions available right now.
              Check back soon for upcoming games!
            </p>
          </div>
        )}

        {/* SESSION CARDS */}
        <div className="pp-openplays-grid">
          {plays.map((p) => (
            <article className="pp-openplays-card" key={p.id}>

              <div className="pp-openplays-card-top">
                <span className="pp-openplays-skill-badge">
                  {p.skill_level}
                </span>
              </div>

              <h3>{p.title}</h3>

              <div className="pp-openplays-date">
                <div>
                  <span>SESSION DATE</span>
                  <strong>{fmtDate(p.start_at)}</strong>
                </div>
              </div>

              <div className="pp-openplays-details">
                <div className="pp-openplays-detail-item">
                  <div>
                    <small>TIME</small>
                    <strong>
                      {fmtTime(p.start_at)} – {fmtTime(p.end_at)}
                    </strong>
                  </div>
                </div>

                <div className="pp-openplays-detail-item">
                  <div>
                    <small>COURT</small>
                    <strong>{p.court_name}</strong>
                  </div>
                </div>
              </div>

              {p.description && (
                <p className="pp-openplays-description">
                  {p.description}
                </p>
              )}

              {/* PLAYER CAPACITY */}
              <div className="pp-openplays-player-section">
                <div className="pp-openplays-player-header">
                  <strong>Players joined</strong>
                  <span>
                    {p.registered} / {p.max_players}
                  </span>
                </div>

                <div className="pp-openplays-progress">
                  <div
                    className="pp-openplays-progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        (p.registered / p.max_players) * 100
                      )}%`,
                    }}
                  ></div>
                </div>

                <small className="pp-openplays-player-caption">
                  {p.status === "full"
                    ? "This session is fully booked"
                    : `${Math.max(
                        0,
                        p.max_players - p.registered
                      )} slots remaining`}
                </small>
              </div>

              {/* ACTIONS */}
              <div className="pp-openplays-card-action">
                {!user ? (
                  <Link className="pp-openplays-button" to="/login">
                    Log in to join
                    <span>→</span>
                  </Link>
                ) : user.role !== "customer" ? (
                  <div className="pp-openplays-admin-note">
                    Admin account
                  </div>
                ) : p.joined ? (
                  <button
                    className="pp-openplays-leave-button"
                    disabled={busyId === p.id}
                    onClick={() => act(p, false)}
                  >
                    {busyId === p.id ? "Processing..." : "Leave Session"}
                  </button>
                ) : (
                  <button
                    className="pp-openplays-button"
                    disabled={busyId === p.id || p.status === "full"}
                    onClick={() => act(p, true)}
                  >
                    {busyId === p.id
                      ? "Processing..."
                      : p.status === "full"
                      ? "Session Full"
                      : "Join Open Play"}
                    <span>→</span>
                  </button>
                )}
              </div>

            </article>
          ))}
        </div>
      </section>

      {/* BOTTOM BANNER */}
      <section className="pp-openplays-bottom">
        <div>
          <span>GOOD GAMES. GREAT COMPANY.</span>
          <h2>Every game is better together.</h2>
          <p>
            Come for the game, stay for the community.
          </p>
        </div>
      </section>

    </div>
  );
}
