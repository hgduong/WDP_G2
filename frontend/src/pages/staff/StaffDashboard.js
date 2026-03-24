import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import "../../assets/styles/StaffDashboard.css";

const quickActions = [
  {
    title: "Đặt chỗ tại quầy",
    description: "Mở sơ đồ ghế, nhập thông tin khách và xác nhận booking nhanh.",
    path: "/staff/bookings",
    tone: "sunrise",
  },
  {
    title: "Hồ sơ cá nhân",
    description: "Kiểm tra thông tin tài khoản và cập nhật liên hệ khi cần.",
    path: "/profile",
    tone: "ocean",
  },
  {
    title: "Lịch chiếu hôm nay",
    description: "Mở nhanh khu vực phim để theo dõi suất chiếu đang bán.",
    path: "/showtimes",
    tone: "ember",
  },
  {
    title: "Đăng nhập staff",
    description: "Quay lại cổng staff để kiểm tra tài khoản và luồng truy cập.",
    path: "/staff-login",
    tone: "sunrise",
  },
];

function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  return (
    <div className="staff-dashboard-page">
      <section className="staff-hero">
        <div className="staff-hero-copy">
          <span className="staff-eyebrow">Không gian làm việc staff</span>
          <h1>Xin chào {user?.fullName || "nhân viên"}.</h1>
          <p>
            Đây là khu vực làm việc dành cho nhân viên rạp. Bạn có thể kiểm tra
            thông tin cá nhân, theo dõi những việc cần làm trong ngày và di
            chuyển nhanh đến các công việc thường dùng.
          </p>
          <div className="staff-hero-actions">
            <button onClick={() => navigate("/staff/bookings")}>Mở bàn đặt chỗ</button>
            <button
              className="secondary"
              onClick={() => navigate("/showtimes")}
            >
              Xem lịch chiếu
            </button>
          </div>
        </div>

        <div className="staff-shift-card">
          <p className="label">Vai trò</p>
          <strong>{user?.role || "Staff"}</strong>
          <p className="label">Email</p>
          <strong>{user?.email || "staff@timecinemas.vn"}</strong>
          <p className="label">Trạng thái ca trực</p>
          <span className="status-pill">Sẵn sàng phục vụ</span>
        </div>
      </section>

      <section className="staff-grid">
        <article className="staff-panel">
          <h2>Việc cần ưu tiên</h2>
          <ul className="staff-checklist">
            <li>Chọn suất chiếu đang bán và kiểm tra số ghế trống.</li>
            <li>Đặt chỗ nhanh cho khách tại quầy, theo nhóm hoặc thanh toán sau.</li>
            <li>Cập nhật hồ sơ và giữ tài khoản staff luôn sẵn sàng.</li>
          </ul>
        </article>

        <article className="staff-panel emphasis">
          <h2>Nhịp làm việc hôm nay</h2>
          <div className="staff-metrics">
            <div>
              <span>01</span>
              <p>Ca trực đang mở</p>
            </div>
            <div>
              <span>03</span>
              <p>Điểm cần kiểm tra</p>
            </div>
            <div>
              <span>100%</span>
              <p>Sẵn sàng vào ca</p>
            </div>
          </div>
        </article>
      </section>

      <section className="staff-actions-section">
        <div className="section-head">
          <h2>Di chuyển nhanh</h2>
          <p>Những lối đi ngắn nhất để staff bắt đầu công việc.</p>
        </div>

        <div className="staff-action-cards">
          {quickActions.map((action) => (
            <button
              key={action.title}
              className={`staff-action-card ${action.tone}`}
              onClick={() => navigate(action.path)}
            >
              <strong>{action.title}</strong>
              <p>{action.description}</p>
              <span>Mở ngay</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StaffDashboard;
