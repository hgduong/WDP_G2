import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import "../../assets/styles/AdminLayout.css";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});
  const { logout, role } = useContext(UserContext);

  const allMenuItems = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/movies", label: "Quản lý Phim" },
    { path: "/admin/cinemas", label: "Quản lý Rạp & Phòng" },
    { path: "/admin/showtimes", label: "Quản lý Lịch Chiếu" },
    // { path: "/admin/staff-register", label: "Đăng ký Staff" },
    { path: "/admin/staffs", label: "Quản lý Nhân Viên" },
    { path: "/admin/users", label: "Quản lý Người Dùng" },
    { path: "/admin/voucher", label: "Quản lý Voucher" },
    {
      path: "/admin/schedules",
      label: "Quản lý Lịch làm việc",
      children: [
        { path: "/admin/schedules/attendance", label: "Theo dõi điểm danh" },
        { path: "/admin/schedules/create", label: "Tạo lịch làm việc" }
      ]
    }
  ];

  const menuItems =
    role === "Staff"
      ? allMenuItems.filter((item) => item.path === "/admin/dashboard")
      : allMenuItems;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const toggleExpand = (path) => {
    setExpandedItems((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const hasActiveChild = (item) => {
    if (!item.children) return false;
    return item.children.some((child) => location.pathname === child.path);
  };

  return (
    <div className="admin-layout">
      <div className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo">{sidebarOpen ? "Time Cinemas" : "TC"}</div>
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "<" : ">"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.path}>
              {item.children ? (
                <>
                  <a
                    href={item.path}
                    className={`nav-item ${hasActiveChild(item) ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleExpand(item.path);
                    }}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-arrow">
                          {expandedItems[item.path] ? "▼" : "▶"}
                        </span>
                      </>
                    )}
                  </a>
                  {sidebarOpen && expandedItems[item.path] && (
                    <div className="nav-children">
                      {item.children.map((child) => (
                        <a
                          key={child.path}
                          href={child.path}
                          className={`nav-item nav-child ${isActive(child.path) ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(child.path);
                          }}
                        >
                          <span className="nav-icon"></span>
                          <span className="nav-label">{child.label}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <a
                  key={item.path}
                  href={item.path}
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {sidebarOpen && <span className="nav-label">{item.label}</span>}
                </a>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a
            href="/"
            className="nav-item"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
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
          <h1>{role === "Staff" ? "Bảng điều khiển staff" : "Bảng điều khiển admin"}</h1>
          <div className="admin-user">
            <span>{role || "Admin"}</span>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
