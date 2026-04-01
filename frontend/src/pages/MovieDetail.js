import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "../assets/styles/MovieDetail/MovieDetail.css";
import { UserContext } from "../context/UserContext";
import MovieInfo from "./MovieInfo";
import TrailerSection from "./TrailerSection";
import ShowtimeSelector from "./ShowtimeSelector";
import SeatSelectionModal from "./SeatSelectionModal";
import { getMovieById, getShowtimesByIds, getShowtimesByMovie } from "../services/api";

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isAuthReady } = useContext(UserContext);

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:9999";
    socketRef.current = io(socketUrl, {
      withCredentials: true,
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const fetchMovieAndShowtimes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const movieData = await getMovieById(id);
      if (!movieData) {
        throw new Error("Không tìm thấy phim");
      }

      let showtimesData = [];

      if (Array.isArray(movieData.showtimes) && movieData.showtimes.length > 0) {
        const showtimeIds = movieData.showtimes.map((showtime) => showtime._id || showtime);
        showtimesData = await getShowtimesByIds(showtimeIds);
      } else {
        showtimesData = await getShowtimesByMovie(id);
      }

      setMovie(movieData);
      setShowtimes(Array.isArray(showtimesData) ? showtimesData : []);

      if (!selectedDate) {
        setSelectedDate(new Date().toISOString().split("T")[0]);
      }
    } catch (fetchError) {
      console.error("Error fetching movie detail:", fetchError);
      setError(fetchError.message || "Không thể tải thông tin phim");
    } finally {
      setLoading(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    if (id) {
      fetchMovieAndShowtimes();
    }
  }, [id, fetchMovieAndShowtimes]);

  useEffect(() => {
    if (!user && selectedShowtime) {
      setSelectedShowtime(null);
    }
  }, [user, selectedShowtime]);

  const handleBookingClick = () => {
    if (!isAuthReady) {
      return;
    }

    if (!user || role === "Guest") {
      navigate("/login", {
        state: {
          redirectTo: `/movie/${id}`,
        },
      });
      return;
    }

    setShowBooking(true);
  };

  const handleSeatModalClose = () => {
    setSelectedShowtime(null);
  };

  const handleBookingSuccess = (booking) => {
    if (!booking?._id) {
      return;
    }

    setSelectedShowtime(null);
    setShowBooking(false);
    localStorage.setItem("lastOrderBookingId", booking._id);
    navigate(`/order?bookingId=${booking._id}`, {
      state: {
        orderData: booking,
      },
    });
  };

  if (loading) {
    return (
      <div className="movie-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin phim...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movie-detail-error">
        <div className="error-icon"></div>
        <h2>Đã xảy ra lỗi</h2>
        <p>{error}</p>
        <button className="btn btn-retry" onClick={fetchMovieAndShowtimes}>
          Thử lại
        </button>
        <button className="btn btn-back" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-detail-not-found">
        <div className="not-found-icon"></div>
        <h2>Không tìm thấy phim</h2>
        <p>Phim bạn tìm không tồn tại hoặc đã bị xóa.</p>
        <button className="btn btn-back" onClick={() => navigate("/")}>
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="movie-detail">
      <MovieInfo movie={movie} onBookingClick={handleBookingClick} />

      <TrailerSection trailerUrl={movie.trailerUrl} />

      {showBooking ? (
        <ShowtimeSelector
          showtimes={showtimes}
          selectedShowtime={selectedShowtime}
          setSelectedShowtime={setSelectedShowtime}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      ) : null}

      <SeatSelectionModal
        isOpen={Boolean(selectedShowtime)}
        selectedShowtime={selectedShowtime}
        movie={movie}
        user={user}
        socketRef={socketRef}
        onClose={handleSeatModalClose}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
}
