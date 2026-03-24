import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "../assets/styles/MovieDetail.css";
import { getImageUrl } from "../utils/imageUtils";
import { holdSeats, releaseSeats, getHeldSeats, bookSeats } from "../services/api";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { io } from "socket.io-client";

export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holdingSeats, setHoldingSeats] = useState({}); // { seatId: expiryTime }
  const [countdown, setCountdown] = useState(0);
  const [remoteHeldSeats, setRemoteHeldSeats] = useState([]); // Seats held by other users
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io("http://localhost:9999");

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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

  // Generate seats: 10 per row, last row is couple seats
  const generateSeats = () => {
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E'];
    
    rows.forEach((row, rowIndex) => {
      if (rowIndex === rows.length - 1) {
        // Row E: Couple seats (5 pairs: 1-2, 3-4, 5-6, 7-8, 9-10)
        for (let i = 0; i < 5; i++) {
          const seatNum = i * 2 + 1;
          seats.push({
            id: `${row}${seatNum}`,
            label: `${row}${seatNum}-${seatNum + 1}`,
            isCouple: true,
            row: row,
            seatNumber: seatNum
          });
        }
      } else {
        // Rows A-D: 10 regular seats each (1-10)
        for (let i = 0; i < 10; i++) {
          const seatNum = i + 1;
          seats.push({
            id: `${row}${seatNum}`,
            label: `${row}${seatNum}`,
            isCouple: false,
            row: row,
            seatNumber: seatNum
          });
        }
      }
    });
    return seats;
  };

  const allSeats = generateSeats();

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

  // Socket.IO: Join showtime room and listen for events
  useEffect(() => {
    if (!showSeatModal || !selectedShowtime || !socketRef.current) {
      return;
    }

    const showtimeId = selectedShowtime._id;
    const socket = socketRef.current;

    // Join the showtime room
    socket.emit("join_showtime", showtimeId);

    // Listen for seat held events from other users
    socket.on("seat_held", (data) => {
      const { seatId, userId, heldUntil } = data;
      // Only add if held by another user
      if (userId !== user?._id) {
        setRemoteHeldSeats(prev => {
          const exists = prev.some(s => s._id === seatId);
          if (!exists) {
            return [...prev, { _id: seatId, heldUntil, heldBy: userId }];
          }
          return prev;
        });
      }
    });

    // Listen for seat released events
    socket.on("seat_released", (data) => {
      const { seatId } = data;
      setRemoteHeldSeats(prev => prev.filter(s => s._id !== seatId));
    });

    // Listen for seat booked events
    socket.on("seat_booked", (data) => {
      const { seatId } = data;
      setRemoteHeldSeats(prev => prev.filter(s => s._id !== seatId));
      // Also deselect if user had selected it
      setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
    });

    return () => {
      socket.emit("leave_showtime", showtimeId);
      socket.off("seat_held");
      socket.off("seat_released");
      socket.off("seat_booked");
    };
  }, [showSeatModal, selectedShowtime, user]);

  const handleBookingClick = () => {
    setShowBooking(true);
    fetch(`http://localhost:9999/showtimes/movie/${id}`)
      .then((res) => res.json())
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

  const handleTimeSlotClick = (showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setShowSeatModal(true);
  };

  const HOLDING_TIME = 10; // 10 seconds

  const toggleSeat = (seat) => {
    // Check if seat is being held by someone else (remote)
    const isRemoteHeld = remoteHeldSeats.some(s => 
      s._id === seat.id || (s.row === seat.row && s.number === seat.seatNumber)
    );
    if (isRemoteHeld) {
      alert("Ghế này đang được người khác chọn!");
      return;
    }

    // Check if seat is being held (in local countdown)
    if (holdingSeats[seat.id]) {
      return;
    }

    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seat.id);
      if (isSelected) {
        // Deselect: remove from holdingSeats and emit socket event
        releaseSeats([seat.id]).catch(console.error);
        const newHolding = { ...holdingSeats };
        delete newHolding[seat.id];
        setHoldingSeats(newHolding);
        
        // Emit socket event
        if (socketRef.current && selectedShowtime) {
          socketRef.current.emit("release_seat", {
            showtimeId: selectedShowtime._id,
            seatId: seat.id
          });
        }
        
        return prev.filter((s) => s.id !== seat.id);
      }
      
      // Select: start 10-second countdown and emit socket event
      const expiryTime = Date.now() + HOLDING_TIME * 1000;
      setHoldingSeats(prev => ({ ...prev, [seat.id]: expiryTime }));
      
      // Hold seat on server
      if (selectedShowtime && selectedShowtime._id) {
        holdSeats(selectedShowtime._id, [seat.id], user?._id).catch(console.error);
        
        // Emit socket event
        if (socketRef.current) {
          socketRef.current.emit("hold_seat", {
            showtimeId: selectedShowtime._id,
            seatId: seat.id,
            userId: user?._id,
            heldUntil: expiryTime
          });
        }
      }
      
      return [...prev, seat];
    });
  };

  // Countdown timer effect
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setCountdown(0);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      let minExpiry = null;

      // Find the earliest expiry time
      Object.values(holdingSeats).forEach(expiry => {
        if (!minExpiry || expiry < minExpiry) {
          minExpiry = expiry;
        }
      });

      if (minExpiry) {
        const remaining = Math.max(0, Math.floor((minExpiry - now) / 1000));
        setCountdown(remaining);

        // Remove expired seats
        if (remaining === 0) {
          setHoldingSeats(prev => {
            const newHolding = { ...prev };
            Object.keys(newHolding).forEach(seatId => {
              if (newHolding[seatId] <= now) {
                delete newHolding[seatId];
              }
            });
            return newHolding;
          });
          setSelectedSeats(prev => prev.filter(s => {
            const expiry = holdingSeats[s.id];
            return !expiry || expiry > now;
          }));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length, holdingSeats]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeatClass = (seat) => {
    // Check if seat is held by another user (remote)
    const isRemoteHeld = remoteHeldSeats.some(s => 
      s._id === seat.id || (s.row === seat.row && s.number === seat.seatNumber)
    );
    if (isRemoteHeld) {
      return "seat holding";
    }
    
    if (selectedSeats.some((s) => s.id === seat.id)) {
      // Check if seat has countdown (holding status)
      if (holdingSeats[seat.id]) {
        return "seat holding";
      }
      return "seat selected";
    }
    if (seat.isCouple) {
      return "seat couple";
    }
    return "seat";
  };

  const totalPrice = selectedSeats.length * (selectedShowtime?.price || 75000);

  const closeSeatModal = () => {
    setShowSeatModal(false);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setHoldingSeats({});
    setCountdown(0);
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
                          if (showtime) {
                            handleTimeSlotClick(showtime);
                          }
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

      {/* Seat Selection Modal */}
      {showSeatModal && selectedShowtime && (
        <div className="modal-overlay" onClick={closeSeatModal}>
          <div className="seat-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="seat-modal-header">
              <h3>Chọn ghế</h3>
              <button className="modal-close" onClick={closeSeatModal}>&times;</button>
            </div>
            
            <div className="seat-modal-info">
              <p>Suất chiếu: {new Date(selectedShowtime.startTime).toLocaleString("vi-VN")}</p>
              <p>Rạp: {selectedShowtime.cinemasId?.name} - {selectedShowtime.roomId?.name}</p>
              <p>Giá: {selectedShowtime.price?.toLocaleString("vi-VN")}đ/ghế</p>
            </div>

            <div className="screen">Màn hình</div>

            <div className="seat-grid-modal">
              {allSeats.map((seat) => (
                <button
                  key={seat.id}
                  className={getSeatClass(seat)}
                  onClick={() => toggleSeat(seat)}
                >
                  {seat.label}
                </button>
              ))}
            </div>

            <div className="seat-legend">
              <div className="legend-item">
                <span className="seat available"></span>
                <span>Ghế trống</span>
              </div>
              <div className="legend-item">
                <span className="seat holding"></span>
                <span>Đang chọn</span>
              </div>
              <div className="legend-item">
                <span className="seat selected"></span>
                <span>Đã chọn</span>
              </div>
              <div className="legend-item">
                <span className="seat couple"></span>
                <span>Ghế đôi</span>
              </div>
            </div>

            <div className="selected-seats-info">
              <h4>Ghế đã chọn:</h4>
              <div className="selected-list">
                {selectedSeats.length === 0 ? (
                  <span>Chưa chọn ghế nào</span>
                ) : (
                  selectedSeats.map((seat) => (
                    <span key={seat.id} className="selected-seat-tag">{seat.label}</span>
                  ))
                )}
              </div>
            </div>

            <div className="seat-modal-footer">
              {countdown > 0 && (
                <div className="countdown-info">
                  <span className="countdown-label">Thời gian giữ ghế còn lại: </span>
                  <span className="countdown-timer">{formatCountdown(countdown)}</span>
                </div>
              )}
              <div className="price-info">
                <span>Số ghế: {selectedSeats.length}</span>
                <span className="total-price">
                  Tổng: {totalPrice.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <button 
                className="btn btn-primary"
                disabled={selectedSeats.length === 0}
                onClick={() => {
                  alert(`Đã chọn ${selectedSeats.length} ghế: ${selectedSeats.map(s => s.label).join(", ")}\nTổng tiền: ${totalPrice.toLocaleString("vi-VN")}đ`);
                }}
              >
                Xác nhận đặt vé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
