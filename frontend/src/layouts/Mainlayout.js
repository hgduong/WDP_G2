// src/layouts/MainLayout.jsx
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/styles/MainLayout.css";

export default function MainLayout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="main">{children}</main>
      <Footer />
    </div>
  );
}
