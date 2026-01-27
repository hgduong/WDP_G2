// client/src/components/MovieCard.jsx
import { Link } from "react-router-dom";
import cartmovie from "../assets/images/cartmovie1.png";

export default function MovieCard({ movie }) {
  // Nếu không có posterUrl thì dùng ảnh mặc định
  const poster = movie.posterUrl ? movie.posterUrl : cartmovie;

  return (
    <Link to={`/movie/${movie.id}`} className="block">
      <div className="rounded overflow-hidden shadow-lg bg-gray-800 hover:scale-105 transition-transform">
        <img
          src={poster}
          alt={movie.title}
          className="w-full h-72 object-cover"
        />
        <div className="p-3">
          <h3 className="text-lg font-semibold text-white">{movie.title}</h3>
          {movie.duration && (
            <p className="text-sm text-gray-400">{movie.duration} phút</p>
          )}
        </div>
      </div>
    </Link>
  );
}
