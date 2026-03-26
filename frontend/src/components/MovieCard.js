import { Link } from "react-router-dom";
import { getImageUrl } from "../utils/imageUtils";

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movie/${movie._id}`} className="block">
      <div className="rounded overflow-hidden shadow-lg bg-gray-800 hover:scale-105 transition-transform" style={{ width: '200px' }}>
        <img
          src={movie.posterUrl}
          alt={movie.title}
          style={{ width: '100%', height: '500px', objectFit: 'cover' }}
        />

        <div className="p-3">
          <h3 className="text-lg font-semibold text-white" style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.title}</h3>
          {movie.duration && (
            <p className="text-sm text-gray-400">{movie.duration} phút</p>
          )}
        </div>
      </div>
    </Link>
  );
}
