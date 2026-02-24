import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../assets/styles/MovieDetail.css";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBooking, setShowBooking] = useState(false); // trạng thái hiển thị đặt vé

  useEffect(() => {
    // lấy chi tiết phim
    fetch(`http://localhost:9999/movies/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // khi bấm nút đặt vé thì mới gọi API lấy showtimes
  const handleBookingClick = () => {
    setShowBooking(true);
    fetch(`http://localhost:9999/showtimes/${id}`)
      .then((res) => res.json())
      .then((data) => setShowtimes(data))
      .catch((err) => console.error("Lỗi lấy showtimes:", err));
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;
  if (!movie) return <p>Không tìm thấy phim</p>;

  return (
    <div className="movie-detail">
      <img
        src={`http://localhost:9999${movie.posterUrl}`}
        alt={movie.title}
        className="poster"
      />
      <div className="info">
        <h1>{movie.title}</h1>
        <p>Thời lượng: {movie.duration} phút</p>
        <p>{movie.description}</p>
        <p>Đạo diễn: {movie.director}</p>
        <p>Diễn viên: {movie.cast}</p>
        <p>Rating: {movie.rating}/10</p>
        <button className="btn" onClick={handleBookingClick}>
          Đặt vé
        </button>
      </div>

      {/* Chỉ hiện suất chiếu khi đã bấm nút Đặt vé */}
      {showBooking && (
        <div className="showtimes">
          <h2>Suất chiếu:</h2>
          {showtimes.length === 0 ? (
            <p>Chưa có suất chiếu nào.</p>
          ) : (
            showtimes.map((s) => (
              <div key={s._id} className="showtime-item">
                <span>
                  {new Date(s.startTime).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
                <span> - Giá vé: {s.price} VND</span>
                <span> - Ghế trống: {s.availableSeats}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
