import { BUSINESS, OPEN_HOUR, CLOSE_HOUR } from "../config";
import { hourLabel } from "../utils/format";

export default function About() {
  return (
    <div className="page pp-about-page">

      {/* HERO SECTION */}
      <section className="pp-about-hero">
        <div className="pp-about-hero-content">
          <span className="pp-about-eyebrow">WELCOME TO PADDLE POINT</span>

          <h1>
            More than a court.
            <br />
            <span>It's a community.</span>
          </h1>

          <p>
            Your place to play, connect, and enjoy the game of pickleball.
            Whether you're playing with friends or joining an Open Play session,
            there's always room for you here.
          </p>

          <div className="pp-about-hero-badge">
            <span className="pp-about-badge-dot"></span>
            PLAY. CONNECT. ENJOY.
          </div>
        </div>

        <div className="pp-about-hero-visual">
          <div className="pp-about-court-illustration">
            <div className="pp-about-court-net"></div>
            <div className="pp-about-court-center"></div>
            <div className="pp-about-court-left"></div>
            <div className="pp-about-court-right"></div>

            <div className="pp-about-ball">●</div>
          </div>

          <div className="pp-about-floating-card">
            <div>
              <strong>Let's Play!</strong>
              <span>See you on the court.</span>
            </div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="pp-about-intro">
        <div className="pp-about-intro-label">
          <span></span>
          ABOUT OUR FACILITY
        </div>

        <h2>
          Built for the game.
          <br />
          <span>Made for everyone.</span>
        </h2>

        <p>
          {BUSINESS.name} is a pickleball facility located in {BUSINESS.location}.
          We provide a space where players can enjoy the sport, spend time with
          friends, meet new people, and experience the fun of pickleball.
        </p>
      </section>

      {/* INFORMATION CARDS */}
      <section className="pp-about-information">

        {/* SERVICES */}
        <div className="pp-about-info-card pp-about-services">


          <span className="pp-about-card-label">WHAT WE OFFER</span>
          <h3>Our Services</h3>

          <p className="pp-about-card-description">
            Enjoy the game your way with our available services.
          </p>

          <ul className="pp-about-service-list">
            <li>
              <span className="pp-about-check">✓</span>
              <span>Hourly court rental</span>
            </li>
            <li>
              <span className="pp-about-check">✓</span>
              <span>Three available courts</span>
            </li>
            <li>
              <span className="pp-about-check">✓</span>
              <span>Group Open Play sessions</span>
            </li>
            <li>
              <span className="pp-about-check">✓</span>
              <span>Pay directly at the facility</span>
            </li>
          </ul>
        </div>

        {/* LOCATION AND HOURS */}
        <div className="pp-about-info-card">
      

          <span className="pp-about-card-label">COME VISIT US</span>
          <h3>Location & Hours</h3>

          <div className="pp-about-detail-block">
            <span className="pp-about-detail-label">OUR LOCATION</span>
            <p>{BUSINESS.location}</p>
          </div>

          <div className="pp-about-detail-block">
            <span className="pp-about-detail-label">OPERATING HOURS</span>
            <p>
              Daily
              <br />
              <strong>
                {hourLabel(OPEN_HOUR)} – {hourLabel(CLOSE_HOUR)}
              </strong>
            </p>
          </div>
        </div>

        {/* CONTACT */}
        <div className="pp-about-info-card">


          <span className="pp-about-card-label">GET IN TOUCH</span>
          <h3>Contact Us</h3>

          <p className="pp-about-card-description">
            Have questions or need assistance? Reach out to us through our contact
            details.
          </p>

          <div className="pp-about-contact-list">
            <div className="pp-about-contact-item">
              <span>☎</span>
              <p>0927 987 9386</p>
            </div>

            <div className="pp-about-contact-item">
              <span>✉</span>
              <p>paddlepoint@gmail.com</p>
            </div>

            <div className="pp-about-contact-item">
              <span>f</span>
              <p>Paddle Point</p>
            </div>
          </div>
        </div>

        {/* PAYMENT */}
        <div className="pp-about-info-card pp-about-payment-card">
  

          <span className="pp-about-card-label">SIMPLE & CONVENIENT</span>
          <h3>Payment</h3>

          <p className="pp-about-card-description">
            Booking with us is simple. No online payment required.
          </p>

          <div className="pp-about-payment-note">
            <span className="pp-about-payment-icon">✓</span>

            <div>
              <strong>Pay at the facility</strong>
              <p>
                Settle your booking fee directly at PADDLE POINT when you arrive
                at the venue.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* BOTTOM CTA */}
      <section className="pp-about-bottom">
        <div className="pp-about-bottom-content">
          <span>YOUR NEXT GAME STARTS HERE</span>

          <h2>Ready to hit the court?</h2>

          <p>
            Grab your paddle, bring your friends, and enjoy the game.
          </p>
        </div>

      </section>

    </div>
  );
}