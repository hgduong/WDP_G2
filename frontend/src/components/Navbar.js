// src/components/Navbar.jsx
import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/styles/Navbar.css";
import logo from "../assets/images/logo.png";
import VIE from "../assets/images/VIE.png";
import ENG from "../assets/images/ENG.png";
import ava from "../assets/images/person.png";
import { LanguageContext } from "../context/LanguageContext";
import { UserContext } from "../context/UserContext.js";

export default function Navbar() {
  const { lang, toggleLang } = useContext(LanguageContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);

  useEffect(() => {
    setShowDropdown(false);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Alpha Cinemas" />
          <span>Time Cinemas</span>
        </Link>

        <nav className="navbar-menu">
          <Link to="/showtimes">
            {lang === "vi" ? "LỊCH CHIẾU THEO RẠP" : "SHOWTIMES"}
          </Link>
          <Link to="/movies">{lang === "vi" ? "PHIM" : "MOVIES"}</Link>
          <Link to="/cinemas">{lang === "vi" ? "RẠP" : "CINEMAS"}</Link>
          <Link to="/prices">{lang === "vi" ? "GIÁ VÉ" : "PRICES"}</Link>
          <Link to="/news">
            {lang === "vi" ? "TIN MỚI & ƯU ĐÃI" : "NEWS & OFFERS"}
          </Link>
          <Link to="/franchise">
            {lang === "vi" ? "NHƯỢNG QUYỀN" : "FRANCHISE"}
          </Link>
          <Link to="/members">{lang === "vi" ? "THÀNH VIÊN" : "MEMBERS"}</Link>
        </nav>

        <div className="navbar-right">
          {user ? (
            <div className="navbar-user">
              <img
                src={user.avatarUrl || ava}
                alt="avatar"
                className="navbar-avatar"
                onClick={() => setShowDropdown(prev => !prev)}
              />
              {showDropdown && (
                <ul className="navbar-dropdown">
                  <li className="dropdown-header">{user.fullName}</li>
                  <li>
                    <Link to="/profile"> Trang cá nhân</Link>
                  </li>
                  <li>
                    <Link to="/settings"> Cài đặt</Link>
                  </li>
                  <li>
                    <button onClick={handleLogout}> Đăng xuất</button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">{lang === "vi" ? "Đăng nhập" : "Login"}</Link>
              <Link to="/signup">{lang === "vi" ? "Đăng ký" : "Register"}</Link>
            </>
          )}
          {/* <button className="navbar-lang" onClick={toggleLang}>
            {lang === "vi" ? (
              <>
                <img src={VIE} alt="Vietnamese" width="22" height="18" />
                <span>VI</span>
              </>
            ) : (
              <>
                <img src={ENG} alt="English" width="22" height="18" />
                <span>EN</span>
              </>
            )}
          </button> */}
        </div>
      </div>
    </header>
  );
}
