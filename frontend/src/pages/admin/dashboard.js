import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllMovies } from "../../services/moviesApi";
import { getAllCinemas } from "../../services/cinemasApi";
import { getAllShowtimes } from "../../services/showtimesApi";
import { getAllBookings } from "../../services/staffApi";
import "./Dashboard.css";

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  return new Date(dateStr);
};

const WEEK_OPTIONS = [
  { value: 7, label: "7 ngày" },
  { value: 14, label: "14 ngày" },
  { value: 30, label: "30 ngày" },
  { value: -1, label: "Tùy chọn" },
  { value: 0, label: "Tất cả" },
];

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    movies: 0,
    cinemas: 0,
    showtimes: 0,
    nowShowing: 0,
    comingSoon: 0,
  });
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    topMovies: [],
    weeklyData: [],
    loading: true,
  });
  const [weekFilter, setWeekFilter] = useState(7);
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  useEffect(() => {
    fetchStats();
    fetchRevenueStats();
  }, [weekFilter]);

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

  const fetchRevenueStats = async () => {
    try {
      setRevenueStats((prev) => ({ ...prev, loading: true }));
      
      const bookings = await getAllBookings({ limit: 1000 });
      const movies = await getAllMovies();
      const showtimes = await getAllShowtimes();

      // Filter by date range
      const completedBookings = bookings.filter((b) => {
        const isCompleted = b.status === "Completed" || b.paymentStatus === "Paid";
        if (!isCompleted) return false;
        
        const createdAt = parseDate(b.createdAt);
        if (!createdAt) return false;
        
        if (weekFilter === 0) return true;
        
        if (weekFilter === -1 && customDateFrom && customDateTo) {
          const from = new Date(customDateFrom);
          from.setHours(0, 0, 0, 0);
          const to = new Date(customDateTo);
          to.setHours(23, 59, 59, 999);
          return createdAt >= from && createdAt <= to;
        }
        
        return createdAt >= getDaysAgo(weekFilter);
      });

      const totalRevenue = completedBookings.reduce(
        (sum, b) => sum + (b.totalPrice || 0),
        0
      );

      // Group revenue by movie
      const movieRevenue = {};
      completedBookings.forEach((booking) => {
        const showtime = showtimes.find(
          (s) => s._id === booking.showtimeId?._id || s._id === booking.showtimeId
        );
        if (showtime) {
          const movieId = showtime.movieId?._id || showtime.movieId;
          const movie = movies.find((m) => m._id === movieId);
          const movieTitle = movie?.title || "Phim không xác định";

          if (!movieRevenue[movieTitle]) {
            movieRevenue[movieTitle] = { revenue: 0, count: 0 };
          }
          movieRevenue[movieTitle].revenue += booking.totalPrice || 0;
          movieRevenue[movieTitle].count += 1;
        }
      });

      // Top movies
      const topMovies = Object.entries(movieRevenue)
        .map(([title, data]) => ({ title, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Weekly breakdown
      const weeklyDataMap = {};
      
      let startDate, endDate;
      if (weekFilter === -1 && customDateFrom && customDateTo) {
        startDate = new Date(customDateFrom);
        endDate = new Date(customDateTo);
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - (weekFilter || 30));
      }
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        weeklyDataMap[key] = { revenue: 0, count: 0, date: d.toISOString() };
      }

      completedBookings.forEach((booking) => {
        const createdAt = parseDate(booking.createdAt);
        if (!createdAt) return;
        const key = `${createdAt.getDate()}/${createdAt.getMonth() + 1}`;
        if (weeklyDataMap[key]) {
          weeklyDataMap[key].revenue += booking.totalPrice || 0;
          weeklyDataMap[key].count += 1;
        }
      });

      const weeklyData = Object.entries(weeklyDataMap)
        .map(([key, data]) => ({ label: key, ...data }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setRevenueStats({
        totalRevenue,
        totalBookings: completedBookings.length,
        topMovies,
        weeklyData,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch revenue stats:", error);
      setRevenueStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const menuItems = [
    {
      title: "Quản lý phim",
      description: "Thêm mới, cập nhật và xóa phim trong hệ thống.",
      icon: "PM",
      path: "/admin/movies",
      color: "#e50914",
    },
    {
      title: "Quản lý rạp và phòng",
      description: "Theo dõi rạp chiếu, phòng chiếu và cấu hình sử dụng.",
      icon: "RP",
      path: "/admin/cinemas",
      color: "#ffc107",
    },
    {
      title: "Quản lý Lịch Chiếu",
      description: "Tạo và điều chỉnh suất chiếu cho từng rạp, từng phòng.",
      icon: "LC",
      path: "/admin/showtimes",
      color: "#17a2b8",
    },
    {
      title: "Đăng ký Staff",
      description: "Tạo tài khoản nhân viên mới với đầy đủ thông tin cơ bản.",
      icon: "DK",
      path: "/admin/staff-register",
      color: "#6f42c1",
    },
    {
      title: "Quản lý nhân viên",
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

      <div className="stats-container">
        <div className="stat-card" style={{ flex: "0 0 100%", marginBottom: "20px" }}>
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)" }}>DT</div>
          <div className="stat-info">
            <h3>{revenueStats.loading ? "..." : formatMoney(revenueStats.totalRevenue)}</h3>
            <p>Tổng doanh thu ({revenueStats.totalBookings} đơn)</p>
          </div>
        </div>

        {/* Week Filter */}
        <div style={{ flex: "0 0 100%", marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {WEEK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setWeekFilter(opt.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                background: weekFilter === opt.value 
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                  : "#e9ecef",
                color: weekFilter === opt.value ? "#fff" : "#333",
                transition: "all 0.2s ease",
              }}
            >
              {opt.label}
            </button>
          ))}
          
          {weekFilter === -1 && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                max={customDateTo || getTodayStr()}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}
              />
              <span style={{ color: "#666" }}>đến</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                min={customDateFrom}
                max={getTodayStr()}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}
              />
              <button
                onClick={() => fetchRevenueStats()}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  background: "#28a745",
                  color: "#fff",
                }}
              >
                Lọc
              </button>
            </div>
          )}
        </div>

        {/* Bar Chart - Weekly Revenue */}
        {!revenueStats.loading && revenueStats.weeklyData.length > 0 && (
          <div style={{ flex: "0 0 100%", marginBottom: "24px", padding: "16px", background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h4 style={{ marginBottom: "16px", color: "#333" }}>Doanh thu theo ngày</h4>
            <div style={{ 
              display: "flex", 
              alignItems: "flex-end", 
              gap: "3px", 
              height: "150px",
              paddingTop: "10px",
              overflowX: "auto"
            }}>
              {revenueStats.weeklyData.map((day, index) => {
                const maxRevenue = Math.max(...revenueStats.weeklyData.map(d => d.revenue), 1);
                const height = day.revenue > 0 ? (day.revenue / maxRevenue) * 130 : 4;
                const isLast = index === revenueStats.weeklyData.length - 1;
                return (
                  <div 
                    key={day.label + index}
                    style={{ 
                      flex: "0 0 auto",
                      minWidth: "20px",
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center",
                      gap: "4px"
                    }}
                    title={`${day.label}: ${formatMoney(day.revenue)} (${day.count} đơn)`}
                  >
                    <div style={{ 
                      width: "18px", 
                      height: `${height}px`, 
                      background: isLast
                        ? "linear-gradient(180deg, #e50914, #ff6b6b)"
                        : "linear-gradient(180deg, #667eea, #764ba2)",
                      borderRadius: "3px 3px 0 0",
                      minHeight: "4px",
                      transition: "height 0.3s ease"
                    }} />
                    <span style={{ fontSize: "9px", color: "#666", whiteSpace: "nowrap" }}>{day.label.split('/')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Movies */}
        {!revenueStats.loading && revenueStats.topMovies.length > 0 && (
          <div className="top-movies-section" style={{ flex: "0 0 100%", marginTop: "10px" }}>
            <h4 style={{ marginBottom: "12px", color: "#333" }}>Top phim bán chạy</h4>
            <div className="top-movies-list">
              {revenueStats.topMovies.map((movie, index) => (
                <div key={movie.title} className="top-movie-item" style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "500", color: "#333" }}>
                      {index + 1}. {movie.title}
                    </span>
                    <span style={{ fontWeight: "600", color: "#28a745" }}>
                      {formatMoney(movie.revenue)}
                    </span>
                  </div>
                  <div style={{ 
                    height: "8px", 
                    background: "#e9ecef", 
                    borderRadius: "4px",
                    overflow: "hidden" 
                  }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${(movie.revenue / revenueStats.topMovies[0].revenue) * 100}%`,
                      background: index === 0 
                        ? "linear-gradient(90deg, #e50914, #ff6b6b)" 
                        : "linear-gradient(90deg, #667eea, #764ba2)",
                      borderRadius: "4px",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {movie.count} vé
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!revenueStats.loading && revenueStats.topMovies.length === 0 && (
          <div style={{ flex: "0 0 100%", textAlign: "center", padding: "20px", color: "#666" }}>
            Chưa có doanh thu trong khoảng thời gian này
          </div>
        )}
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
          <h4>Gợi ý sử dụng</h4>
          <ul>
            <li>
              <strong>Đăng ký staff:</strong> Tạo nhanh tài khoản staff mới từ form riêng.
            </li>
            <li>
              <strong>Quản lý nhân viên:</strong> Xem danh sách, sửa thông tin và đổi mật khẩu.
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
