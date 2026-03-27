// src/components/Footer.jsx
import "../assets/styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} TimeCinemas. All rights reserved.</p>
        
      </div>
    </footer>
  );
}
