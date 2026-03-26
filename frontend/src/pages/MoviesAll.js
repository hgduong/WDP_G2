import { useEffect, useState } from "react";
import "../assets/styles/SectionPages.css";
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

const getRatingClass = (rating) => {
  const value = Number(rating);
  if (Number.isNaN(value)) return "";
  return value < 8 ? "section-card__badge--warning" : "section-card__badge--success";
};

export default function MoviesAll() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError(err?.message || "Khong the tai danh sach phim.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMovies();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <section className="section-page">
        <div className="section-page__container">
          <h1 className="section-page__title">Danh sách phim</h1>
          <p className="section-page__subtitle">
            Dữ liệu lấy từ toàn bộ phim trong hệ thống.
          </p>

          <div className="section-page__toolbar">
            {loading ? (
              <span className="section-page__status">Đang tải dữ liệu...</span>
            ) : (
              <span className="section-page__status">{movies.length} phim</span>
            )}
            {error ? (
              <span className="section-page__status">{error}</span>
            ) : null}
          </div>

          {!loading && movies.length === 0 ? (
            <div className="section-page__empty">Chưa có phim nào.</div>
          ) : null}

          {movies.length > 0 ? (
            <div className="section-page__grid">
              {movies.map((movie) => (
                <article key={movie._id} className="section-card">
                  <h3 className="section-card__title">{movie.title}</h3>
                  <p className="section-card__meta">Thể loại: {movie.genre}</p>
                  <p className="section-card__meta">
                    Thời lượng: {movie.duration} phút
                  </p>
                  <p className="section-card__meta">
                    Khởi chiếu: {formatDate(movie.releaseDate)}
                  </p>
                  <p className="section-card__meta">
                    Trạng thái: {movie.status || "-"}
                  </p>
                  {movie.rating ? (
                    <span className={`section-card__badge ${getRatingClass(movie.rating)}`}>
                      Rating {movie.rating}
                    </span>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
