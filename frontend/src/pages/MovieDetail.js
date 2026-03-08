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
  const [selectedDate, setSelectedDate] = useState(null); // ngày được chọn để hiển thị suất chiếu

  // helper: lấy 7 ngày liên tiếp tính từ hôm nay (hoặc đến ngày kết thúc lịch chiếu nếu có)
  const getNextSevenDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt về đầu ngày
    
    // Xác định ngày kết thúc: hoặc 7 ngày tới, hoặc ngày kết thúc lịch chiếu của phim
    let endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);
    
    if (movie?.endDate) {
      const movieEndDate = new Date(movie.endDate);
      movieEndDate.setHours(23, 59, 59, 999);
      if (movieEndDate < endDate) {
        endDate = movieEndDate;
      }
    }
    
    let currentDate = new Date(today);
    while (currentDate <= endDate) {
      days.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  // helper: lấy danh sách ngày duy nhất từ showtimes
  const getUniqueDates = (times) => {
    const dates = Array.from(
      new Set(
        times.map((t) => new Date(t.startTime).toISOString().split("T")[0]),
      ),
    );
    dates.sort();
    return dates;
  };

  // helper: kiểm tra xem ngày có showtime chưa hết giờ không
  const hasShowtimeForDate = (date) => {
    const now = new Date();
    return showtimes.some((t) => {
      const showtimeTime = new Date(t.startTime);
      // Chỉ hiện showtime nếu chưa hết giờ
      return showtimeTime > now && 
        showtimeTime.toISOString().split("T")[0] === date;
    });
  };

  // Danh sách khung giờ cố định trong ngày
  const FIXED_TIME_SLOTS = [
    "08:00",
    "08:30",
    "09:00",
    "09:25",
    "09:50", 
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "13:00",
    "16:00",
    "19:00",
    "22:00"
  ];

  // Lấy showtime phù hợp với ngày và giờ cố định (chỉ lấy showtime chưa hết giờ)
  const getShowtimeForSlot = (date, timeSlot) => {
    const [hours, minutes] = timeSlot.split(":");
    const now = new Date();
    return showtimes.find((t) => {
      const showtimeDate = new Date(t.startTime);
      // Chỉ lấy showtime nếu chưa hết giờ
      if (showtimeDate <= now) return false;
      const dateStr = showtimeDate.toISOString().split("T")[0];
      return (
        dateStr === date &&
        showtimeDate.getUTCHours() === parseInt(hours) &&
        showtimeDate.getUTCMinutes() === parseInt(minutes)
      );
    });
  };

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
        // Validate data is an array
        if (Array.isArray(data)) {
          setShowtimes(data);
          // chọn ngày đầu tiên có suất chiếu từ hôm nay (7 ngày tới)
          const availableDates = getNextSevenDays();
          const firstDateWithShowtime = availableDates.find(date => 
            data.some(t => {
              const showtimeTime = new Date(t.startTime);
              const now = new Date();
              return showtimeTime > now && 
                showtimeTime.toISOString().split("T")[0] === date;
            })
          );
          if (firstDateWithShowtime) {
            setSelectedDate(firstDateWithShowtime);
          } else {
            setSelectedDate(availableDates[0]);
          }
        } else {
          console.error("Dữ liệu showtimes không phải là array:", data);
          setShowtimes([]);
          setError("Không thể tải suất chiếu");
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy showtimes:", err);
        setShowtimes([]);
        setError(err.message);
      });
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
            <>
              {/* tên rạp (lấy từ showtimes) */}
              <div className="cinema-name">
                {Array.from(
                  new Set(showtimes.map((s) => s.cinemasId?.name || "")),
                ).join(" / ")}
              </div>
              {/* ngày chọn - hiển thị 7 ngày từ hôm nay */}
              <div className="date-tabs">
                {getNextSevenDays().map((date) => {
                  const d = new Date(date);
                  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                  const label = `${String(d.getDate()).padStart(2, "0")}/${String(
                    d.getMonth() + 1,
                  ).padStart(2, "0")} - ${weekDays[d.getDay()]}`;
                  const isActive = selectedDate === date;
                  const hasShowtime = hasShowtimeForDate(date);
                  return (
                    <div
                      key={date}
                      className={`date-tab ${isActive ? "active" : ""} ${!hasShowtime ? "no-showtime" : ""}`}
                      onClick={() => hasShowtime && setSelectedDate(date)}
                    >
                      {!hasShowtime ? "Chưa có lịch" : label}
                    </div>
                  );
                })}
              </div>

              {/* loại rạp/tính năng tạm cố định */}
              <div className="showtime-category">2D PHỤ ĐỀ</div>

              {/* lưới suất chiếu ngày đã chọn - hiển thị khung giờ cố định */}
              <div className="time-grid">
                {FIXED_TIME_SLOTS.map((timeSlot) => {
                  const showtime = getShowtimeForSlot(selectedDate, timeSlot);
                  const [hours, minutes] = timeSlot.split(":");
                  const isLate = parseInt(hours) >= 22;
                  const isAvailable = !!showtime;
                  
                  return (
                    <div
                      key={timeSlot}
                      className={`time-slot ${isLate ? "late" : ""} ${!isAvailable ? "unavailable" : ""}`}
                      onClick={() => isAvailable && console.log("Booking showtime:", showtime._id)}
                    >
                      <div className="time-label">{timeSlot}</div>
                      {isAvailable ? (
                        <div className="seats">
                          {showtime.availableSeats} ghế trống
                        </div>
                      ) : (
                        <div className="seats">Hết vé</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
