// src/components/movie/SeatSelectionModal.jsx
import { useState, useEffect } from "react";
import { holdSeats, releaseSeats, getStaffBookingSeatMap, createBooking } from "../services/api";

const HOLDING_TIME = 10; // giây

export default function SeatSelectionModal({
  isOpen,
  selectedShowtime,
  movie,
  user,
  socketRef,
  onClose,
  onBookingSuccess,
}) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [seatModalLoading, setSeatModalLoading] = useState(false);
  const [holdingSeats, setHoldingSeats] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [remoteHeldSeats, setRemoteHeldSeats] = useState([]);

  // Socket listener
  useEffect(() => {
    if (!isOpen || !selectedShowtime || !socketRef?.current) return;

    const showtimeId = selectedShowtime._id;
    const socket = socketRef.current;

    socket.emit("join_showtime", showtimeId);

    socket.on("seat_held", (data) => {
      if (data.userId !== user?._id) {
        setRemoteHeldSeats((prev) => [...prev, { _id: data.seatId, ...data }]);
      }
    });

    socket.on("seat_released", (data) => {
      setRemoteHeldSeats((prev) => prev.filter((s) => s._id !== data.seatId));
    });

    socket.on("seat_booked", (data) => {
      setRemoteHeldSeats((prev) => prev.filter((s) => s._id !== data.seatId));
      setSelectedSeats((prev) => prev.filter((s) => s.id !== data.seatId));
    });

    return () => {
      socket.emit("leave_showtime", showtimeId);
      socket.off("seat_held");
      socket.off("seat_released");
      socket.off("seat_booked");
    };
  }, [isOpen, selectedShowtime, user]);

  // Load seat map
  useEffect(() => {
    if (!isOpen || !selectedShowtime) return;

    setSeatModalLoading(true);
    getStaffBookingSeatMap(selectedShowtime._id)
      .then((seatmapData) => {
        const seats = seatmapData?.seats || seatmapData || [];
        const transformed = seats.map((seat) => ({
          id: seat._id,
          label: seat.type === "Couple"
            ? `${seat.row}${seat.number}-${seat.number + 1}`
            : `${seat.row}${seat.number}`,
          row: seat.row,
          seatNumber: seat.number,
          type: seat.type,
          status: seat.status,
          isCouple: seat.type === "Couple",
        }));
        setAvailableSeats(transformed);
      })
      .catch((err) => console.error("Error loading seatmap:", err))
      .finally(() => setSeatModalLoading(false));
  }, [isOpen, selectedShowtime]);

  // Toggle seat
  const toggleSeat = (seat) => {
    if (seat.status === "Booked") {
      alert("Ghế này đã được đặt!");
      return;
    }

    const isRemoteHeld = remoteHeldSeats.some((s) => s._id === seat.id);
    if (isRemoteHeld) {
      alert("Ghế này đang được người khác chọn!");
      return;
    }

    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seat.id);

      if (isSelected) {
        // Deselect
        releaseSeats([seat.id]).catch(console.error);
        socketRef.current?.emit("release_seat", {
          showtimeId: selectedShowtime._id,
          seatId: seat.id,
        });

        setHoldingSeats((prevHolding) => {
          const newHolding = { ...prevHolding };
          delete newHolding[seat.id];
          return newHolding;
        });

        return prev.filter((s) => s.id !== seat.id);
      } else {
        // Select
        const expiryTime = Date.now() + HOLDING_TIME * 1000;
        setHoldingSeats((prev) => ({ ...prev, [seat.id]: expiryTime }));

        holdSeats(selectedShowtime._id, [seat.id], user?._id).catch(console.error);

        socketRef.current?.emit("hold_seat", {
          showtimeId: selectedShowtime._id,
          seatId: seat.id,
          userId: user?._id,
          heldUntil: expiryTime,
        });

        return [...prev, seat];
      }
    });
  };

  // Countdown timer
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setCountdown(0);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const minExpiry = Math.min(...Object.values(holdingSeats));

      const remaining = Math.max(0, Math.floor((minExpiry - now) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        setSelectedSeats((prev) => prev.filter((s) => holdingSeats[s.id] > now));
        setHoldingSeats((prev) => {
          const newH = { ...prev };
          Object.keys(newH).forEach((key) => {
            if (newH[key] <= now) delete newH[key];
          });
          return newH;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length, holdingSeats]);

  const totalPrice = selectedSeats.length * (selectedShowtime?.price || 75000);

  // ==================== XÁC NHẬN ĐẶT VÉ ====================
 // Trong SeatSelectionModal.jsx

const handleBookingConfirmation = async () => {
  if (selectedSeats.length === 0) {
    alert("Vui lòng chọn ít nhất một ghế!");
    return;
  }

  try {
    // LẤY CINEMAID ĐÚNG CÁCH TỪ ROOM
    const room = selectedShowtime.roomId || selectedShowtime.room;
    const cinemaId = room?.cinemaId?._id || room?.cinemaId;

    if (!cinemaId) {
      alert("Không tìm thấy thông tin rạp. Vui lòng thử lại!");
      console.error("Missing cinemaId - room data:", room);
      return;
    }

    const payload = {
      showtimeId: selectedShowtime._id,
      cinemaId: cinemaId,                    // ← Quan trọng
      roomId: selectedShowtime.roomId?._id || selectedShowtime.roomId || room?._id,
      seatIds: selectedSeats.map((s) => s.id),
      totalPrice: selectedSeats.length * (selectedShowtime.price || 75000),
      customerName: user?.fullName?.trim() || "Khách vãng lai",
      customerPhone: user?.phone?.trim() || "",
      customerEmail: user?.email?.trim() || "",
      notes: "Đặt vé từ trang chi tiết phim",
      paymentStatus: "Pending",
    };

    console.log("📤 Payload gửi lên backend:", payload);

    const bookingResult = await createBooking(payload);

    // Tạo orderData để chuyển sang trang Order
    const orderData = {
      bookingCode: bookingResult?.booking?.bookingCode || `BK${Date.now().toString().slice(-8)}`,
      movie: movie,
      cinema: room?.cinemaId || { name: "N/A" },   // Có thể cải thiện sau
      room: room || { name: "N/A" },
      showtime: selectedShowtime,
      seats: selectedSeats.map((s) => ({ _id: s.id, label: s.label })),
      totalPrice: selectedSeats.length * (selectedShowtime.price || 75000),
      tickets: bookingResult?.tickets || [],
      purchaseDate: new Date().toISOString(),
    };

    onBookingSuccess(orderData);

  } catch (error) {
    console.error("❌ Booking error:", error.response?.data || error.message);
    const msg = error.response?.data?.message || "Không thể đặt vé. Vui lòng thử lại!";
    alert(`Đặt vé thất bại: ${msg}`);
  }
};

  const formatCountdown = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const getSeatClass = (seat) => {
    const classes = ["seat-button"];
    const isRemoteHeld = remoteHeldSeats.some((s) => s._id === seat.id);

    if (isRemoteHeld) classes.push("holding");
    else if (seat.status === "Booked") classes.push("booked");
    else if (selectedSeats.some((s) => s.id === seat.id)) classes.push("selected", "holding");
    else classes.push("available");

    if (seat.isCouple) classes.push("couple");
    if (seat.type === "VIP") classes.push("vip");

    return classes.join(" ");
  };

  if (!isOpen || !selectedShowtime) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="seat-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="seat-modal-header">
          <h3>Chọn ghế - {movie?.title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="seat-modal-info">
          <p><strong>Suất chiếu:</strong> {new Date(selectedShowtime.startTime).toLocaleString("vi-VN")}</p>
          <p><strong>Rạp:</strong> {selectedShowtime.cinemasId?.name || selectedShowtime.cinema?.name || "N/A"}</p>
          <p><strong>Phòng:</strong> {selectedShowtime.roomId?.name || selectedShowtime.room?.name || "N/A"}</p>
        </div>

        <div className="screen">MÀN HÌNH CHIẾU</div>

        <div className="seat-grid-modal">
          {seatModalLoading ? (
            <p>Đang tải sơ đồ ghế...</p>
          ) : availableSeats.length === 0 ? (
            <p>Không có ghế khả dụng cho suất chiếu này.</p>
          ) : (
            (() => {
              const rowMap = {};
              availableSeats.forEach((seat) => {
                if (!rowMap[seat.row]) rowMap[seat.row] = [];
                rowMap[seat.row].push(seat);
              });

              return Object.keys(rowMap)
                .sort()
                .map((row) => (
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
          <span><i className="couple" /> Ghế đôi</span>
        </div>

        <div className="selection-summary">
          <div>
            Ghế đã chọn: <strong>{selectedSeats.map((s) => s.label).join(", ") || "Chưa có"}</strong>
          </div>
          <div>
            Tổng tiền: <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
          </div>
        </div>

        <div className="seat-modal-footer">
          {countdown > 0 && (
            <div className="countdown-info">
              Thời gian giữ ghế còn lại: <span className="countdown-timer">{formatCountdown(countdown)}</span>
            </div>
          )}
          <button
            className="btn btn-primary"
            disabled={selectedSeats.length === 0}
            onClick={handleBookingConfirmation}
          >
            Xác nhận đặt vé ({selectedSeats.length} ghế)
          </button>
        </div>
      </div>
    </div>
  );
}