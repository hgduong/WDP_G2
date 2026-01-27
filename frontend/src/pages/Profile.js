// src/pages/Profile.jsx
import "../assets/styles/Profile.css";

export default function Profile() {
  return (
    <div className="profile">
      <h1>Thông tin cá nhân</h1>
      <p>Email: user@example.com</p>
      <h2>Lịch sử đặt vé</h2>
      <ul>
        <li>Avengers - CGV Hà Nội - Ghế A1, A2</li>
        <li>Batman - Lotte Hà Nội - Ghế B3</li>
      </ul>
    </div>
  );
}
