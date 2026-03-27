import { useEffect, useState } from "react";
import "../assets/styles/SectionPages.css";
import { getAllCinemas } from "../services/api";

export default function CinemasOverview() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const formatValue = (value) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return "-";
      if (typeof value[0] === "object") {
        const names = value
          .map((item) => item?.name || item?.title || item?._id)
          .filter(Boolean);
        return names.length ? names.join(", ") : `${value.length} mục`;
      }
      return value.join(", ");
    }
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const labelMap = {
    name: "Tên rạp",
    address: "Địa chỉ",
    city: "Thành phố",
    phone: "Điện thoại",
    email: "Email",
    description: "Mô tả",
    rooms: "Phòng",
  };

  const getCinemaFields = (cinema) => {
    const hiddenKeys = new Set([
      "__v",
      "_id",
      "movies",
      "showtimes",
      "status",
      "createdAt",
      "updatedAt",
    ]);
    const preferredOrder = [
      "name",
      "address",
      "city",
      "phone",
      "email",
      "description",
      "rooms",
    ];
    const entries = Object.entries(cinema || {}).filter(
      ([key]) => !hiddenKeys.has(key),
    );
    const ordered = [];
    preferredOrder.forEach((key) => {
      const found = entries.find(([entryKey]) => entryKey === key);
      if (found) ordered.push(found);
    });
    entries.forEach(([key, value]) => {
      if (!preferredOrder.includes(key)) ordered.push([key, value]);
    });
    return ordered;
  };

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
        <div className="section-page__container cinema-full">
          <h1 className="section-page__title">Mô tả rạp</h1>
          <p className="section-page__subtitle">
            Thông tin rạp chiếu dựa trên dữ liệu hệ thống.
          </p>

          <div className="section-page__toolbar">
            {loading ? (
              <span className="section-page__status">Đang tải dữ liệu...</span>
            ) : null}
            {error ? (
              <span className="section-page__status">{error}</span>
            ) : null}
          </div>

          {!loading && cinemas.length === 0 ? (
            <div className="section-page__empty">Chưa có rạp nào.</div>
          ) : null}

          {cinemas.length > 0 ? (
            <div className="cinema-details cinema-details--full">
              {cinemas.map((cinema) => (
                <article key={cinema._id} className="cinema-details__item">
                  <h3 className="section-card__title">{cinema.name}</h3>
                  <div className="cinema-details__list">
                    {getCinemaFields(cinema).map(([key, value]) => (
                      <div key={key} className="cinema-details__row">
                        <span className="cinema-details__label">
                          {labelMap[key] || key}
                        </span>
                        <span className="cinema-details__value">
                          {formatValue(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
