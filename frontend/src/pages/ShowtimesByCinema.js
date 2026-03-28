import { useEffect, useMemo, useState } from "react";
import "../assets/styles/ShowtimesByCinema.css";
import { getAllShowtimes, getAllMovies, getAllCinemas } from "../services/api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getId = (value) => {
  if (!value) return value;
  return value._id || value;
};

const getRoomLabel = (room) => {
  if (!room) return "-";
  if (typeof room === "string") return room;
  if (typeof room === "object") {
    return room.name || room.type || room._id || "-";
  }
  return String(room);
};

const getRoomKey = (room) => {
  if (!room) return "-";
  if (typeof room === "string") return room;
  if (typeof room === "object") {
    return room._id || room.name || room.type || "-";
  }
  return String(room);
};

// Get cinemaId from room.cinemaId
const getCinemaIdFromShowtime = (showtime) => {
  if (!showtime) return null;
  // Try to get from roomId.cinemaId
  if (showtime.roomId?.cinemaId) {
    return getId(showtime.roomId.cinemaId);
  }
  // Try to get from room.cinemaId
  if (showtime.room?.cinemaId) {
    return getId(showtime.room.cinemaId);
  }
  return null;
};

export default function ShowtimesByCinema() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [showtimesData, moviesData, cinemasData] = await Promise.all([
          getAllShowtimes(),
          getAllMovies(),
          getAllCinemas(),
        ]);

        if (!isMounted) return;
        setShowtimes(Array.isArray(showtimesData) ? showtimesData : []);
        setMovies(Array.isArray(moviesData) ? moviesData : []);
        setCinemas(Array.isArray(cinemasData) ? cinemasData : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Không thể tải danh sách suất chiếu.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const movieMap = useMemo(() => {
    return new Map(movies.map((movie) => [getId(movie), movie]));
  }, [movies]);

  const cinemaMap = useMemo(() => {
    return new Map(cinemas.map((cinema) => [getId(cinema), cinema]));
  }, [cinemas]);

  const filteredShowtimes = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return showtimes;
    return showtimes.filter((showtime) => {
      const cinemaId = getCinemaIdFromShowtime(showtime);
      const cinema = cinemaMap.get(cinemaId);
      const movie = movieMap.get(getId(showtime.movieId));
      const values = [
        cinema?.name,
        movie?.title,
        showtime.language,
        showtime.status,
        getRoomLabel(showtime.roomId),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return values.includes(search);
    });
  }, [showtimes, query, cinemaMap, movieMap]);

  const groupedShowtimes = useMemo(() => {
    const grouped = new Map();
    filteredShowtimes.forEach((showtime) => {
      const cinemaId = getCinemaIdFromShowtime(showtime);
      const key = [
        cinemaId,
        getId(showtime.movieId),
        getRoomKey(showtime.roomId),
        showtime.language ?? "-",
        showtime.status ?? "-",
      ].join("|");

      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          ...showtime,
          startTimes: showtime.startTime ? [showtime.startTime] : [],
          groupKey: key,
        });
        return;
      }

      if (showtime.startTime) {
        existing.startTimes.push(showtime.startTime);
      }
    });

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      startTimes: item.startTimes
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b)),
    }));
  }, [filteredShowtimes]);

  const pageSize = 10;

  const totalPages = useMemo(() => {
    if (groupedShowtimes.length === 0) return 1;
    return Math.max(1, Math.ceil(groupedShowtimes.length / pageSize));
  }, [groupedShowtimes.length]);

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedShowtimes = groupedShowtimes.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <div className="showtimes-cinema">
      <div className="showtimes-cinema__container">
        {/* Hero Section */}
        <div className="showtimes-cinema__hero">
          <h1 className="showtimes-cinema__title">Lịch Chiếu Theo Rạp</h1>
          <p className="showtimes-cinema__subtitle">
            Tổng hợp suất chiếu theo rạp dựa trên dữ liệu hiện tại
          </p>
        </div>

        {/* Stats Bar */}
        {!loading && !error && (
          <div className="showtimes-cinema__stats">
            <div className="showtimes-cinema__stat">
              <div>
                <div className="showtimes-cinema__stat-value">{groupedShowtimes.length}</div>
                <div className="showtimes-cinema__stat-label">Suất Chiếu</div>
              </div>
            </div>
            <div className="showtimes-cinema__stat">
              <div>
                <div className="showtimes-cinema__stat-value">{cinemas.length}</div>
                <div className="showtimes-cinema__stat-label">Rạp Chiếu</div>
              </div>
            </div>
            <div className="showtimes-cinema__stat">
              <div>
                <div className="showtimes-cinema__stat-value">{movies.length}</div>
                <div className="showtimes-cinema__stat-label">Phim</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="showtimes-cinema__search">
          <input
            type="text"
            className="showtimes-cinema__search-input"
            placeholder="Tìm kiếm phim, rạp, ngôn ngữ..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="showtimes-cinema__loading">
            <div className="showtimes-cinema__spinner"></div>
            <div className="showtimes-cinema__loading-text">Đang tải dữ liệu suất chiếu...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="showtimes-cinema__error">
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && groupedShowtimes.length === 0 && (
          <div className="showtimes-cinema__empty">
            <h3 className="showtimes-cinema__empty-title">Chưa có suất chiếu nào</h3>
            <p className="showtimes-cinema__empty-text">
              Lịch chiếu sẽ sớm được cập nhật
            </p>
          </div>
        )}

        {/* Showtime Table */}
        {!loading && !error && groupedShowtimes.length > 0 && (
          <div className="showtimes-cinema__table">
            <div className="showtimes-cinema__table-header">
              <h2 className="showtimes-cinema__table-title">Danh Sách Suất Chiếu</h2>
            </div>
            <div className="showtimes-cinema__table-content">
              {pagedShowtimes.map((showtime, index) => {
                const cinemaId = getCinemaIdFromShowtime(showtime);
                const cinema = cinemaMap.get(cinemaId);
                const movie = movieMap.get(getId(showtime.movieId));
                return (
                  <div key={showtime.groupKey || getId(showtime)} className="showtimes-cinema__table-row">
                    <div className="showtimes-cinema__table-cell">
                      <span className="showtimes-cinema__table-label">STT</span>
                      <span className="showtimes-cinema__table-value">{startIndex + index + 1}</span>
                    </div>
                    <div className="showtimes-cinema__table-cell">
                      <span className="showtimes-cinema__table-label">Phim</span>
                      <span className="showtimes-cinema__table-value showtimes-cinema__table-value--movie">
                        {movie?.title || getId(showtime.movieId) || "-"}
                      </span>
                    </div>
                    <div className="showtimes-cinema__table-cell">
                      <span className="showtimes-cinema__table-label">Phòng</span>
                      <span className="showtimes-cinema__table-value">{getRoomLabel(showtime.roomId)}</span>
                    </div>
                    <div className="showtimes-cinema__table-cell">
                      <span className="showtimes-cinema__table-label">Giờ Chiếu</span>
                      <div className="showtimes-cinema__chips">
                        {showtime.startTimes?.length
                          ? showtime.startTimes.map((time, timeIndex) => (
                              <span key={`${time}-${timeIndex}`} className="showtimes-cinema__chip">
                                {formatDateTime(time)}
                              </span>
                            ))
                          : "-"}
                      </div>
                    </div>
                    <div className="showtimes-cinema__table-cell">
                      <span className="showtimes-cinema__table-label">Ngôn Ngữ</span>
                      <span className="showtimes-cinema__table-value">{showtime.language || "-"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && groupedShowtimes.length > 0 && (
          <div className="showtimes-cinema__pagination">
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNumber = idx + 1;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`showtimes-cinema__pagination-button ${pageNumber === currentPage ? "showtimes-cinema__pagination-button--active" : ""}`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
