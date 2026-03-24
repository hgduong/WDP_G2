import React, { useEffect, useMemo, useState } from "react";
import {
  createStaffBookingOrder,
  getAllMovies,
  getStaffBookingSeatMap,
  getStaffBookingShowtimes,
} from "../../services/api";
import "../../assets/styles/StaffBooking.css";

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const toDateInputValue = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60000).toISOString().split("T")[0];
};

function StaffBooking() {
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");
  const [seatMapData, setSeatMapData] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
    sendEmail: true,
    paymentStatus: "PayAtCounter",
  });

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const movieData = await getAllMovies();
        setMovies(Array.isArray(movieData) ? movieData : []);
      } catch (err) {
        setError(err?.message || "Không tải được danh sách phim.");
      }
    };

    loadMovies();
  }, []);

  useEffect(() => {
    const loadShowtimes = async () => {
      try {
        setLoadingShowtimes(true);
        setError("");
        setSuccess("");
        setSelectedShowtimeId("");
        setSeatMapData(null);
        setSelectedSeatIds([]);

        const data = await getStaffBookingShowtimes({
          date: selectedDate,
          movieId: selectedMovieId || undefined,
        });

        setShowtimes(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Không tải được suất chiếu.");
      } finally {
        setLoadingShowtimes(false);
      }
    };

    loadShowtimes();
  }, [selectedDate, selectedMovieId]);

  useEffect(() => {
    const loadSeatMap = async () => {
      if (!selectedShowtimeId) {
        return;
      }

      try {
        setLoadingSeatMap(true);
        setError("");
        setSuccess("");
        setSelectedSeatIds([]);
        const data = await getStaffBookingSeatMap(selectedShowtimeId);
        setSeatMapData(data);
      } catch (err) {
        setError(err?.message || "Không tải được sơ đồ ghế.");
      } finally {
        setLoadingSeatMap(false);
      }
    };

    loadSeatMap();
  }, [selectedShowtimeId]);

  const selectedShowtime = useMemo(
    () => showtimes.find((showtime) => showtime._id === selectedShowtimeId) || null,
    [selectedShowtimeId, showtimes],
  );

  const groupedSeats = useMemo(() => {
    const seats = seatMapData?.seats || [];
    return seats.reduce((accumulator, seat) => {
      if (!accumulator[seat.row]) {
        accumulator[seat.row] = [];
      }
      accumulator[seat.row].push(seat);
      return accumulator;
    }, {});
  }, [seatMapData]);

  const selectedSeats = useMemo(() => {
    const seats = seatMapData?.seats || [];
    return seats.filter((seat) => selectedSeatIds.includes(seat._id));
  }, [seatMapData, selectedSeatIds]);

  const totalPrice = selectedSeats.length * Number(selectedShowtime?.price || 0);

  const toggleSeat = (seat) => {
    if (seat.status !== "Available") {
      return;
    }

    setSelectedSeatIds((current) =>
      current.includes(seat._id)
        ? current.filter((seatId) => seatId !== seat._id)
        : [...current, seat._id],
    );
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedShowtimeId) {
      setError("Hãy chọn suất chiếu trước khi xác nhận.");
      return;
    }

    if (selectedSeatIds.length === 0) {
      setError("Hãy chọn ít nhất một ghế.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const result = await createStaffBookingOrder({
        showtimeId: selectedShowtimeId,
        seatIds: selectedSeatIds,
        ...formData,
      });

      setSuccess(
        `Đã tạo đặt chỗ ${result?.booking?.bookingCode || ""} thành công.`,
      );
      setFormData((current) => ({
        ...current,
        notes: "",
      }));
      setSelectedSeatIds([]);

      const refreshedSeatMap = await getStaffBookingSeatMap(selectedShowtimeId);
      setSeatMapData(refreshedSeatMap);

      const refreshedShowtimes = await getStaffBookingShowtimes({
        date: selectedDate,
        movieId: selectedMovieId || undefined,
      });
      setShowtimes(Array.isArray(refreshedShowtimes) ? refreshedShowtimes : []);
    } catch (err) {
      setError(err?.message || "Đặt chỗ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-booking-page">
      <section className="staff-booking-hero">
        <div>
          <span className="staff-booking-eyebrow">Bàn đặt chỗ staff</span>
          <h1>Đặt chỗ nhanh tại quầy</h1>
          <p>
            Chọn suất chiếu, giữ ghế cho khách và xác nhận thông tin trong cùng
            một màn hình để thao tác nhanh hơn trong giờ cao điểm.
          </p>
        </div>

        <div className="staff-booking-filters">
          <label>
            Ngày chiếu
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <label>
            Phim
            <select
              value={selectedMovieId}
              onChange={(event) => setSelectedMovieId(event.target.value)}
            >
              <option value="">Tất cả phim</option>
              {movies.map((movie) => (
                <option key={movie._id} value={movie._id}>
                  {movie.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? <div className="staff-booking-alert error">{error}</div> : null}
      {success ? <div className="staff-booking-alert success">{success}</div> : null}

      <div className="staff-booking-layout">
        <section className="staff-booking-panel">
          <div className="panel-heading">
            <h2>1. Chọn suất chiếu</h2>
            <span>{loadingShowtimes ? "Đang tải..." : `${showtimes.length} suất`}</span>
          </div>

          <div className="showtime-list">
            {showtimes.map((showtime) => {
              const isActive = selectedShowtimeId === showtime._id;
              return (
                <button
                  key={showtime._id}
                  type="button"
                  className={`showtime-card ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedShowtimeId(showtime._id)}
                >
                  <strong>{showtime.movieId?.title || "Phim đang cập nhật"}</strong>
                  <span>{formatDateTime(showtime.startTime)}</span>
                  <span>
                    {showtime.cinemasId?.name} - {showtime.roomId?.name}
                  </span>
                  <span>{formatMoney(showtime.price)} / ghế</span>
                  <span className="showtime-meta">
                    Còn {showtime.availableSeats}/{showtime.totalSeats} ghế trống
                  </span>
                </button>
              );
            })}

            {!loadingShowtimes && showtimes.length === 0 ? (
              <div className="empty-state">
                Không có suất chiếu nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : null}
          </div>
        </section>

        <section className="staff-booking-panel wide">
          <div className="panel-heading">
            <h2>2. Chọn ghế</h2>
            <span>
              {selectedSeats.length > 0
                ? `${selectedSeats.length} ghế đã chọn`
                : "Chưa chọn ghế"}
            </span>
          </div>

          {!selectedShowtime ? (
            <div className="empty-state">Hãy chọn một suất chiếu để tải sơ đồ ghế.</div>
          ) : loadingSeatMap ? (
            <div className="empty-state">Đang tải sơ đồ ghế...</div>
          ) : (
            <>
              <div className="screen-indicator">Màn hình</div>
              <div className="seat-legend">
                <span><i className="available" /> Trong</span>
                <span><i className="selected" /> Đang chọn</span>
                <span><i className="booked" /> Đã đặt</span>
                <span><i className="vip" /> VIP</span>
              </div>

              <div className="seat-map">
                {Object.entries(groupedSeats).map(([row, seats]) => (
                  <div key={row} className="seat-row">
                    <div className="row-label">{row}</div>
                    <div className="row-seats">
                      {seats.map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat._id);
                        const seatClass = [
                          "seat-button",
                          seat.status.toLowerCase(),
                          seat.type === "VIP" ? "vip" : "",
                          isSelected ? "selected" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <button
                            key={seat._id}
                            type="button"
                            className={seatClass}
                            onClick={() => toggleSeat(seat)}
                            disabled={seat.status !== "Available"}
                            title={`${seat.label} - ${seat.type}`}
                          >
                            {seat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="selection-summary">
                <div>
                  <span>Ghế đã chọn</span>
                  <strong>
                    {selectedSeats.length > 0
                      ? selectedSeats.map((seat) => seat.label).join(", ")
                      : "Chưa có"}
                  </strong>
                </div>
                <div>
                  <span>Tạm tính</span>
                  <strong>{formatMoney(totalPrice)}</strong>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="staff-booking-panel">
        <div className="panel-heading">
          <h2>3. Thông tin khách hàng</h2>
          <span>Xác nhận đặt chỗ tại quầy</span>
        </div>

        <form className="staff-booking-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Họ tên khách *
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleFormChange}
                placeholder="Nhập họ tên"
                required
              />
            </label>

            <label>
              Số điện thoại *
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleFormChange}
                placeholder="090..."
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleFormChange}
                placeholder="khachhang@email.com"
              />
            </label>

            <label>
              Thanh toan
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleFormChange}
              >
                <option value="PayAtCounter">Thanh toán tại quầy</option>
                <option value="Paid">Đã thanh toán</option>
                <option value="Unpaid">Giữ chỗ, thanh toán sau</option>
              </select>
            </label>
          </div>

          <label>
            Ghi chu
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows="3"
              placeholder="Ghi chú thêm nếu cần"
            />
          </label>

          <label className="checkbox-line">
            <input
              type="checkbox"
              name="sendEmail"
              checked={formData.sendEmail}
              onChange={handleFormChange}
            />
            Gửi email xác nhận nếu khách có cung cấp email
          </label>

          <div className="checkout-bar">
            <div>
              <span>Suất chiếu</span>
              <strong>
                {selectedShowtime ? formatDateTime(selectedShowtime.startTime) : "Chưa chọn"}
              </strong>
            </div>
            <div>
              <span>Tổng tiền</span>
              <strong>{formatMoney(totalPrice)}</strong>
            </div>
            <button type="submit" disabled={submitting || !selectedShowtime}>
              {submitting ? "Đang xác nhận..." : "Xác nhận đặt chỗ"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default StaffBooking;
