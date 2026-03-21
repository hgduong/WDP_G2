import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMovies, getAllCinemas, getAllShowtimes } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    movies: 0,
    cinemas: 0,
    showtimes: 0,
    nowShowing: 0,
    comingSoon: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [movies, cinemas, showtimes] = await Promise.all([
        getAllMovies(),
        getAllCinemas(),
        getAllShowtimes()
      ]);

      const nowShowing = movies.filter(m => m.status === 'NowShowing').length;
      const comingSoon = movies.filter(m => m.status === 'ComingSoon').length;

      setStats({
        movies: movies.length,
        cinemas: cinemas.length,
        showtimes: showtimes.length,
        nowShowing,
        comingSoon
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Quản lý Phim',
      description: 'Thêm, sửa, xóa phim và quản lý thông tin',
      icon: '🎬',
      path: '/admin/movies',
      color: '#e50914'
    },
    {
      title: 'Quản lý Rạp & Phòng',
      description: 'Quản lý rạp chiếu phim và các phòng chiếu',
      icon: '🏠',
      path: '/admin/cinemas',
      color: '#ffc107'
    },
    {
      title: 'Quản lý Lịch Chiếu',
      description: 'Thiết lập và quản lý khung giờ chiếu phim',
      icon: '🕐',
      path: '/admin/showtimes',
      color: '#17a2b8'
    },
    {
      title: 'Quản lý Nhân Viên',
      description: 'Xem và quản lý tài khoản nhân viên',
      icon: '👥',
      path: '/admin/staffs',
      color: '#28a745'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Xin chào, Admin!</h2>
        <p>Chào mừng đến với trang quản lý Time Cinemas</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div className="stat-info">
            <h3>{stats.movies}</h3>
            <p>Tổng số phim</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <h3>{stats.cinemas}</h3>
            <p>Tổng số rạp</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🕐</div>
          <div className="stat-info">
            <h3>{stats.showtimes}</h3>
            <p>Lịch chiếu</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3>{stats.nowShowing}</h3>
            <p>Đang chiếu</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
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
              <div className="action-arrow">→</div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h4>Hướng dẫn sử dụng</h4>
          <ul>
            <li><strong>Quản lý Phim:</strong> Thêm mới phim, cập nhật thông tin, xóa phim đã chiếu</li>
            <li><strong>Quản lý Rạp & Phòng:</strong> Thêm rạp mới, tạo phòng chiếu với các loại phòng khác nhau (Standard, VIP, IMAX)</li>
            <li><strong>Quản lý Lịch Chiếu:</strong> Thiết lập khung giờ chiếu cho phim tại các rạp và phòng cụ thể</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
