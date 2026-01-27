// src/pages/Booking.jsx
import "../assets/styles/Booking.css";

export default function Booking() {
  return (
    <div className="booking">
      <h1>Chọn ghế</h1>
      <div className="seat-grid">
        {Array.from({ length: 32 }, (_, i) => (
          <button key={i} className="seat">{`A${i + 1}`}</button>
        ))}
      </div>
      <div className="summary">
        <span>Tổng tiền: 200.000đ</span>
        <button className="btn">Thanh toán</button>
      </div>
    </div>
  );
}
