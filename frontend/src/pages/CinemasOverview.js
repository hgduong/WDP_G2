import { useEffect, useState } from "react";
import "../assets/styles/SectionPages.css";
import { getAllCinemas } from "../services/api";

export default function CinemasOverview() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCinemas = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAllCinemas();
        if (!isMounted) return;
        setCinemas(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Khong the tai danh sach rap.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCinemas();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <section className="section-page">
        <div className="section-page__container">
          <h1 className="section-page__title">Mô tả rạp</h1>
          <p className="section-page__subtitle">
            Thông tin rạp chiếu dựa trên dữ liệu hệ thống.
          </p>

          <div className="section-page__toolbar">
            {loading ? (
              <span className="section-page__status">Đang tải dữ liệu...</span>
            ) : (
              <span className="section-page__status">{cinemas.length} rap</span>
            )}
            {error ? (
              <span className="section-page__status">{error}</span>
            ) : null}
          </div>

          {!loading && cinemas.length === 0 ? (
            <div className="section-page__empty">Chưa có rạp nào.</div>
          ) : null}

          {cinemas.length > 0 ? (
            <div className="section-page__grid">
              {cinemas.map((cinema) => (
                <article key={cinema._id} className="section-card">
                  <h3 className="section-card__title">{cinema.name}</h3>
                  <p className="section-card__meta">Địa chỉ: {cinema.address}</p>
                  <p className="section-card__meta">Thành phố: {cinema.city}</p>
                  <p className="section-card__meta">Phone: {cinema.phone}</p>
                  <p className="section-card__meta">Email: {cinema.email}</p>
                  <p className="section-card__meta">
                    Mô tả: {cinema.description}
                  </p>
                  <span className="section-card__badge">
                    {Array.isArray(cinema.rooms) ? cinema.rooms.length : 0} phòng
                  </span>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
