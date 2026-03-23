import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import "../../assets/styles/StaffDashboard.css";

const quickActions = [
  {
    title: "Ho so ca nhan",
    description: "Kiem tra thong tin tai khoan va cap nhat lien he khi can.",
    path: "/profile",
    tone: "sunrise",
  },
  {
    title: "Lich chieu hom nay",
    description: "Mo nhanh khu vuc phim de theo doi suat chieu dang ban.",
    path: "/",
    tone: "ocean",
  },
  {
    title: "Dang nhap Staff",
    description: "Quay lai cong staff de kiem tra tai khoan va luong truy cap.",
    path: "/staff-login",
    tone: "ember",
  },
];

function StaffDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  return (
    <div className="staff-dashboard-page">
      <section className="staff-hero">
        <div className="staff-hero-copy">
          <span className="staff-eyebrow">Staff Workspace</span>
          <h1>Xin chao {user?.fullName || "Nhan vien"}.</h1>
          <p>
            Day la khu vuc lam viec danh cho nhan vien rap. Ban co the kiem tra
            thong tin ca nhan, theo doi nhung viec can lam trong ngay va di
            chuyen nhanh den cac cong viec thuong dung.
          </p>
          <div className="staff-hero-actions">
            <button onClick={() => navigate("/profile")}>Mo ho so</button>
            <button
              className="secondary"
              onClick={() => navigate("/")}
            >
              Ve trang chu
            </button>
          </div>
        </div>

        <div className="staff-shift-card">
          <p className="label">Vai tro</p>
          <strong>{user?.role || "Staff"}</strong>
          <p className="label">Email</p>
          <strong>{user?.email || "staff@timecinemas.vn"}</strong>
          <p className="label">Trang thai ca truc</p>
          <span className="status-pill">San sang phuc vu</span>
        </div>
      </section>

      <section className="staff-grid">
        <article className="staff-panel">
          <h2>Viec can uu tien</h2>
          <ul className="staff-checklist">
            <li>Xac nhan lich lam va suat chieu trong ngay.</li>
            <li>Kiem tra thong tin lien he trong ho so ca nhan.</li>
            <li>Dam bao tai khoan staff dang hoat dong on dinh.</li>
          </ul>
        </article>

        <article className="staff-panel emphasis">
          <h2>Nhip lam viec hom nay</h2>
          <div className="staff-metrics">
            <div>
              <span>01</span>
              <p>Ca truc dang mo</p>
            </div>
            <div>
              <span>03</span>
              <p>Diem can kiem tra</p>
            </div>
            <div>
              <span>100%</span>
              <p>San sang vao ca</p>
            </div>
          </div>
        </article>
      </section>

      <section className="staff-actions-section">
        <div className="section-head">
          <h2>Di chuyen nhanh</h2>
          <p>Nhung loi di ngan nhat de staff bat dau cong viec.</p>
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
              <span>Mo ngay</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StaffDashboard;
