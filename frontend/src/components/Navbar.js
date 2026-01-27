// src/components/Navbar.jsx
import { useContext } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/Navbar.css";
import logo from "../assets/images/logo.png";
import VIE from "../assets/images/VIE.png";
import ENG from "../assets/images/ENG.png";
import { LanguageContext } from "../context/LanguageContext";

export default function Navbar() {
  const { lang, toggleLang } = useContext(LanguageContext);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Alpha Cinemas" />
          <span>Time Cinemas</span>
        </Link>

        <nav className="navbar-menu">
          <Link to="/showtimes">{lang === "vi" ? "LỊCH CHIẾU THEO RẠP" : "SHOWTIMES"}</Link>
          <Link to="/movies">{lang === "vi" ? "PHIM" : "MOVIES"}</Link>
          <Link to="/cinemas">{lang === "vi" ? "RẠP" : "CINEMAS"}</Link>
          <Link to="/prices">{lang === "vi" ? "GIÁ VÉ" : "PRICES"}</Link>
          <Link to="/news">{lang === "vi" ? "TIN MỚI & ƯU ĐÃI" : "NEWS & OFFERS"}</Link>
          <Link to="/franchise">{lang === "vi" ? "NHƯỢNG QUYỀN" : "FRANCHISE"}</Link>
          <Link to="/members">{lang === "vi" ? "THÀNH VIÊN" : "MEMBERS"}</Link>
        </nav>

        <div className="navbar-right">
          <Link to="/login">{lang === "vi" ? "Đăng nhập" : "Login"}</Link>
          <Link to="/signup">{lang === "vi" ? "Đăng ký" : "Register"}</Link>
          <button className="navbar-lang" onClick={toggleLang}>
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
          </button>
        </div>
      </div>
    </header>
  );
}
