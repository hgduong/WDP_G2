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
      title: "Quản lý Phim",
      description: "Thêm mới, cập nhật và xóa phim trong hệ thống.",
      icon: "PM",
      path: "/admin/movies",
      color: "#e50914",
    },
    {
      title: "Quản lý Rạp & Phòng",
      description: "Theo dõi rạp chiếu, phòng chiếu và cấu hình sử dụng.",
      icon: "RP",
      path: "/admin/cinemas",
      color: "#ffc107",
    },
    {
      title: "Quản lý Lịch Chiếu",
      description: "ạo và điều chỉnh suất chiếu cho từng rạp, từng phòng.",
      icon: "LC",
      path: "/admin/showtimes",
      color: "#17a2b8",
    },
    {
      title: "Đăng ký Staff",
      description: "ạo tài khoản nhân viên mới với đầy đủ thông tin cơ bản.",
      icon: "DK",
      path: "/admin/staff-register",
      color: "#6f42c1",
    },
    {
      title: "Quản lý Nhân Viên",
      description: "Xem danh sách, cập nhật trạng thái và đổi mật khẩu staff.",
      icon: "NV",
      path: "/admin/staffs",
      color: "#28a745",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Xin chào!</h2>
        <p>Chào mừng bạn đến với trang quản trị của Time Cinemas.</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">PM</div>
          <div className="stat-info">
            <h3>{stats.movies}</h3>
            <p>Tổng số phim</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">RP</div>
          <div className="stat-info">
            <h3>{stats.cinemas}</h3>
            <p>Tổng số rạp</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">LC</div>
          <div className="stat-info">
            <h3>{stats.showtimes}</h3>
            <p>Lịch chiếu</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">DC</div>
          <div className="stat-info">
            <h3>{stats.nowShowing}</h3>
            <p>Đang chiếu</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">SC</div>
          <div className="stat-info">
            <h3>{stats.comingSoon}</h3>
            <p>Sắp chiếu</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Chức năng quản lý</h3>
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
              <strong>Đăng ký Staff:</strong> ạo nhanh tài khoản staff mới từ form riêng.
            </li>
            <li>
              <strong>Quản lý Nhân Viên:</strong> Xem danh sách, sửa thông tin và đổi mật khẩu.
            </li>
            <li>
              <strong>Lịch chiếu:</strong> Theo dõi suất chiếu và phối hợp với rạp.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
