// src/components/Footer.jsx
import "../assets/styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} TimeCinemas. All rights reserved.</p>
        <nav className="footer-nav">
          <a href="/about">Giới thiệu</a>
          <a href="/contact">Liên hệ</a>
          <a href="/terms">Điều khoản</a>
        </nav>
      </div>
    </footer>
  );
}
