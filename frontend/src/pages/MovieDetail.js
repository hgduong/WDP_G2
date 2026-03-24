import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../assets/styles/MovieDetail.css";
import { getImageUrl } from "../utils/imageUtils";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const getSevenDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  };

  // Lấy tất cả khung giờ từ showtimes (bất kể ngày)
  const getAllTimeSlots = () => {
    const times = new Set();
    showtimes.forEach((t) => {
      const showtimeDate = new Date(t.startTime);
      const hours = String(showtimeDate.getHours()).padStart(2, "0");
      const minutes = String(showtimeDate.getMinutes()).padStart(2, "0");
      times.add(`${hours}:${minutes}`);
    });
    return Array.from(times).sort();
  };

  // Lấy showtime cho ngày và giờ cụ thể
  const getShowtimeForSlot = (date, timeSlot) => {
    const [hours, minutes] = timeSlot.split(":");
    return showtimes.find((t) => {
      const showtimeDate = new Date(t.startTime);
      const dateStr = showtimeDate.toISOString().split("T")[0];
      return (
        dateStr === date &&
        showtimeDate.getHours() === parseInt(hours) &&
        showtimeDate.getMinutes() === parseInt(minutes)
      );
    });
  };

  useEffect(() => {
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

  const handleBookingClick = () => {
    setShowBooking(true);
    fetch(`http://localhost:9999/showtimes/movie/${id}`)
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            const message = text || `Server responded ${res.status}`;
            throw new Error(message);
          });
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setShowtimes(data);
          const sevenDays = getSevenDays();
          setSelectedDate(sevenDays[0]);
        } else {
          setShowtimes([]);
          setError("Không thể tải suất chiếu");
        }
      })
      .catch((err) => {
        setShowtimes([]);
        setError(err.message);
      });
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;
  if (!movie) return <p>Không tìm thấy phim</p>;

  const allTimeSlots = getAllTimeSlots();

  return (
    <div className="movie-detail">
      <img
        src={getImageUrl(movie.posterUrl)}
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

      {showBooking && (
        <div className="showtimes">
          <h2>Suất chiếu:</h2>
          {showtimes.length === 0 ? (
            <p>Chưa có suất chiếu nào.</p>
          ) : (
            <>
              <div className="cinema-name">
                {Array.from(
                  new Set(showtimes.map((s) => s.cinemasId?.name || "")),
                ).join(" / ")}
              </div>
              
              <div className="date-tabs">
                {getSevenDays().map((date) => {
                  const d = new Date(date);
                  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                  const label = `${String(d.getDate()).padStart(2, "0")}/${String(
                    d.getMonth() + 1,
                  ).padStart(2, "0")} - ${weekDays[d.getDay()]}`;
                  const isActive = selectedDate === date;
                  return (
                    <div
                      key={date}
                      className={`date-tab ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              <div className="showtime-category">2D PHỤ ĐỀ</div>

              <div className="time-grid">
                {allTimeSlots.length === 0 ? (
                  <p className="no-showtimes">Chưa có suất chiếu nào</p>
                ) : (
                  allTimeSlots.map((timeSlot) => {
                    const showtime = getShowtimeForSlot(selectedDate, timeSlot);
                    const [hours, minutes] = timeSlot.split(":");
                    const isLate = parseInt(hours) >= 22;
                    const isAvailable = !!showtime;

                    return (
                      <div
                        key={timeSlot}
                        className={`time-slot ${isLate ? "late" : ""}`}
                        onClick={() => {
                          console.log("Booking showtime:", showtime?._id);
                        }}
                      >
                        <div className="time-label">{timeSlot}</div>
                        {isAvailable ? (
                          <div className="seats">
                            <div className="seats-note">Còn {showtime.roomId?.capacity || 0} ghế</div>
                          </div>
                        ) : (
                          <div className="seats">-</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
