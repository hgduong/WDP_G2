import { Link } from "react-router-dom";

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movie/${movie._id}`} className="block">
      <div className="rounded overflow-hidden shadow-lg bg-gray-800 hover:scale-105 transition-transform">
        <img
          src={`http://localhost:9999${movie.posterUrl}`}
          alt={movie.title}
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
