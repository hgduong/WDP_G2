import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "../assets/styles/MovieDetail.css";
import { getImageUrl } from "../utils/imageUtils";
import { holdSeats, releaseSeats, getHeldSeats, bookSeats, getStaffBookingSeatMap, createStaffBookingOrder } from "../services/api";
import { createBooking } from "../services/bookingService";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { io } from "socket.io-client";

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [availableSeats, setAvailableSeats] = useState([]);
  const [seatModalLoading, setSeatModalLoading] = useState(false);
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

  const getTimeSlotsForDate = (date) => {
    const slots = [];
    showtimes.forEach((t) => {
      const showtimeDate = new Date(t.startTime);
      const dateStr = showtimeDate.toISOString().split("T")[0];
      if (dateStr === date) {
        const hours = String(showtimeDate.getHours()).padStart(2, "0");
        const minutes = String(showtimeDate.getMinutes()).padStart(2, "0");
        const timeStr = `${hours}:${minutes}`;
        if (!slots.find(s => s.time === timeStr)) {
          slots.push({ time: timeStr, showtime: t });
        }
      }
    });
    return slots.sort((a, b) => a.time.localeCompare(b.time));
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

  // Get seats from server based on showtime (10 per row)
  // Seats are fetched via handleTimeSlotClick and stored in availableSeats

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
    setSeatModalLoading(true);
    
    console.log('=== SEATMAP DEBUG ===');
    console.log('Showtime ID:', showtime._id);
    console.log('Showtime seatMap:', showtime.seatMap);
    console.log('Room ID:', showtime.roomId?._id || showtime.roomId);
    console.log('Room seatmapId:', showtime.roomId?.seatmapId);
    
    // Fetch seatmap for this showtime
    console.log('Fetching seatmap for showtime:', showtime._id);
    getStaffBookingSeatMap(showtime._id)
      .then((seatmapData) => {
        console.log('Seatmap data received:', seatmapData);
        console.log('Seats:', seatmapData?.seats?.length || 0);
        
        // Handle both direct seatmap (from /seatmap endpoint) and wrapped format (from staff endpoint)
        // seatmapData can be: { seats: [...] } or [...] or null
        let seats = null;
        
        if (seatmapData) {
          if (Array.isArray(seatmapData)) {
            // Direct array of seats
            seats = seatmapData;
          } else if (seatmapData.seats && Array.isArray(seatmapData.seats)) {
            // Wrapped format { seats: [...] }
            seats = seatmapData.seats;
          } else if (seatmapData._id && seatmapData.seats) {
            // Seatmap object with seats array
            seats = Array.isArray(seatmapData.seats) ? seatmapData.seats : [];
          }
        }
        
        console.log('Processed seats:', seats?.length || 0);
        
        if (seats && Array.isArray(seats)) {
          // Transform server seat data to frontend format
          const transformedSeats = seats.map((seat) => {
            // For couple seats, format label as "E1-2" instead of "E1"
            const label = seat.type === 'Couple' 
              ? `${seat.row}${seat.number}-${seat.number + 1}` 
              : `${seat.row}${seat.number}`;
            
            return {
              id: seat._id,
              label: seat.label || label,
              row: seat.row,
              seatNumber: seat.number,
              type: seat.type,
              status: seat.status,
              isCouple: seat.type === 'Couple'
            };
          });
          console.log('Transformed seats:', transformedSeats.length);
          setAvailableSeats(transformedSeats);
        } else {
          console.log('No seats found in seatmapData');
        }
      })
      .catch((err) => {
        console.error("Error loading seatmap:", err);
        console.error("Error details:", err.response?.data || err.message);
      })
      .finally(() => {
        setSeatModalLoading(false);
        setShowSeatModal(true);
      });
  };

  const HOLDING_TIME = 10; // 10 seconds

  const toggleSeat = (seat) => {
    // Check if seat is already booked on server
    if (seat.status === 'Booked') {
      alert("Ghế này đã được đặt!");
      return;
    }
    
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
    const classes = ["seat-button"];

    const isRemoteHeld = remoteHeldSeats.some(s =>
      s._id === seat.id || (s.row === seat.row && s.number === seat.seatNumber)
    );

    if (isRemoteHeld) {
      classes.push("holding");
    } else if (seat.status === 'Booked') {
      classes.push("booked");
    } else if (selectedSeats.some((s) => s.id === seat.id)) {
      if (holdingSeats[seat.id]) {
        classes.push("holding");
      }
      classes.push("selected");
    } else {
      classes.push("available");
    }

    if (seat.isCouple) {
      classes.push("couple");
    } else if (seat.type === "VIP") {
      classes.push("vip");
    }

    return classes.filter(Boolean).join(" ");
  };

  const totalPrice = selectedSeats.length * (selectedShowtime?.price || 75000);

  const closeSeatModal = () => {
    setShowSeatModal(false);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setAvailableSeats([]);
    setHoldingSeats({});
    setCountdown(0);
  };

  // Handle booking confirmation and navigate to Order page
  const handleBookingConfirmation = async () => {
    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất một ghế!");
      return;
    }

    try {
      // Save booking to database with Pending status
      const bookingResult = await createBooking({
        showtimeId: selectedShowtime._id,
        seatIds: selectedSeats.map(s => s.id),
        customerName: user?.fullName || "",
        customerPhone: user?.phone || "",
        customerEmail: user?.email || "",
        paymentStatus: "Pending",
        notes: "Đặt vé qua trang chi tiết phim"
      });

      // Generate booking code from database result or fallback
      const bookingCode = bookingResult?.booking?.bookingCode || "BK" + Date.now().toString().slice(-8);
      const bookingId = bookingResult?.booking?._id;
      
      // Generate ticket data with QR codes
      const tickets = selectedSeats.map((seat, index) => ({
        ticketCode: `TK${Date.now().toString().slice(-8)}${index}`,
        seat: seat.label,
        seatLabel: seat.label,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(seat.label + "-" + bookingCode)}`
      }));

    // Prepare order data to send to Order page
    const orderData = {
      bookingCode,
      showtimeId: selectedShowtime._id,
      cinemaId: selectedShowtime.cinemasId?._id,
      roomId: selectedShowtime.roomId?._id,
      movie: {
        title: movie.title,
        posterUrl: movie.posterUrl,
        duration: movie.duration,
        director: movie.director
      },
      showtime: {
        _id: selectedShowtime._id,
        startTime: selectedShowtime.startTime,
        price: selectedShowtime.price,
        cinemasId: selectedShowtime.cinemasId,
        roomId: selectedShowtime.roomId
      },
      cinema: {
        _id: selectedShowtime.cinemasId?._id,
        name: selectedShowtime.cinemasId?.name
      },
      room: {
        _id: selectedShowtime.roomId?._id,
        name: selectedShowtime.roomId?.name
      },
      seats: selectedSeats.map(s => ({ _id: s.id, label: s.label })),
      totalPrice,
      tickets,
      purchaseDate: new Date().toISOString()
    };

      // Also store in localStorage as backup
      localStorage.setItem("lastOrder", JSON.stringify(orderData));

      // Close seat modal first
      closeSeatModal();
      setShowBooking(false);

      // Navigate to Order page with order data
      navigate("/order", { state: { orderData } });
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Có lỗi xảy ra khi lưu đặt vé. Vui lòng thử lại!");
    }
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
                  const dayCount = getTimeSlotsForDate(date).length;
                  return (
                    <div
                      key={date}
                      className={`date-tab ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <span className="date-tab-label">{label}</span>
                      {dayCount > 0 && (
                        <span className="date-tab-count">{dayCount} suất</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="showtime-category">2D PHỤ ĐỀ</div>

              <div className="time-grid">
                {(() => {
                  const daySlots = getTimeSlotsForDate(selectedDate);
                  if (daySlots.length === 0) {
                    return <p className="no-showtimes">Không có suất chiếu cho ngày này</p>;
                  }
                  return daySlots.map((slot) => {
                    const [hours] = slot.time.split(":");
                    const isLate = parseInt(hours) >= 22;
                    const showtime = slot.showtime;

                    return (
                      <div
                        key={slot.time}
                        className={`time-slot ${isLate ? "late" : ""}`}
                        onClick={() => {
                          if (showtime) {
                            handleTimeSlotClick(showtime);
                          }
                        }}
                      >
                        <div className="time-label">{slot.time}</div>
                        <div className="seats">
                          <div className="seats-note">Còn {showtime.roomId?.capacity || 0} ghế</div>
                        </div>
                      </div>
                    );
                  });
                })()}
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
              
            </div>

            <div className="screen">Màn hình</div>

            <div className="seat-grid-modal">
              {seatModalLoading ? (
                <p>Đang tải ghế...</p>
              ) : availableSeats.length === 0 ? (
                <div className="no-seats">
                  <p>Không có ghế khả dụng</p>
                  <p className="seatmap-debug">Room: {selectedShowtime?.roomId?.name || 'N/A'} - Seatmap ID: {selectedShowtime?.seatMap || 'N/A'}</p>
                </div>
              ) : (
                (() => {
                  const rowMap = {};
                  availableSeats.forEach((seat) => {
                    if (!rowMap[seat.row]) rowMap[seat.row] = [];
                    rowMap[seat.row].push(seat);
                  });
                  const sortedRows = Object.keys(rowMap).sort();
                  return sortedRows.map((row) => (
                    <div key={row} className="seat-row">
                      <span className="row-label">{row}</span>
                      <div className="row-seats">
                        {rowMap[row]
                          .sort((a, b) => a.seatNumber - b.seatNumber)
                          .map((seat) => (
                            <button
                              key={seat.id}
                              className={getSeatClass(seat)}
                              onClick={() => toggleSeat(seat)}
                            >
                              {seat.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            <div className="seat-legend">
              <span><i className="available" /> Trống</span>
              <span><i className="selected" /> Đang chọn</span>
              <span><i className="booked" /> Đã đặt</span>
              <span><i className="vip" /> VIP</span>
              <span><i className="couple" /> Đôi</span>
            </div>

            <div className="selection-summary">
              <div>
                <span>Ghế đã chọn</span>
                <strong>
                  {selectedSeats.length > 0
                    ? selectedSeats.map((seat) => seat.label).join(", ")
                    : "Chưa có"}
                </strong>
              </div>
              <div>
                <span>Tạm tính</span>
                <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
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
                onClick={handleBookingConfirmation}
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
