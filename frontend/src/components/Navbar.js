import { useContext, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../assets/styles/Navbar.css";
import logo from "../assets/images/logo.png";
import ava from "../assets/images/person.png";
import { LanguageContext } from "../context/LanguageContext";
import { UserContext } from "../context/UserContext.js";

export default function Navbar() {
  const { lang } = useContext(LanguageContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);
  const dashboardPath =
    user?.role === "Admin"
      ? "/admin/dashboard"
      : user?.role === "Staff"
        ? "/staff/dashboard"
        : null;

  useEffect(() => {
    setShowDropdown(false);
  }, [user]);

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    navigate("/");
  };

  const handleDropdownLinkClick = () => {
    setShowDropdown(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Alpha Cinemas" />
          <span>Time Cinemas</span>
        </Link>

        <nav className="navbar-menu">
          <NavLink
            to="/showtimes"
            className={({ isActive }) =>
              isActive ? "navbar-link navbar-link--active" : "navbar-link"
            }
          >
            {lang === "vi" ? "LỊCH CHIẾU THEO RẠP" : "SHOWTIMES"}
          </NavLink>
          <NavLink
            to="/movies"
            className={({ isActive }) =>
              isActive ? "navbar-link navbar-link--active" : "navbar-link"
            }
          >
            {lang === "vi" ? "PHIM" : "MOVIES"}
          </NavLink>
          <NavLink
            to="/cinemas"
            className={({ isActive }) =>
              isActive ? "navbar-link navbar-link--active" : "navbar-link"
            }
          >
            {lang === "vi" ? "RẠP" : "CINEMAS"}
          </NavLink>
          <NavLink
            to="/prices"
            className={({ isActive }) =>
              isActive ? "navbar-link navbar-link--active" : "navbar-link"
            }
          >
            {lang === "vi" ? "GIÁ VÉ" : "PRICES"}
          </NavLink>
          <NavLink
            to="/news"
            className={({ isActive }) =>
              isActive ? "navbar-link navbar-link--active" : "navbar-link"
            }
          >
            {lang === "vi" ? "TIN MỚI & ƯU ĐÃI" : "NEWS & OFFERS"}
          </NavLink>
         
        </nav>

        <div className="navbar-right">
          {user ? (
            <div className="navbar-user">
              <img
                src={user.avatarUrl || ava}
                alt="avatar"
                className="navbar-avatar"
                onClick={() => setShowDropdown((prev) => !prev)}
              />
              {showDropdown && (
                <ul className="navbar-dropdown">
                  <li className="dropdown-header">{user.fullName}</li>
                  {dashboardPath ? (
                    <li>
                      <Link to={dashboardPath} onClick={handleDropdownLinkClick}>
                        {user.role === "Admin" ? "Trang quản trị" : "Trang nhân viên"}
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <Link to="/profile" onClick={handleDropdownLinkClick}>
                      Trang cá nhân
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout}>Đăng xuất</button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">{lang === "vi" ? "Đăng nhập" : "Login"}</Link>
              <Link to="/signup">
                {lang === "vi" ? "Đăng ký" : "Register"}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
