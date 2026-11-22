import { Link } from "react-router-dom";
import { peso } from "../utils/format";

const COURT_IMAGES = {
  1: "/images/court1.jpg",
  2: "/images/court2.jpg",
  3: "/images/court3.jpg",
};

export default function CourtCard({ court }) {
  const number = court.court_name.replace(/\D/g, "") || "1";
  const image = COURT_IMAGES[Number(number)] || COURT_IMAGES[1];

  return (
    <div className="court-card">
      <div className="court-image-wrapper">
        <img
          className="court-img"
          src={image}
          alt={court.court_name}
          onError={(e) => {
            e.currentTarget.src = "/images/court1.jpg";
          }}
        />

        <div className="court-image-overlay">
          <span className="court-image-number">
            COURT {number}
          </span>
        </div>
      </div>

      <div className="court-body">
        <div className="row">
          <h3>{court.court_name}</h3>

          <span
            className={`badge ${
              court.is_available ? "s-confirmed" : "s-cancelled"
            }`}
          >
            {court.is_available ? "Available" : "Unavailable"}
          </span>
        </div>

        <p className="muted">
          {court.court_type} · {court.description}
        </p>

        <div className="row court-card-bottom">
          <strong>{peso(court.price_per_hour)} / hour</strong>

          {court.is_available ? (
            <Link
              className="btn btn-sm"
              to={`/book?court=${court.id}`}
            >
              Book
            </Link>
          ) : (
            <button className="btn btn-sm" disabled>
              Book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}