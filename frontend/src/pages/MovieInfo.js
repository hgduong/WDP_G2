// src/pages/MovieInfo.js
import "../assets/styles/MovieDetail/_movie-info.css";

export default function MovieInfo({ movie, onBookingClick }) {
  if (!movie) return null;




  const directorName = Array.isArray(movie.directors)
    ? movie.directors
        .map((d) => (typeof d === "string" ? d : d?.name))
        .filter(Boolean)
        .join(", ")
    : typeof movie.director === "string"
    ? movie.director
    : movie.director?.name || "";

  const castNames = Array.isArray(movie.cast)
    ? movie.cast
        .map((member) => (typeof member === "string" ? member : member?.name))
        .filter(Boolean)
        .join(", ")
    : typeof movie.cast === "string"
    ? movie.cast
    : "";

  return (
    <div className="movie-info">
      <div className="movie-poster">
        <img
          src={movie.posterUrl || movie.image}
          alt={movie.title}
          className="poster-image"
        />
      </div>

      <div className="movie-details">
        <h1 className="movie-title">{movie.title}</h1>

        <div className="movie-meta">
          {movie.duration && (
            <span className="meta-item">
              <span className="meta-icon"></span>
              <span className="meta-label">Thời lượng:</span>
              <span className="meta-value">{movie.duration} phút</span>
            </span>
          )}
          {movie.releaseDate && (
            <span className="meta-item">
              <span className="meta-icon"></span>
              <span className="meta-label">Ngày khởi chiếu:</span>
              <span className="meta-value">
                {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
              </span>
            </span>
          )}
          {/* {movie.rating && (
            <span className="meta-item">
              <span className="meta-icon">â­</span>
              <span className="meta-label">Đánh giá:</span>
              <span className="meta-value">{movie.rating}/10</span>
            </span>
          )} */}
        </div>

        {movie.genre && (
          <div className="movie-genre">
            <span className="genre-label">Thể loại:</span>
            <span className="genre-value">
              {Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}
            </span>
          </div>
        )}

        {directorName && (
          <div className="movie-director">
            <span className="director-label">Đạo diễn:</span>
            <span className="director-value">{directorName}</span>
          </div>
        )}

        {castNames && (
          <div className="movie-cast">
            <span className="cast-label">Diễn viên:</span>
            <span className="cast-value">{castNames}</span>
          </div>
        )}

        {movie.description && (
          <div className="movie-description">
            <span className="description-label">Nội dung:</span>
            <p className="description-text">{movie.description}</p>
          </div>
        )}

        <button className="booking-button" onClick={onBookingClick}>
          <span className="button-icon"></span>
          Đặt vé ngay
        </button>
      </div>
    </div>
  );
}
