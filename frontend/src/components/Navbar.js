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
          <Link to="/showtimes">
            {lang === "vi" ? "LICH CHIEU THEO RAP" : "SHOWTIMES"}
          </Link>
          <Link to="/movies">{lang === "vi" ? "PHIM" : "MOVIES"}</Link>
          <Link to="/cinemas">{lang === "vi" ? "RAP" : "CINEMAS"}</Link>
          <Link to="/prices">{lang === "vi" ? "GIA VE" : "PRICES"}</Link>
          <Link to="/news">
            {lang === "vi" ? "TIN MOI & UU DAI" : "NEWS & OFFERS"}
          </Link>
          <Link to="/franchise">
            {lang === "vi" ? "NHUONG QUYEN" : "FRANCHISE"}
          </Link>
          <Link to="/members">{lang === "vi" ? "THANH VIEN" : "MEMBERS"}</Link>
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
                        {user.role === "Admin" ? "Trang quan tri" : "Trang staff"}
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <Link to="/profile" onClick={handleDropdownLinkClick}>
                      Trang ca nhan
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout}>Dang xuat</button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">{lang === "vi" ? "Dang nhap" : "Login"}</Link>
              <Link to="/signup">
                {lang === "vi" ? "Dang ky" : "Register"}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
