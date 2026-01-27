// src/pages/MovieDetail.jsx
import { useParams } from "react-router-dom";
import "../assets/styles/MovieDetail.css";
import cartmovie from "../assets/images/cartmovie1.png";

// Giả sử bạn có danh sách phim (có thể import từ file hoặc API)
const movies = [
  {
    id: 1,
    title: "Avengers 5",
    duration: 120,
    description: "Một nhóm siêu anh hùng bảo vệ thế giới...",
    posterUrl: cartmovie,
    showtimes: ["CGV Hà Nội - 19:00", "Lotte Hà Nội - 20:30"],
  },
  {
    id: 3,
    title: "Batman",
    duration: 130,
    description: "Hiệp sĩ bóng đêm bảo vệ Gotham...",
    posterUrl: cartmovie,
    showtimes: ["CGV HCM - 18:00", "Galaxy HCM - 21:00"],
  },
];

export default function MovieDetail() {
  const { id } = useParams(); // lấy id từ URL
  const movie = movies.find((m) => m.id === Number(id));

  if (!movie) {
    return <p>Không tìm thấy phim</p>;
  }

  const poster = movie.posterUrl ? movie.posterUrl : cartmovie;

  return (
    <div className="movie-detail">
      <img src={poster} alt={movie.title} className="poster" />
      <div className="info">
        <h1>{movie.title}</h1>
        <p>Thời lượng: {movie.duration} phút</p>
        <p>{movie.description}</p>
        <h2>Lịch chiếu</h2>
        <ul>
          {movie.showtimes.map((show, index) => (
            <li key={index}>{show}</li>
          ))}
        </ul>
        <button className="btn">Đặt vé</button>
      </div>
    </div>
  );
}
