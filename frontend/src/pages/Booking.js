import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../assets/styles/Booking.css";
import { getImageUrl } from "../utils/imageUtils";

export default function Booking() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [showtime, setShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tạo danh sách ghế: 10 ghế mỗi hàng, hàng cuối là ghế đôi
  const generateSeats = (totalSeats) => {
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E'];
    let seatIndex = 1;
    
    rows.forEach((row, rowIndex) => {
      // Hàng cuối cùng (E) là ghế đôi
      if (rowIndex === rows.length - 1) {
        for (let i = 0; i < 5; i++) {
          seats.push({
            id: `${row}${seatIndex}`,
            label: `${row}${seatIndex}`,
            isCouple: true,
            row: row,
            seatNumber: seatIndex
          });
          seatIndex += 2; // Skip every other seat for couple (E1, E3, E5...)
        }
      } else {
        // Các hàng khác: 10 ghế thường
        for (let i = 0; i < 10; i++) {
          seats.push({
            id: `${row}${seatIndex}`,
            label: `${row}${seatIndex}`,
            isCouple: false,
            row: row,
            seatNumber: seatIndex
          });
          seatIndex++;
        }
      }
    });
    return seats;
  };

  const allSeats = generateSeats(50);

  useEffect(() => {
    if (showtimeId) {
      fetch(`http://localhost:9999/showtimes/${showtimeId}`)
        .then((res) => res.json())
        .then((data) => {
          setShowtime(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading showtime:", err);
          setLoading(false);
        });
    }
  }, [showtimeId]);

  const toggleSeat = (seat) => {
    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seat.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const getSeatClass = (seat) => {
    if (selectedSeats.some((s) => s.id === seat.id)) {
      return "seat selected";
    }
    if (seat.isCouple) {
      return "seat couple";
    }
    return "seat";
  };

  const totalPrice = selectedSeats.length * (showtime?.price || 75000);

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="booking">
      <div className="booking-header">
        <h2>Chọn ghế</h2>
        {showtime && (
          <div className="showtime-info">
            <p>Suất chiếu: {new Date(showtime.startTime).toLocaleString("vi-VN")}</p>
            <p>Rạp: {showtime.cinemasId?.name}</p>
            <p>Phòng: {showtime.roomId?.name}</p>
          </div>
        )}
      </div>

      <div className="screen">Màn hình</div>

      <div className="seat-grid">
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
          <span className="seat selected"></span>
          <span>Ghế đang chọn</span>
        </div>
        <div className="legend-item">
          <span className="seat couple"></span>
          <span>Ghế đôi</span>
        </div>
      </div>

      <div className="selected-seats">
        <h3>Ghế đã chọn:</h3>
        <div className="selected-list">
          {selectedSeats.length === 0 ? (
            <span>Chưa chọn ghế nào</span>
          ) : (
            selectedSeats.map((seat) => (
              <span key={seat.id} className="selected-seat-tag">
                {seat.label}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="summary">
        <div className="price-info">
          <span>Số ghế: {selectedSeats.length}</span>
          <span className="total-price">
            Tổng tiền: {totalPrice.toLocaleString("vi-VN")}đ
          </span>
        </div>
        <button 
          className="btn" 
          disabled={selectedSeats.length === 0}
          onClick={() => {
            // Navigate to checkout with selected seats
            navigate("/checkout", {
              state: {
                showtimeId: showtimeId,
                selectedSeats: selectedSeats,
                totalPrice: totalPrice,
                showtime: showtime
              }
            });
          }}
        >
          Thanh toán
        </button>
      </div>
    </div>
  );
}
