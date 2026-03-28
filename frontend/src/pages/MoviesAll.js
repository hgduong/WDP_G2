import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/MoviesAll.css";
import { getAllMovies } from "../services/api";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const getStatusBadge = (status) => {
  switch (status) {
    case "NowShowing":
      return { text: "Đang chiếu", className: "movie-card__badge--now-showing" };
    case "ComingSoon":
      return { text: "Sắp chiếu", className: "movie-card__badge--coming-soon" };
    default:
      return { text: status || "-", className: "" };
  }
};

export default function MoviesAll() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadMovies = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllMovies();
        if (!isMounted) return;
        setMovies(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Không thể tải danh sách phim.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMovies();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="movies-all">
      <div className="movies-all__container">
        {/* Hero Section */}
        <div className="movies-all__hero">
          <h1 className="movies-all__title">Tất Cả Phim</h1>
          <p className="movies-all__subtitle">
            Khám phá bộ sưu tập phim đa dạng với nhiều thể loại hấp dẫn
          </p>
        </div>

        {/* Stats Bar */}
        {!loading && !error && (
          <div className="movies-all__stats">
            <div className="movies-all__stat">
              <div>
                <div className="movies-all__stat-value">{movies.length}</div>
                <div className="movies-all__stat-label">Phim</div>
              </div>
            </div>
            <div className="movies-all__stat">
              <div>
                <div className="movies-all__stat-value">
                  {movies.filter(m => m.status === "NowShowing").length}
                </div>
                <div className="movies-all__stat-label">Đang Chiếu</div>
              </div>
            </div>
            <div className="movies-all__stat">
              <div>
                <div className="movies-all__stat-value">
                  {movies.filter(m => m.status === "ComingSoon").length}
                </div>
                <div className="movies-all__stat-label">Sắp Chiếu</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="movies-all__loading">
            <div className="movies-all__spinner"></div>
            <div className="movies-all__loading-text">Đang tải dữ liệu phim...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="movies-all__error">
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && movies.length === 0 && (
          <div className="movies-all__empty">
            <h3 className="movies-all__empty-title">Chưa có phim nào</h3>
            <p className="movies-all__empty-text">
              Danh sách phim sẽ sớm được cập nhật
            </p>
          </div>
        )}

        {/* Movie Grid */}
        {!loading && !error && movies.length > 0 && (
          <div className="movies-all__grid">
            {movies.map((movie) => {
              const statusBadge = getStatusBadge(movie.status);
              return (
                <article 
                  key={movie._id} 
                  className="movie-card"
                  onClick={() => handleMovieClick(movie._id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Card Header with Poster */}
                  <div className="movie-card__header">
                    {movie.posterUrl && (
                      <img 
                        src={movie.posterUrl} 
                        alt={movie.title}
                        className="movie-card__poster"
                      />
                    )}
                    <div className="movie-card__overlay"></div>
                    {statusBadge.text && (
                      <span className={`movie-card__badge ${statusBadge.className}`}>
                        {statusBadge.text}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="movie-card__body">
                    <h3 className="movie-card__title">{movie.title}</h3>
                    
                    <div className="movie-card__info">
                      {movie.genre && (
                        <div className="movie-card__info-item">
                          <span className="movie-card__info-label">Thể loại:</span>
                          <span>{Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}</span>
                        </div>
                      )}
                      
                      {movie.duration && (
                        <div className="movie-card__info-item">
                          <span className="movie-card__info-label">Thời lượng:</span>
                          <span>{movie.duration} phút</span>
                        </div>
                      )}
                      
                      {movie.releaseDate && (
                        <div className="movie-card__info-item">
                          <span className="movie-card__info-label">Khởi chiếu:</span>
                          <span>{formatDate(movie.releaseDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="movie-card__footer">
                    <button className="movie-card__action">
                      Đặt Vé Ngay
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
