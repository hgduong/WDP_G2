import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import '../../assets/styles/AdminLayout.css';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useContext(UserContext);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/movies', label: 'Quản lý Phim' },
    { path: '/admin/cinemas', label: 'Quản lý Rạp & Phòng' },
    { path: '/admin/showtimes', label: 'Quản lý Lịch Chiếu' },
    { path: '/admin/staffs', label: 'Quản lý Nhân Viên' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            {sidebarOpen ? 'Time Cinemas' : '🎬'}
          </div>
          <button 
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a
            href="/"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <span className="nav-icon"></span>
            {sidebarOpen && <span className="nav-label">Về trang chủ</span>}
          </a>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon"></span>
            {sidebarOpen && <span className="nav-label">Đăng xuất</span>}
          </button>
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-user">
            <span>👤 Admin</span>
          </div>
        </header>
        
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
