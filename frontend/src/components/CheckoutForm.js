// src/pages/Checkout.jsx
import "../assets/styles/Checkout.css";

export default function Checkout() {
  return (
    <div className="checkout">
      <h1>Thanh toán vé</h1>
      <p>Phim: Avengers</p>
      <p>Suất chiếu: CGV Hà Nội - 19:00</p>
      <p>Ghế: A1, A2</p>
      <p>Tổng tiền: 200.000đ</p>

      <form className="form">
        <input type="text" placeholder="Họ tên" />
        <input type="email" placeholder="Email" />
        <input type="tel" placeholder="Số điện thoại" />
        <button className="btn">Xác nhận</button>
      </form>
    </div>
  );
}
