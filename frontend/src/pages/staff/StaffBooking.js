import React, { useEffect, useMemo, useState } from "react";
import {
  createStaffBookingOrder,
  getStaffBookingSeatMap,
  getStaffBookingShowtimes,
  getAllMovies,
  getAllCinemas,
  staffApplyVoucher,
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

const getSevenDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
};

function StaffBooking() {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
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

  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [movieData, cinemaData] = await Promise.all([
          getAllMovies(),
          getAllCinemas()
        ]);
        setMovies(Array.isArray(movieData) ? movieData : []);
        setCinemas(Array.isArray(cinemaData) ? cinemaData : []);
      } catch (err) {
        setError(err?.message || "Không tải được dữ liệu.");
      }
    };

    loadData();
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
        setDiscountAmount(0);
        setVoucherCode("");
        setVoucherError("");
        setVoucherSuccess("");

        // Load ALL showtimes for the week (no date filter)
        const data = await getStaffBookingShowtimes({
          movieId: selectedMovieId || undefined,
          cinemaId: selectedCinemaId || undefined,
        });

        setAllShowtimes(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Không tải được suất chiếu.");
      } finally {
        setLoadingShowtimes(false);
      }
    };

    loadShowtimes();
  }, [selectedMovieId, selectedCinemaId]);

  // Filter showtimes by selected date on client side
  const showtimes = useMemo(() => {
    if (!selectedDate) return allShowtimes;
    return allShowtimes.filter((st) => {
      const stDate = new Date(st.startTime).toISOString().split("T")[0];
      return stDate === selectedDate;
    });
  }, [allShowtimes, selectedDate]);

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

  // Default price per seat (can be configured)
  const pricePerSeat = 75000;
  const totalPrice = selectedSeats.reduce((sum, seat) => {
    if (seat.type === "Couple") {
      return sum + pricePerSeat * 2;
    }
    return sum + pricePerSeat;
  }, 0);
  const finalPrice = Math.max(0, totalPrice - discountAmount);

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
    if (type === "checkbox") {
      setFormData((current) => ({ ...current, [name]: checked }));
      return;
    }

    if (name === "customerName") {
      const cleaned = value.replace(/[^a-zA-ZÀ-ỹ\s]/g, "").slice(0, 100);
      setFormData((current) => ({ ...current, [name]: cleaned }));
      return;
    }

    if (name === "customerPhone") {
      const cleaned = value.replace(/[^0-9]/g, "").slice(0, 11);
      setFormData((current) => ({ ...current, [name]: cleaned }));
      return;
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Vui lòng nhập mã giảm giá.");
      return;
    }
    if (totalPrice === 0) {
      setVoucherError("Vui lòng chọn suất và ghế trước khi áp dụng mã.");
      return;
    }
    
    try {
      setCheckingVoucher(true);
      setVoucherError("");
      setVoucherSuccess("");
      
      const res = await staffApplyVoucher(voucherCode, totalPrice);
      if (res && res.discountAmount) {
        setDiscountAmount(res.discountAmount);
        setVoucherSuccess(`Đã áp dụng giảm ${formatMoney(res.discountAmount)}`);
      } else {
        setDiscountAmount(0);
      }
    } catch (err) {
      setDiscountAmount(0);
      setVoucherError(err?.message || "Mã giảm giá không hợp lệ.");
    } finally {
      setCheckingVoucher(false);
    }
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

    if (formData.customerPhone) {
      if (!formData.customerPhone.startsWith("0")) {
        setError("Số điện thoại phải bắt đầu bằng số 0.");
        return;
      }
      if (formData.customerPhone.length < 9 || formData.customerPhone.length > 11) {
        setError("Số điện thoại phải từ 9 đến 11 số.");
        return;
      }
    }

    if (formData.customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail)) {
        setError("Email không đúng định dạng.");
        return;
      }
    }

    if (formData.sendEmail && !formData.customerEmail) {
      setError("Vui lòng nhập Email nếu muốn gửi thông báo.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const result = await createStaffBookingOrder({
        showtimeId: selectedShowtimeId,
        seatIds: selectedSeatIds,
        voucherCode: discountAmount > 0 ? voucherCode : undefined,
        pricePerSeat: pricePerSeat,
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
      setDiscountAmount(0);
      setVoucherCode("");
      setVoucherError("");
      setVoucherSuccess("");

      const refreshedSeatMap = await getStaffBookingSeatMap(selectedShowtimeId);
      setSeatMapData(refreshedSeatMap);

      const refreshedShowtimes = await getStaffBookingShowtimes({
        movieId: selectedMovieId || undefined,
      });
      setAllShowtimes(Array.isArray(refreshedShowtimes) ? refreshedShowtimes : []);
    } catch (err) {
      setError(
        err?.message === "Network Error" 
        ? "Network Error (Hãy kiểm tra phiên đăng nhập đã hết hạn hoặc máy chủ backend)."
        : (err?.message || "Đặt chỗ thất bại.")
      );
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
          <div className="staff-date-tabs">
            {getSevenDays().map((date) => {
              const d = new Date(date);
              const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
              const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} - ${weekDays[d.getDay()]}`;
              const count = allShowtimes.filter((st) => {
                const stDate = new Date(st.startTime).toISOString().split("T")[0];
                if (stDate !== date) return false;
                if (selectedMovieId && st.movieId?._id !== selectedMovieId) return false;
                // Filter by cinema through room
                if (selectedCinemaId) {
                  const stCinemaId = st.roomId?.cinemaId?._id || st.roomId?.cinemaId;
                  if (stCinemaId !== selectedCinemaId) return false;
                }
                return true;
              }).length;
              return (
                <button
                  key={date}
                  type="button"
                  className={`staff-date-tab ${selectedDate === date ? "active" : ""}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="tab-date">{label}</span>
                  <span className="tab-count">{count} suất</span>
                </button>
              );
            })}
          </div>

          <label>
            Rạp
            <select
              value={selectedCinemaId}
              onChange={(event) => setSelectedCinemaId(event.target.value)}
            >
              <option value="">Tất cả rạp</option>
              {cinemas.map((cinema) => (
                <option key={cinema._id} value={cinema._id}>
                  {cinema.name}
                </option>
              ))}
            </select>
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
              const cinemaName = showtime.roomId?.cinemaId?.name || showtime.room?.cinemaId?.name || "N/A";
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
                    {cinemaName} - {showtime.roomId?.name || showtime.room?.name || "N/A"}
                  </span>
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
              <div className="room-info">
                <span className="room-name">{selectedShowtime.roomId?.name || selectedShowtime.room?.name || "Phòng chiếu"}</span>
                <span className="room-type">{selectedShowtime.roomId?.type || selectedShowtime.room?.type || "Standard"}</span>
                <span className="room-capacity">Sức chứa: {selectedShowtime.roomId?.capacity || selectedShowtime.room?.capacity || 0} ghế</span>
              </div>
              <div className="screen-indicator">Màn hình</div>
              <div className="seat-legend">
                <span><i className="available" /> Trống</span>
                <span><i className="selected" /> Đang chọn</span>
                <span><i className="booked" /> Đã đặt</span>
                <span><i className="vip" /> VIP</span>
                <span><i className="couple" /> Đôi</span>
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
                          seat.type === "Couple" ? "couple" : "",
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
          <div className="customer-form-grid">
            <div className="form-group">
              <label htmlFor="customerName">Họ tên khách *</label>
              <input
                id="customerName"
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleFormChange}
                placeholder="Nhập họ tên"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerPhone">Số điện thoại *</label>
              <input
                id="customerPhone"
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleFormChange}
                placeholder="090..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerEmail">Email</label>
              <input
                id="customerEmail"
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleFormChange}
                placeholder="khachhang@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentStatus">Thanh toán</label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleFormChange}
              >
                <option value="PayAtCounter">Thanh toán tại quầy</option>
                <option value="Paid">Đã thanh toán</option>
                <option value="Unpaid">Giữ chỗ, thanh toán sau</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Ghi chú</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows="2"
              placeholder="Ghi chú thêm nếu cần"
            />
          </div>

          <div className="voucher-group">
            <label htmlFor="voucherInput">Mã giảm giá</label>
            <div className="voucher-row">
              <input
                id="voucherInput"
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher"
              />
              <button
                type="button"
                className="voucher-btn"
                onClick={handleApplyVoucher}
                disabled={checkingVoucher || !voucherCode}
              >
                {checkingVoucher ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
            </div>
            {voucherError && <p className="voucher-error">{voucherError}</p>}
            {voucherSuccess && <p className="voucher-success">{voucherSuccess}</p>}
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="sendEmail"
              name="sendEmail"
              checked={formData.sendEmail}
              onChange={handleFormChange}
            />
            <label htmlFor="sendEmail">Gửi email xác nhận nếu khách có cung cấp email</label>
          </div>

          <div className="checkout-bar">
            <div className="checkout-info">
              <span>Suất chiếu / Phim</span>
              <strong>
                {selectedShowtime ? `${selectedShowtime.movieId?.title || 'Phim'} - ${selectedShowtime.roomId?.name || selectedShowtime.room?.name || 'N/A'}` : "Chưa chọn"}
              </strong>
            </div>
            <div className="checkout-info">
              <span>Tổng tiền</span>
              <div className="price-block">
                {discountAmount > 0 && <span className="original-price">{formatMoney(totalPrice)}</span>}
                <strong className="final-price">{formatMoney(finalPrice)}</strong>
              </div>
            </div>
            <button type="submit" className="checkout-btn" disabled={submitting || !selectedShowtime || selectedSeatIds.length === 0}>
              {submitting ? "Đang xác nhận..." : "Xác nhận đặt chỗ"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default StaffBooking;
