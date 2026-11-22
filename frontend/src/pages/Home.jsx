
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { BUSINESS, OPEN_HOUR, CLOSE_HOUR } from "../config";
import { hourLabel, peso } from "../utils/format";

const STEPS = [
  {
    number: "01",
    title: "Create an Account",
    text: "Sign up and create your personal account to get started.",
  },
  {
    number: "02",
    title: "Choose Your Court",
    text: "Select your preferred court, date, time, and playing duration.",
  },
  {
    number: "03",
    title: "Confirm Your Booking",
    text: "Submit your reservation and receive your unique booking code.",
  },
  {
    number: "04",
    title: "Play & Enjoy",
    text: "Visit the venue, enjoy your game, and settle your payment on-site.",
  },
];

export default function Home() {
  const [courts, setCourts] = useState([]);

  useEffect(() => {
    api.get("/courts")
      .then((res) => setCourts(res.data.courts))
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">

      {/* HERO */}
      <section className="hero home-hero">
        <div className="hero-content">
          <span className="home-eyebrow">
            <span className="home-dot"></span>
            YOUR NEXT GAME STARTS HERE
          </span>

          <h1>
            Find Your Game.
            <br />
            <span>Book Your Court.</span>
          </h1>

          <p className="home-hero-description">
            Experience the thrill of pickleball. Bring your friends,
            enjoy the game, and make every match count at PADDLE POINT.
          </p>

          <div className="hero-actions">
            <Link to="/book" className="btn home-primary-btn">
              Book a Court <span>→</span>
            </Link>

            <Link to="/open-plays" className="btn btn-ghost home-secondary-btn">
              Explore Open Plays
            </Link>
          </div>

          <div className="home-hero-note">
            <p>Play. Connect. Enjoy.</p>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-court-art">
            <div className="court-line court-line-outer"></div>
            <div className="court-line court-line-middle"></div>
            <div className="court-line court-line-center"></div>
            <div className="court-net"></div>
            <div className="home-ball"></div>
          </div>

          <div className="home-floating-card">
            <div>
              <strong>Ready to play?</strong>
              <span>Your court is waiting.</span>
            </div>
          </div>
        </div>
      </section>

      {/* COURT PREVIEW */}
      <section className="section home-courts-section">
        <div className="home-section-heading">
          <div>
            <span className="home-eyebrow">FIND YOUR SPACE</span>
            <h2>Find Your Court</h2>
            <p>
              Choose your court and get ready for your next match.
            </p>
          </div>

          <Link to="/courts" className="home-text-link">
            View all courts <span>→</span>
          </Link>
        </div>

        <div className="grid-3 home-courts-grid">
          {courts.map((court) => {
            const number = court.court_name.replace(/\D/g, "") || "•";

            return (
              <div className="card home-court-preview" key={court.id}>
                <div className="row">
                  <div className="home-court-number">
                    {number}
                  </div>

                  <span
                    className={`badge ${
                      court.is_available
                        ? "s-confirmed"
                        : "s-cancelled"
                    }`}
                  >
                    {court.is_available
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </div>

                <h3>{court.court_name}</h3>

                <p className="muted small">
                  {court.court_type} · PADDLE POINT
                </p>

                <div className="row home-court-preview-bottom">
                  <strong>
                    {peso(court.price_per_hour)} / hour
                  </strong>

                  {court.is_available ? (
                    <Link
                      to={`/book?court=${court.id}`}
                      className="btn btn-sm"
                    >
                      Book <span>→</span>
                    </Link>
                  ) : (
                    <button className="btn btn-sm" disabled>
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {courts.length === 0 && (
          <p className="muted">Loading courts...</p>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="section alt home-steps-section">
        <div className="home-section-heading home-centered-heading">
          <div>
            <span className="home-eyebrow">SIMPLE & CONVENIENT</span>
            <h2>How Booking Works</h2>
            <p>
              Four easy steps between you and your next game.
            </p>
          </div>
        </div>

        <div className="grid-4 home-steps-grid">
          {STEPS.map((step) => (
            <div
              className="card step home-step-card"
              key={step.number}
            >
              <div className="home-step-number">
                {step.number}
              </div>

              <h3>{step.title}</h3>
              <p className="muted">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VISIT US */}
      <section className="section home-visit-section">
        <div className="home-section-heading">
          <div>
            <span className="home-eyebrow">COME AND PLAY</span>
            <h2>Visit PADDLE POINT</h2>
            <p>
              We look forward to seeing you on the court.
            </p>
          </div>
        </div>

        <div className="grid-2 home-info-grid">
          <div className="card home-info-card">

            <div>
              <span className="home-info-label">OUR LOCATION</span>
              <h3>Find Us</h3>
              <p>
Narra Street, Bonville Subdivision, Balayan, Batangas, Balayan, Philippines, 4213</p>

              <p className="muted">
                Open daily, {hourLabel(OPEN_HOUR)} –{" "}
                {hourLabel(CLOSE_HOUR)}
              </p>
            </div>
          </div>

          <div className="card home-info-card">
            <div className="home-info-icon">✉</div>

            <div>
              <span className="home-info-label">GET IN TOUCH</span>
              <h3>Contact Us</h3>
              <p>0927 987 9386</p>
              <p>paddlepoint@gmail.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-bottom-cta">
        <div>
          <span className="home-eyebrow">MAKE TIME FOR THE GAME</span>
          <h2>See you on the court.</h2>
          <p>
            Grab your paddle. Bring your friends. Let's play.
          </p>
        </div>

        <Link to="/book" className="btn home-cta-btn">
          Reserve Your Court <span>→</span>
        </Link>
      </section>

    </div>
  );
}
