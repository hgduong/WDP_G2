import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  createStaffBookingOrder,
  getAllMovies,
  getAllCinemas,
  getStaffBookingSeatMap,
  getStaffBookingShowtimes,
  staffApplyVoucher,
  getHeldSeats,
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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getLocalDateString = (dateInput) => {
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getSevenDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(getLocalDateString(d));
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
  const [heldSeatIds, setHeldSeatIds] = useState([]); // Seats held by other users
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

  // Filter and Group showtimes by movie on client side
  const groupedShowtimes = useMemo(() => {
    // 1. Filter by date/cinema/movie select
    const filtered = allShowtimes.filter((st) => {
      // Date filter (local time)
      const stDate = getLocalDateString(st.startTime);
      if (selectedDate && stDate !== selectedDate) return false;

      // Cinema filter (through room)
      if (selectedCinemaId) {
        const stCinemaId = st.roomId?.cinemaId?._id || st.roomId?.cinemaId ||
          st.room?.cinemaId?._id || st.room?.cinemaId;
        if (stCinemaId !== selectedCinemaId) return false;
      }

      // Movie select filter
      if (selectedMovieId && st.movieId?._id !== selectedMovieId) return false;

      return true;
    });

    // 2. Group by movie
    const groups = {};
    filtered.forEach((st) => {
      const mId = st.movieId?._id || "unknown";
      if (!groups[mId]) {
        groups[mId] = {
          movie: st.movieId,
          sessions: [],
        };
      }
      groups[mId].sessions.push(st);
    });

    // Sort sessions by time within each movie
    Object.values(groups).forEach((g) => {
      g.sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });

    return Object.values(groups);
  }, [allShowtimes, selectedDate, selectedCinemaId, selectedMovieId]);

  // Flatten for count
  const showtimesCount = useMemo(() => {
    return groupedShowtimes.flatMap(g => g.sessions).length;
  }, [groupedShowtimes]);

  // Reset selection when main filters change
  useEffect(() => {
    setSelectedShowtimeId("");
    setSeatMapData(null);
    setSelectedSeatIds([]);
    setDiscountAmount(0);
    setVoucherCode("");
    setVoucherError("");
    setVoucherSuccess("");
  }, [selectedDate, selectedCinemaId]);

  const loadSeatMap = useCallback(async (isBackground = false) => {
    if (!selectedShowtimeId) return;

    try {
      if (!isBackground) {
        setLoadingSeatMap(true);
        setSelectedSeatIds([]); // Only reset selection on manual/initial load
      }

      const data = await getStaffBookingSeatMap(selectedShowtimeId);
      setSeatMapData(data);
    } catch (err) {
      if (!isBackground) {
        setError(err?.message || "Không tải được sơ đồ ghế.");
      }
    } finally {
      if (!isBackground) {
        setLoadingSeatMap(false);
      }
    }
  }, [selectedShowtimeId]);

  useEffect(() => {
    loadSeatMap(false);
  }, [loadSeatMap]);

  // Real-time sync: poll for held seats every 5 seconds
  useEffect(() => {
    if (!selectedShowtimeId) {
      setHeldSeatIds([]);
      return;
    }

    const fetchHeld = async () => {
      try {
        const heldData = await getHeldSeats(selectedShowtimeId);
        if (Array.isArray(heldData)) {
          setHeldSeatIds(heldData.map(s => s._id));
        }
      } catch (err) {
        console.error("Lỗi khi đồng bộ ghế:", err);
      }
    };

    // Fallback: Re-fetch entire seat map every 20 seconds
    const mapInterval = setInterval(() => loadSeatMap(true), 20000);

    return () => {
      clearInterval(mapInterval);
    };
  }, [selectedShowtimeId, loadSeatMap]);

  const selectedShowtime = useMemo(
    () => {
      const allFlat = groupedShowtimes.flatMap(g => g.sessions);
      return allFlat.find((showtime) => showtime._id === selectedShowtimeId) || null;
    },
    [selectedShowtimeId, groupedShowtimes],
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

  const pricePerSeat = 75000;
  const totalPrice = selectedSeats.reduce((sum, seat) => {
    if (seat.type === "Couple") {
      return sum + pricePerSeat * 2;
    }
    return sum + pricePerSeat;
  }, 0);
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const toggleSeat = (seat) => {
    const status = (seat.status || "").toLowerCase();
    if (status !== "available") {
      return;
    }

    // Also prevent selection if seat is currently held by someone else (synced)
    if (heldSeatIds.includes(seat._id) && !selectedSeatIds.includes(seat._id)) {
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

    if (formData.sendEmail) {
      if (!formData.customerEmail) {
        setError("Vui lòng nhập Email nếu muốn gửi thông báo.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail)) {
        setError("Email không đúng định dạng.");
        return;
      }
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
        cinemaId: selectedCinemaId || undefined
      });
      setAllShowtimes(Array.isArray(refreshedShowtimes) ? refreshedShowtimes : []);
    } catch (err) {
      setError(err?.message || "Đặt chỗ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-booking-page">
      <section className="staff-booking-hero-new">
        <div className="hero-content">
          <span className="staff-booking-eyebrow">Bàn đặt chỗ staff</span>
          <h1>Đặt chỗ nhanh tại quầy</h1>
          <p>
            Hệ thống đặt chỗ tập trung dành cho nhân viên. Chọn rạp, ngày chiếu và phim để bắt đầu.
          </p>
        </div>

        <div className="staff-booking-controls">
          {/* 1. Chọn Rạp */}
          <div className="control-section">
            <h3 className="control-title">1. Chọn Rạp</h3>
            <select
              className="cinema-select-full"
              value={selectedCinemaId}
              onChange={(event) => setSelectedCinemaId(event.target.value)}
            >
              <option value="">-- Tất cả rạp --</option>
              {cinemas.map((cinema) => (
                <option key={cinema._id} value={cinema._id}>
                  {cinema.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Ngày */}
          <div className="control-section">
            <h3 className="control-title">2. Chọn Ngày</h3>
            <div className="staff-date-tabs">
              {getSevenDays().map((date) => {
                const d = new Date(date);
                const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} - ${weekDays[d.getDay()]}`;

                const count = allShowtimes.filter((st) => {
                  const stDate = getLocalDateString(st.startTime);
                  if (stDate !== date) return false;
                  if (selectedMovieId && st.movieId?._id !== selectedMovieId) return false;

                  const stCinemaId = st.roomId?.cinemaId?._id || st.roomId?.cinemaId ||
                    st.room?.cinemaId?._id || st.room?.cinemaId;
                  if (selectedCinemaId && stCinemaId !== selectedCinemaId) return false;

                  return true;
                }).length;

                return (
                  <button
                    key={date}
                    type="button"
                    className={`staff-date-tab-premium ${selectedDate === date ? "active" : ""}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="tab-date-header">{label.split(" - ")[1]}</div>
                    <div className="tab-date-main">{label.split(" - ")[0]}</div>
                    <div className="tab-date-count">{count} suất</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Lọc theo Phim */}
          <div className="control-section">
            <h3 className="control-title">3. Lọc theo Phim</h3>
            <div className="filter-movie-row">
              <select
                className="movie-select-full"
                value={selectedMovieId}
                onChange={(event) => setSelectedMovieId(event.target.value)}
              >
                <option value="">-- Tất cả phim --</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="clear-btn"
                onClick={() => {
                  setSelectedMovieId("");
                  setSelectedCinemaId("");
                }}
              >
                Xóa lọc
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="staff-booking-alert error">{error}</div> : null}
      {success ? <div className="staff-booking-alert success">{success}</div> : null}

      <div className="staff-booking-layout">
        <section className="staff-booking-panel">
          <div className="panel-heading">
            <h2>4. Chọn suất chiếu</h2>
            <span className="count-badge">{loadingShowtimes ? "Đang tải..." : `${showtimesCount} suất`}</span>
          </div>

          <div className="showtime-groups">
            {groupedShowtimes.map((group) => (
              <div key={group.movie?._id || "unknown"} className="movie-showtime-group">
                <h3 className="group-movie-title">
                  {group.movie?.title || "Phim chưa xác định"}
                </h3>
                <div className="time-grid-mini">
                  {group.sessions.map((showtime) => {
                    const isActive = selectedShowtimeId === showtime._id;
                    const startTime = new Date(showtime.startTime);

                    // Default duration 120min if not set
                    const durationMin = showtime.duration || 120;
                    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);
                    const now = new Date();
                    const isFinished = now > endTime;
                    const isOngoing = now >= startTime && now <= endTime;

                    const timeStr = startTime.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const available = showtime.availableSeats ?? 0;
                    const isFull = available === 0;

                    return (
                      <button
                        key={showtime._id}
                        type="button"
                        className={`time-slot-btn ${isActive ? "active" : ""} ${isFull ? "full" : ""} ${isFinished ? "past" : ""} ${isOngoing ? "ongoing" : ""}`}
                        onClick={() => !isFinished && setSelectedShowtimeId(showtime._id)}
                        disabled={isFull || isFinished}
                        title={isFinished ? "Suất chiếu này đã kết thúc" : isOngoing ? "Đang trong quá trình chiếu" : ""}
                      >
                        <span className="slot-time">{timeStr}</span>
                        <span className="slot-room">{showtime.roomId?.name || showtime.room?.name || "N/A"}</span>
                        <span className="slot-seats">
                          {isFinished ? "Đã chiếu xong" : isOngoing ? "Đang chiếu" : isFull ? "Hết ghế" : `Còn ${available} ghế`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!loadingShowtimes && groupedShowtimes.length === 0 ? (
              <div className="empty-state">
                Không có suất chiếu nào phù hợp với bộ lọc hiện tại. Hãy chọn ngày khác hoặc rạp khác.
              </div>
            ) : null}
          </div>
        </section>

        <section className="staff-booking-panel wide">
          <div className="panel-heading">
            <h2>5. Chọn ghế</h2>
            <div className="panel-actions">
              <button
                type="button"
                className="refresh-btn"
                onClick={() => loadSeatMap(false)}
                title="Lấy lại sơ đồ ghế mới nhất"
                disabled={loadingSeatMap}
              >
                {loadingSeatMap ? "..." : " Làm mới"}
              </button>
              <span className="count-badge">
                {selectedSeats.length > 0
                  ? `${selectedSeats.length} ghế đã chọn`
                  : "Chưa chọn ghế"}
              </span>
            </div>
          </div>

          {!selectedShowtime ? (
            <div className="empty-state">Hãy chọn một suất chiếu ở bên trái để tải sơ đồ ghế.</div>
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

                        // Dynamically determine the status to prioritize real-time sync
                        let displayStatus = seat.status.toLowerCase();
                        if (seat.status === "Holding" || seat.status === "holding") {
                          // For staff view, we treat 'Holding' (orange) as available/clear
                          displayStatus = "available";
                        }

                        const seatClass = [
                          "seat-button",
                          displayStatus,
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
                            disabled={displayStatus !== "available"}
                            title={isSelected ? "Ghế đã chọn" : `${seat.label} - ${seat.type}`}
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
                  <strong className="summary-text">
                    {selectedSeats.length > 0
                      ? selectedSeats.map((seat) => seat.label).join(", ")
                      : "Chưa có"}
                  </strong>
                </div>
                <div>
                  <span>Tạm tính</span>
                  <strong className="summary-text">{formatMoney(totalPrice)}</strong>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="staff-booking-panel checkout-panel">
        <div className="panel-heading">
          <h2>6. Thông tin khách hàng & Thanh toán</h2>
          <span className="count-badge">Xác nhận đơn hàng</span>
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
              <label htmlFor="paymentStatus">Trạng thái thanh toán</label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleFormChange}
              >
                <option value="PayAtCounter">Thanh toán tại quầy</option>
                <option value="Paid">Đã thanh toán (Tiền mặt/Chuyển khoản)</option>
                <option value="Unpaid">Giữ chỗ (Chưa thanh toán)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Ghi chú đơn hàng</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows="2"
              placeholder="Ghi chú thêm (VD: Khách lấy bắp nước, khuyến mãi...)"
            />
          </div>

          <div className="voucher-group">
            <label htmlFor="voucherInput">Mã giảm giá / Voucher</label>
            <div className="voucher-row">
              <input
                id="voucherInput"
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã code"
              />
              <button
                type="button"
                className="voucher-btn"
                onClick={handleApplyVoucher}
                disabled={checkingVoucher || !voucherCode}
              >
                {checkingVoucher ? "Đang check..." : "Áp dụng"}
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
            <label htmlFor="sendEmail">Gửi email xác nhận vé cho khách hàng</label>
          </div>

          <div className="checkout-bar">
            <div className="checkout-info">
              <span>Phim & Suất chiếu</span>
              <strong>
                {selectedShowtime ? `${selectedShowtime.movieId?.title || 'Phim'} - ${new Date(selectedShowtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Chưa chọn"}
              </strong>
            </div>
            <div className="checkout-info">
              <span>Tổng tiền thanh toán</span>
              <div className="price-block">
                {discountAmount > 0 && <span className="original-price">{formatMoney(totalPrice)}</span>}
                <strong className="final-price">{formatMoney(finalPrice)}</strong>
              </div>
            </div>
            <button type="submit" className="checkout-btn" disabled={submitting || !selectedShowtime || selectedSeatIds.length === 0}>
              {submitting ? "Đang xử lý..." : "Xác nhận & In vé"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default StaffBooking;
