import { useEffect, useMemo, useState } from "react";
import "../assets/styles/SectionPages.css";
import { getAllShowtimes, getAllMovies, getAllCinemas } from "../services/api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) => {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("vi-VN") + " VND";
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
        setError(err?.message || "Khong the tai danh sach suat chieu.");
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
      const cinema = cinemaMap.get(getId(showtime.cinemaId));
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
      const key = [
        getId(showtime.cinemaId),
        getId(showtime.movieId),
        getRoomKey(showtime.roomId),
        showtime.price ?? "-",
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
    <div>
      <section className="section-page">
        <div className="section-page__container">
          <h1 className="section-page__title">Lịch chiếu theo rạp</h1>
          <p className="section-page__subtitle">
            Tổng hợp suất chiếu theo rạp dựa trên dữ liệu hiện tại.
          </p>

          <div className="section-page__toolbar">
            {loading ? (
              <span className="section-page__status">Đang tải dữ liệu...</span>
            ) : (
              <span className="section-page__status">
                {groupedShowtimes.length} suất chiếu
              </span>
            )}
            {error ? (
            <span className="section-page__status">{error}</span>
            ) : null}
            <div className="section-search">
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {!loading && groupedShowtimes.length === 0 ? (
            <div className="section-page__empty">
              Chưa có suất chiếu nào.
            </div>
          ) : null}

          {groupedShowtimes.length > 0 ? (
            <table className="section-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Phim</th>
                  <th>Phòng</th>
                  <th>Giờ chiếu</th>
                  <th>Giá vé</th>
                  <th>Ngôn ngữ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {pagedShowtimes.map((showtime, index) => {
                  const cinema = cinemaMap.get(getId(showtime.cinemaId));
                  const movie = movieMap.get(getId(showtime.movieId));
                  return (
                    <tr key={showtime.groupKey || getId(showtime)}>
                      <td>{startIndex + index + 1}</td>
                      <td>{movie?.title || getId(showtime.movieId) || "-"}</td>
                      <td>{getRoomLabel(showtime.roomId)}</td>
                      <td>
                        <div className="showtime-list">
                          {showtime.startTimes?.length
                            ? showtime.startTimes.map((time, timeIndex) => (
                                <span key={`${time}-${timeIndex}`} className="showtime-chip">
                                  {formatDateTime(time)}
                                </span>
                              ))
                            : "-"}
                        </div>
                      </td>
                      <td>{formatMoney(showtime.price)}</td>
                      <td>{showtime.language || "-"}</td>
                      <td>{showtime.status || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}

          {groupedShowtimes.length > 0 ? (
            <div className="section-pagination">
              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === currentPage ? "active" : ""}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
