// src/pages/MovieDetail.js
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import "../assets/styles/MovieDetail/MovieDetail.css";

import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { io } from "socket.io-client";

import MovieInfo from "./MovieInfo";
import TrailerSection from "./TrailerSection";
import ShowtimeSelector from "./ShowtimeSelector";
import SeatSelectionModal from "./SeatSelectionModal";

import { getShowtimesByIds, getShowtimesByMovie, getMovieById } from "../services/api";

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const socketRef = useRef(null);

  // Khởi tạo Socket.IO
  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:9999";
    socketRef.current = io(socketUrl);

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Fetch movie + showtimes
  const fetchMovieAndShowtimes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const movieData = await getMovieById(id);
      if (!movieData) throw new Error("Không tìm thấy phim");

      let showtimesData = [];

      if (movieData.showtimes && movieData.showtimes.length > 0) {
        const showtimeIds = movieData.showtimes.map(s => s._id || s);
        showtimesData = await getShowtimesByIds(showtimeIds);
      } else {
        // Fallback
        showtimesData = await getShowtimesByMovie(id);
      }

      setMovie(movieData);
      setShowtimes(Array.isArray(showtimesData) ? showtimesData : []);

      // Set ngày mặc định là ngày đầu tiên
      if (!selectedDate) {
        const today = new Date().toISOString().split("T")[0];
        setSelectedDate(today);
      }
    } catch (err) {
      console.error("Error fetching movie:", err);
      setError(err.message || "Không thể tải thông tin phim. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    if (id) fetchMovieAndShowtimes();
  }, [id, fetchMovieAndShowtimes]);

  const handleBookingClick = () => setShowBooking(true);

  const handleSeatModalClose = () => {
    setSelectedShowtime(null);
  };

  // ====================== TẠO ORDER DATA - QUAN TRỌNG ======================
  const createOrderData = (selectedSeats) => {
    if (!selectedShowtime || !movie) return null;

    const cinema = selectedShowtime.cinemasId || selectedShowtime.cinema;
    const room = selectedShowtime.roomId || selectedShowtime.room;

    return {
      bookingCode: `BK${Date.now().toString().slice(-8)}`,
      movie: {
        title: movie.title,
        posterUrl: movie.posterUrl,
        duration: movie.duration,
        director: movie.director,
      },
      cinema: {
        _id: cinema?._id,
        name: cinema?.name,
        address: cinema?.address,
        city: cinema?.city,
      },
      room: {
        _id: room?._id,
        name: room?.name,
        capacity: room?.capacity,
      },
      showtime: {
        _id: selectedShowtime._id,
        startTime: selectedShowtime.startTime,
        price: selectedShowtime.price,
      },
      seats: selectedSeats.map((seat) => ({
        _id: seat.id,
        label: seat.label,
      })),
      totalPrice: selectedSeats.length * (selectedShowtime.price || 75000),
      purchaseDate: new Date().toISOString(),
    };
  };

  const handleBookingSuccess = (orderDataFromModal) => {
    // Nếu SeatSelectionModal đã tạo orderData thì dùng luôn
    // Nếu không, tự tạo lại để đảm bảo có room & cinema
    const finalOrderData = orderDataFromModal || createOrderData([]);

    setSelectedShowtime(null);
    setShowBooking(false);
    navigate("/order", { state: { orderData: finalOrderData } });
  };

  // Loading, Error, Not Found states
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
        <p>Phim bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <button className="btn btn-back" onClick={() => navigate('/')}>
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="movie-detail">
      <MovieInfo movie={movie} onBookingClick={handleBookingClick} />

      <TrailerSection trailerUrl={movie.trailerUrl} />

      {showBooking && (
        <ShowtimeSelector
          showtimes={showtimes}
          selectedShowtime={selectedShowtime}
          setSelectedShowtime={setSelectedShowtime}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}

      <SeatSelectionModal
        isOpen={!!selectedShowtime}
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