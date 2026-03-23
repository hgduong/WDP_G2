import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import "../../assets/styles/AdminLayout.css";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout, role } = useContext(UserContext);

  const allMenuItems = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/movies", label: "Quan ly Phim" },
    { path: "/admin/cinemas", label: "Quan ly Rap & Phong" },
    { path: "/admin/showtimes", label: "Quan ly Lich Chieu" },
    { path: "/admin/staffs", label: "Quan ly Nhan Vien" },
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
            {sidebarOpen && <span className="nav-label">Ve trang chu</span>}
          </a>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon"></span>
            {sidebarOpen && <span className="nav-label">Dang xuat</span>}
          </button>
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-header">
          <h1>{role === "Staff" ? "Staff Dashboard" : "Admin Dashboard"}</h1>
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
