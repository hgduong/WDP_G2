// src/pages/Home.jsx
import { useContext, useState, useEffect } from "react";
import { LanguageContext } from "../context/LanguageContext";
import "../assets/styles/Home.css";
import slider1 from "../assets/images/slider1.png";
import slider2 from "../assets/images/slider2.png";
import slider3 from "../assets/images/slider3.png";
import MovieCard from "../components/MovieCard";
import cartmovie from "../assets/images/cartmovie1.png";
const slides = [
  { id: 1, title_vi: "Avengers", title_en: "Avengers", image: slider1 },
  { id: 2, title_vi: "Batman", title_en: "Batman", image: slider2 },
  { id: 3, title_vi: "Người Nhện", title_en: "Spiderman", image: slider3 },
];

const comingSoonMovies = [
  {
    id: 1,
    title: "Avengers 5",
    duration: 120,
    posterUrl: cartmovie,
    
  },
  { id: 2, title: "Thor", duration: 110, posterUrl: cartmovie },
];
const nowShowingMovies = [
  { id: 3, title: "Batman", duration: 130, posterUrl: cartmovie },
  {
    id: 4,
    title: "Spiderman",
    duration: 125,
    posterUrl: cartmovie,
  },
];
const specialShowings = [
  {
    id: 5,
    title: "Avatar 2 (Special)",
    duration: 150,
    posterUrl: cartmovie,
  },
];
export default function Home() {
  const { lang } = useContext(LanguageContext);
  const [current, setCurrent] = useState(0);
  const [activeTab, setActiveTab] = useState("comingSoon");

  // Tự động chuyển slide sau 3 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Hàm điều khiển
  const prevSlide = () => {
    setCurrent((current - 1 + slides.length) % slides.length);
  };
  const nextSlide = () => {
    setCurrent((current + 1) % slides.length);
  };
  const renderMovies = () => {
    switch (activeTab) {
      case "comingSoon":
        return comingSoonMovies;
      case "nowShowing":
        return nowShowingMovies;
      case "special":
        return specialShowings;
      default:
        return [];
    }
  };
  return (
    <div className="home">
      <section className="banner">
        <div className="carousel">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`carousel-slide ${index === current ? "active" : ""}`}
            >
              <img src={slide.image} alt={slide.title_en} />
              <h1>{lang === "vi" ? slide.title_vi : slide.title_en}</h1>
            </div>
          ))}
        </div>

        {/* Nút Prev/Next */}
        <button className="prev" onClick={prevSlide}>
          &#10094;
        </button>
        <button className="next" onClick={nextSlide}>
          &#10095;
        </button>

        {/* Dots */}
        <div className="carousel-dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={index === current ? "dot active" : "dot"}
              onClick={() => setCurrent(index)}
            ></span>
          ))}
        </div>
      </section>

      <section className="movie-section">
        {/* Tab bar */}
        <div className="movie-tabs">
          <h2
            className={activeTab === "comingSoon" ? "active" : ""}
            onClick={() => setActiveTab("comingSoon")}
          >
            {lang === "vi" ? "Phim sắp chiếu" : "COMING SOON"}
          </h2>
          <h2
            className={activeTab === "nowShowing" ? "active" : ""}
            onClick={() => setActiveTab("nowShowing")}
          >
            {lang === "vi" ? "Phim đang chiếu" : "NOW SHOWING"}
          </h2>
          <h2
            className={activeTab === "special" ? "active" : ""}
            onClick={() => setActiveTab("special")}
          >
            {lang === "vi" ? "Suất chiếu đặc biệt" : "SPECIAL SHOWINGS"}
          </h2>
        </div>

        {/* Movie grid */}
        <div className="movie-grid">
          {renderMovies().map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
}
