import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="pp-footer">
      <div className="pp-footer-container">
        {/* BRAND */}
        <div className="pp-footer-brand">
          <img
            src="/images/logopaddlep.jpeg"
            alt="Paddle Point Logo"
            className="pp-footer-logo"
          />

          <h3>PADDLE POINT</h3>
          <p className="pp-footer-tagline">
            Play. Rally. Connect.
          </p>

          <p className="pp-footer-description">
            Your place to play, connect, and enjoy the game.
            Experience pickleball at Paddle Point.
          </p>

          <p className="pp-footer-address">
            Narra Street, Bonville Subdivision,
            Balayan, Batangas, Philippines, 4213
          </p>
        </div>

        {/* QUICK LINKS */}
        <div className="pp-footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/courts">Our Courts</Link>
          <Link to="/book">Book a Court</Link>
          <Link to="/open-plays">Open Plays</Link>
          <Link to="/about">About Us</Link>
        </div>

        {/* CONTACT */}
        <div className="pp-footer-contact">
          <h4>Get in Touch</h4>

          <div className="pp-footer-contact-item">
            <span className="pp-footer-label">Phone</span>
            <p>0927 987 9386</p>
          </div>

          <div className="pp-footer-contact-item">
            <span className="pp-footer-label">Email</span>
            <p>paddlepoint@gmail.com</p>
          </div>

          <div className="pp-footer-contact-item">
            <span className="pp-footer-label">Location</span>
            <p>Balayan, Batangas</p>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div className="pp-footer-bottom">
        <p>© {new Date().getFullYear()} Paddle Point. All rights reserved.</p>
        <span>PLAY. ENJOY. CONNECT.</span>
      </div>
    </footer>
  );
}