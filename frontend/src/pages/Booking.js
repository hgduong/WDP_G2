import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import "../assets/styles/Booking.css";
import { getImageUrl } from "../utils/imageUtils";
import { createBooking, getShowtimeById } from "../services/api";
import { UserContext } from "../context/UserContext";
import { getWalletBalance, pay } from "../services/transactionsApi";

export default function Booking() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [showtime, setShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    notes: ""
  });

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
      getShowtimeById(showtimeId)
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

  useEffect(() => {
    if (user) {
      getWalletBalance()
        .then((data) => {
          if (data.success && data.data.wallet) {
            setWalletBalance(data.data.wallet.balance || 0);
          }
        })
        .catch((err) => {
          console.error("Error loading wallet balance:", err);
        });
    }
  }, [user]);

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedSeats.length === 0) {
      setError("Vui lòng chọn ít nhất một ghế.");
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone) {
      setError("Vui lòng điền đầy đủ thông tin khách hàng.");
      return;
    }

    // Kiểm tra số dư ví nếu chọn thanh toán bằng ví
    if (paymentMethod === "wallet" && walletBalance < totalPrice) {
      setError("Số dư ví không đủ. Vui lòng nạp thêm tiền hoặc chọn phương thức thanh toán khác.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // Get cinemaId and roomId from showtime
      const cinemaId = showtime.roomId?.cinemaId?._id || showtime.roomId?.cinemaId || showtime.room?.cinemaId?._id || showtime.room?.cinemaId;
      const roomId = showtime.roomId?._id || showtime.roomId || showtime.room?._id || showtime.room;

      const bookingData = {
        userId: user?._id || user?.id || null,
        showtimeId: showtimeId,
        cinemaId: cinemaId,
        roomId: roomId,
        seats: selectedSeats,
        totalPrice: totalPrice,
        customerInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes
        },
        paymentStatus: paymentMethod === "wallet" ? "Paid" : "Unpaid"
      };

      console.log("Creating booking with data:", bookingData);
      const response = await createBooking(bookingData);
      console.log("Booking response:", response);

      if (response.booking || response.message === "Đặt vé thành công") {
        const savedBooking = response.booking;
        
        // Nếu thanh toán bằng ví, thực hiện trừ tiền từ ví
        if (paymentMethod === "wallet") {
          try {
            const paymentResponse = await pay({
              amount: totalPrice,
              description: `Thanh toán đặt vé ${savedBooking.bookingCode}`,
              bookingId: savedBooking._id
            });
            
            if (paymentResponse.success) {
              // Cập nhật số dư ví
              setWalletBalance(paymentResponse.data.wallet.balance);
              console.log("Thanh toán bằng ví thành công");
            } else {
              setError("Thanh toán bằng ví thất bại: " + (paymentResponse.message || "Vui lòng thử lại."));
              setSubmitting(false);
              return;
            }
          } catch (paymentErr) {
            console.error("Error paying with wallet:", paymentErr);
            setError("Có lỗi xảy ra khi thanh toán bằng ví: " + (paymentErr.message || "Vui lòng thử lại."));
            setSubmitting(false);
            return;
          }
        }
        
        // Navigate to Order page with booking data
        navigate("/order", {
          state: {
            orderData: savedBooking
          }
        });
      } else {
        setError(response.message || "Có lỗi xảy ra khi đặt vé");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      setError("Có lỗi xảy ra khi đặt vé: " + (err.message || "Vui lòng thử lại."));
      setSubmitting(false);
    }
  };

  // Default price per seat (can be configured)
  const pricePerSeat = 75000;
  const totalPrice = selectedSeats.length * pricePerSeat;

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="booking">
      <div className="booking-header">
        <h2>Chọn ghế</h2>
        {showtime && (
          <div className="showtime-info">
            <p>Suất chiếu: {new Date(showtime.startTime).toLocaleString("vi-VN")}</p>
            <p>Rạp: {showtime.roomId?.cinemaId?.name || showtime.room?.cinemaId?.name || "N/A"}</p>
            <p>Phòng: {showtime.roomId?.name || showtime.room?.name || "N/A"}</p>
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

      {error && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="customer-form" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
        <h3 style={{ marginBottom: '15px' }}>Thông tin khách hàng</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Họ tên *</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleFormChange}
            placeholder="Nhập họ tên"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleFormChange}
            placeholder="Nhập email"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Số điện thoại *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleFormChange}
            placeholder="Nhập số điện thoại"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ghi chú</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleFormChange}
            placeholder="Nhập ghi chú (nếu có)"
            rows="3"
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' }}
          />
        </div>

        <div className="summary" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <div className="price-info">
            <span>Số ghế: {selectedSeats.length}</span>
            <span className="total-price" style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#4CAF50' }}>
              Tổng tiền: {totalPrice.toLocaleString("vi-VN")}đ
            </span>
          </div>
          
          {user && (
            <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
              <h4 style={{ marginBottom: '10px', color: '#0066cc' }}>Phương thức thanh toán</h4>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={paymentMethod === "wallet"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Thanh toán bằng ví</span>
                  <span style={{ marginLeft: '10px', color: walletBalance >= totalPrice ? '#4CAF50' : '#f44336' }}>
                    (Số dư: {walletBalance.toLocaleString("vi-VN")}đ)
                  </span>
                </label>
                {paymentMethod === "wallet" && walletBalance < totalPrice && (
                  <div style={{ color: '#f44336', fontSize: '0.9em', marginLeft: '24px', marginTop: '5px' }}>
                    Số dư không đủ. Vui lòng nạp thêm tiền.
                  </div>
                )}
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="other"
                    checked={paymentMethod === "other"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Thanh toán sau (tại quầy)</span>
                </label>
              </div>
            </div>
          )}
          
          <button 
            type="submit"
            className="btn" 
            disabled={selectedSeats.length === 0 || submitting || (paymentMethod === "wallet" && walletBalance < totalPrice)}
            style={{ 
              marginTop: '15px',
              padding: '15px 30px',
              fontSize: '1.1em',
              backgroundColor: selectedSeats.length === 0 || (paymentMethod === "wallet" && walletBalance < totalPrice) ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedSeats.length === 0 || (paymentMethod === "wallet" && walletBalance < totalPrice) ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? "Đang xử lý..." : "Xác nhận đặt vé"}
          </button>
        </div>
      </form>
    </div>
  );
}
