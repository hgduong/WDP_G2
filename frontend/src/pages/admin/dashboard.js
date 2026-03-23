import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllMovies, getAllCinemas, getAllShowtimes } from "../../services/api";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    movies: 0,
    cinemas: 0,
    showtimes: 0,
    nowShowing: 0,
    comingSoon: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [movies, cinemas, showtimes] = await Promise.all([
        getAllMovies(),
        getAllCinemas(),
        getAllShowtimes(),
      ]);

      const nowShowing = movies.filter((movie) => movie.status === "NowShowing").length;
      const comingSoon = movies.filter((movie) => movie.status === "ComingSoon").length;

      setStats({
        movies: movies.length,
        cinemas: cinemas.length,
        showtimes: showtimes.length,
        nowShowing,
        comingSoon,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const menuItems = [
    {
      title: "Quan ly Phim",
      description: "Them, sua, xoa phim va cap nhat thong tin phim.",
      icon: "PM",
      path: "/admin/movies",
      color: "#e50914",
    },
    {
      title: "Quan ly Rap & Phong",
      description: "Theo doi rap chieu, phong chieu va cau hinh su dung.",
      icon: "RP",
      path: "/admin/cinemas",
      color: "#ffc107",
    },
    {
      title: "Quan ly Lich Chieu",
      description: "Tao va dieu chinh suat chieu cho tung rap, tung phong.",
      icon: "LC",
      path: "/admin/showtimes",
      color: "#17a2b8",
    },
    {
      title: "Dang ky Staff",
      description: "Tao tai khoan nhan vien moi voi day du thong tin co ban.",
      icon: "DK",
      path: "/admin/staff-register",
      color: "#6f42c1",
    },
    {
      title: "Quan ly Nhan Vien",
      description: "Xem danh sach, cap nhat trang thai va doi mat khau staff.",
      icon: "NV",
      path: "/admin/staffs",
      color: "#28a745",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Xin chao, Admin!</h2>
        <p>Day la trung tam dieu phoi chinh cua Time Cinemas.</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">PM</div>
          <div className="stat-info">
            <h3>{stats.movies}</h3>
            <p>Tong so phim</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">RP</div>
          <div className="stat-info">
            <h3>{stats.cinemas}</h3>
            <p>Tong so rap</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">LC</div>
          <div className="stat-info">
            <h3>{stats.showtimes}</h3>
            <p>Lich chieu</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">DC</div>
          <div className="stat-info">
            <h3>{stats.nowShowing}</h3>
            <p>Dang chieu</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">SC</div>
          <div className="stat-info">
            <h3>{stats.comingSoon}</h3>
            <p>Sap chieu</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Chuc nang quan ly</h3>
        <div className="action-grid">
          {menuItems.map((item) => (
            <div
              key={item.path}
              className="action-card"
              onClick={() => navigate(item.path)}
              style={{ borderTopColor: item.color }}
            >
              <div className="action-icon">{item.icon}</div>
              <div className="action-content">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
              <div className="action-arrow">{"->"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h4>Goi y su dung</h4>
          <ul>
            <li>
              <strong>Dang ky Staff:</strong> Tao nhanh tai khoan staff moi tu form rieng.
            </li>
            <li>
              <strong>Quan ly Nhan Vien:</strong> Xem danh sach, sua thong tin va doi mat khau.
            </li>
            <li>
              <strong>Lich chieu:</strong> Theo doi suat chieu va phoi hop voi rap.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
