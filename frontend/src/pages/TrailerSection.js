// src/components/movie/TrailerSection.jsx
import "../assets/styles/MovieDetail/_trailer.css";

export default function TrailerSection({ trailerUrl }) {
  if (!trailerUrl) return null;

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url) => {
    if (!url) return null;

    // Handle YouTube URLs
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    // Return original URL if not YouTube or already embed format
    return url;
  };

  const embedUrl = getEmbedUrl(trailerUrl);

  return (
    <div className="trailer-section">
      <h2>Trailer</h2>
      <div className="trailer-container">
        <iframe
          src={embedUrl}
          title="Movie Trailer"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="trailer-iframe"
        />
      </div>
    </div>
  );
}
