import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  createStaffBookingOrder,
  getAllCinemas,
  getAllMovies,
  getSeatmapByShowtime,
  getStaffBookingShowtimes,
  holdSeats,
  releaseSeats,
  staffApplyVoucher,
  getActiveMovieTicketTax,
} from "../../services/api";
import "../../assets/styles/StaffBooking.css";

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const todayValue = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const toLocalDate = (input) => {
  const date = new Date(input);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getSevenDays = () => {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(base);
    next.setDate(next.getDate() + index);
    return toLocalDate(next);
  });
};

const normalizePhone = (value) => value.replace(/[^\d]/g, "").slice(0, 11);
const seatPrice = (seat, basePrice) => (seat?.type === "Couple" ? basePrice * 2 : basePrice);

function StaffBooking() {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [allShowtimes, setAllShowtimes] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayValue());
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");
  const [seatMapData, setSeatMapData] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);
  const [seatActionLoading, setSeatActionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());
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
  const [ticketTaxRate, setTicketTaxRate] = useState(8);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");

  const socketRef = useRef(null);
  const heldSeatIdsRef = useRef([]);
  const showtimeIdRef = useRef("");
  const submittingRef = useRef(false);
  const releasingRef = useRef(false);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    const fetchTicketTax = async () => {
      try {
        const tax = await getActiveMovieTicketTax();
        if (tax && tax.taxRate) {
          setTicketTaxRate(tax.taxRate);
        } else {
          setTicketTaxRate(8);
        }
      } catch (error) {
        setTicketTaxRate(8);
      }
    };
    fetchTicketTax();
  }, []);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:9999";
    socketRef.current = io(socketUrl, { withCredentials: true });
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const loadBase = async () => {
      try {
        const [movieData, cinemaData] = await Promise.all([getAllMovies(), getAllCinemas()]);
        setMovies(Array.isArray(movieData) ? movieData : []);
        setCinemas(Array.isArray(cinemaData) ? cinemaData : []);
      } catch (loadError) {
        setError(loadError?.message || "Không tải được dữ liệu.");
      }
    };
    loadBase();
  }, []);

  const loadShowtimes = useCallback(async () => {
    try {
      setLoadingShowtimes(true);
      const data = await getStaffBookingShowtimes({
        movieId: selectedMovieId || undefined,
        cinemaId: selectedCinemaId || undefined,
      });
      setAllShowtimes(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError?.message || "Không tải được suất chiếu.");
    } finally {
      setLoadingShowtimes(false);
    }
  }, [selectedCinemaId, selectedMovieId]);

  useEffect(() => {
    loadShowtimes();
  }, [loadShowtimes]);

  useEffect(() => {
    setSelectedShowtimeId("");
    setSeatMapData(null);
    setSelectedSeatIds([]);
  }, [selectedCinemaId, selectedDate, selectedMovieId]);

  const releaseSelectedSeats = useCallback(async (options = {}) => {
    if (releasingRef.current || submittingRef.current) {
      return;
    }
    const showtimeId = options.showtimeId || showtimeIdRef.current;
    const seatIds = options.seatIds || heldSeatIdsRef.current;
    if (!showtimeId || !seatIds.length) {
      return;
    }
    releasingRef.current = true;
    try {
      await releaseSeats({ showtimeId, seatIds });
    } catch (releaseError) {
      console.error("Staff release failed:", releaseError);
    } finally {
      releasingRef.current = false;
    }
  }, []);

  const loadSeatMap = useCallback(
    async (silent = false) => {
      if (!selectedShowtimeId) {
        return;
      }
      try {
        if (!silent) {
          setLoadingSeatMap(true);
        }
        const data = await getSeatmapByShowtime(selectedShowtimeId);
        setSeatMapData(data);
      } catch (loadError) {
        if (!silent) {
          setError(loadError?.message || "Không tải được sơ đồ ghế.");
        }
      } finally {
        if (!silent) {
          setLoadingSeatMap(false);
        }
      }
    },
    [selectedShowtimeId],
  );

  useEffect(() => {
    if (!selectedShowtimeId) {
      setSeatMapData(null);
      setSelectedSeatIds([]);
      return;
    }
    loadSeatMap();
  }, [selectedShowtimeId, loadSeatMap]);

  useEffect(() => {
    const mySeats = (seatMapData?.seats || [])
      .filter((seat) => seat.isHeldByMe)
      .map((seat) => seat._id);
    setSelectedSeatIds(mySeats);
    heldSeatIdsRef.current = mySeats;
    showtimeIdRef.current = selectedShowtimeId;
  }, [seatMapData, selectedShowtimeId]);

  useEffect(() => {
    if (!selectedSeatIds.length) {
      setNowTick(Date.now());
      return undefined;
    }
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [selectedSeatIds.length]);

  useEffect(() => {
    if (!selectedShowtimeId || !socketRef.current) {
      return undefined;
    }
    const socket = socketRef.current;
    const handleChange = (payload) => {
      if (payload?.showtimeId === selectedShowtimeId) {
        loadSeatMap(true);
      }
    };
    socket.emit("join_showtime", selectedShowtimeId);
    socket.on("showtime_seats_changed", handleChange);
    return () => {
      socket.emit("leave_showtime", selectedShowtimeId);
      socket.off("showtime_seats_changed", handleChange);
    };
  }, [selectedShowtimeId, loadSeatMap]);

  useEffect(() => {
    if (!selectedShowtimeId) {
      return undefined;
    }
    return () => {
      void releaseSelectedSeats({ showtimeId: selectedShowtimeId });
    };
  }, [selectedShowtimeId, releaseSelectedSeats]);

  useEffect(() => {
    setDiscountAmount(0);
    setVoucherError("");
    setVoucherSuccess("");
  }, [selectedSeatIds]);

  const groupedShowtimes = useMemo(() => {
    const filtered = allShowtimes.filter((showtime) => {
      if (selectedDate && toLocalDate(showtime.startTime) !== selectedDate) {
        return false;
      }
      if (selectedCinemaId) {
        const cinemaId =
          showtime.roomId?.cinemaId?._id ||
          showtime.roomId?.cinemaId ||
          showtime.room?.cinemaId?._id ||
          showtime.room?.cinemaId;
        if (cinemaId !== selectedCinemaId) {
          return false;
        }
      }
      if (selectedMovieId && showtime.movieId?._id !== selectedMovieId) {
        return false;
      }
      return true;
    });

    const groups = {};
    filtered.forEach((showtime) => {
      const movieId = showtime.movieId?._id || "unknown";
      if (!groups[movieId]) {
        groups[movieId] = { movie: showtime.movieId, sessions: [] };
      }
      groups[movieId].sessions.push(showtime);
    });

    return Object.values(groups).map((group) => ({
      ...group,
      sessions: [...group.sessions].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    }));
  }, [allShowtimes, selectedCinemaId, selectedDate, selectedMovieId]);

  const selectedShowtime = useMemo(() => {
    const sessions = groupedShowtimes.flatMap((group) => group.sessions);
    return sessions.find((showtime) => showtime._id === selectedShowtimeId) || null;
  }, [groupedShowtimes, selectedShowtimeId]);

  const groupedSeats = useMemo(() => {
    const seats = seatMapData?.seats || [];
    return seats.reduce((groups, seat) => {
      if (!groups[seat.row]) {
        groups[seat.row] = [];
      }
      groups[seat.row].push(seat);
      return groups;
    }, {});
  }, [seatMapData]);

  const selectedSeats = useMemo(() => {
    const seats = seatMapData?.seats || [];
    return seats.filter((seat) => selectedSeatIds.includes(seat._id));
  }, [seatMapData, selectedSeatIds]);

  const pricePerSeat = Number(selectedShowtime?.price || 75000);
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seatPrice(seat, pricePerSeat), 0);
  const taxAmount = totalPrice * (ticketTaxRate / 100);
  const finalPrice = Math.max(0, totalPrice - discountAmount) + taxAmount;

  const holdDeadline = useMemo(() => {
    if (!selectedSeats.length) {
      return null;
    }
    return selectedSeats.reduce((earliest, seat) => {
      const deadline = seat.heldUntil ? new Date(seat.heldUntil).getTime() : null;
      if (!deadline) {
        return earliest;
      }
      return earliest ? Math.min(earliest, deadline) : deadline;
    }, null);
  }, [selectedSeats]);

  const countdownSeconds = holdDeadline
    ? Math.max(0, Math.floor((holdDeadline - nowTick) / 1000))
    : 0;

  const handleSelectShowtime = async (nextShowtimeId) => {
    if (nextShowtimeId === selectedShowtimeId) {
      return;
    }
    setError("");
    setSuccess("");
    await releaseSelectedSeats();
    setSelectedShowtimeId(nextShowtimeId);
  };

  const toggleSeat = async (seat) => {
    if (!selectedShowtimeId || seatActionLoading || submitting) {
      return;
    }
    try {
      setSeatActionLoading(true);
      setError("");
      if (seat.isHeldByMe) {
        await releaseSeats({ showtimeId: selectedShowtimeId, seatIds: [seat._id] });
      } else if (seat.status === "Available") {
        await holdSeats({ showtimeId: selectedShowtimeId, seatIds: [seat._id] });
      } else if (seat.status === "Holding") {
        setError("Ghế này đang được giữ bởi người khác.");
      } else {
        setError("Ghế này không còn khả dụng.");
      }
      await loadSeatMap(true);
    } catch (toggleError) {
      setError(toggleError?.message || "Không cập nhật được ghế.");
      await loadSeatMap(true);
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === "checkbox") {
      setFormData((current) => ({ ...current, [name]: checked }));
      return;
    }
    if (name === "customerPhone") {
      setFormData((current) => ({ ...current, [name]: normalizePhone(value) }));
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
      setVoucherError("Hãy chọn ghế trước khi áp dụng voucher.");
      return;
    }
    try {
      setCheckingVoucher(true);
      setVoucherError("");
      setVoucherSuccess("");
      const result = await staffApplyVoucher(voucherCode.trim(), finalPrice);
      if (result?.discountAmount) {
        setDiscountAmount(result.discountAmount);
        setVoucherSuccess(`Đã áp dụng giảm ${formatMoney(result.discountAmount)}`);
      } else {
        setDiscountAmount(0);
      }
    } catch (voucherApplyError) {
      setDiscountAmount(0);
      setVoucherError(voucherApplyError?.message || "Voucher không hợp lệ.");
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
    if (!selectedSeatIds.length) {
      setError("Hãy giữ ít nhất một ghế trước khi xác nhận.");
      return;
    }
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      setError("Tên và số điện thoại khách hàng là bắt buộc.");
      return;
    }
    if (!formData.customerPhone.startsWith("0")) {
      setError("Số điện thoại phải bắt đầu bằng số 0.");
      return;
    }
    if (formData.customerPhone.length < 9 || formData.customerPhone.length > 11) {
      setError("Số điện thoại phải từ 9 đến 11 số.");
      return;
    }
    if (formData.sendEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.customerEmail.trim() || !emailRegex.test(formData.customerEmail.trim())) {
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
        voucherCode: discountAmount > 0 ? voucherCode.trim() : undefined,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        notes: formData.notes.trim(),
        sendEmail: formData.sendEmail,
        paymentStatus: formData.paymentStatus,
        pricePerSeat,
      });
      setSuccess(`Đã tạo đặt chỗ ${result?.booking?.bookingCode || ""} thành công.`);
      setFormData((current) => ({ ...current, notes: "" }));
      setVoucherCode("");
      setDiscountAmount(0);
      setVoucherError("");
      setVoucherSuccess("");
      await Promise.all([loadSeatMap(true), loadShowtimes()]);
    } catch (submitError) {
      setError(submitError?.message || "Đặt chỗ thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const seatButtonClass = (seat) => {
    const classes = ["seat-button"];
    if (seat.type === "VIP") {
      classes.push("vip");
    }
    if (seat.type === "Couple") {
      classes.push("couple");
    }
    if (seat.isHeldByMe) {
      classes.push("selected");
    } else if (seat.status === "Holding") {
      classes.push("holding");
    } else if (seat.status === "Booked" || seat.status === "Blocked") {
      classes.push("booked");
    } else {
      classes.push("available");
    }
    return classes.join(" ");
  };

  const showtimesCount = groupedShowtimes.flatMap((group) => group.sessions).length;

  return (
    <div className="staff-booking-page">
      <section className="staff-booking-hero-new">
        <div className="hero-content">
          <span className="staff-booking-eyebrow">Bàn đặt chỗ staff</span>
          <h1>Đặt chỗ nhanh tại quầy</h1>
          <p>Staff giữ ghế realtime và xác nhận đơn tại quầy trên cùng seat engine với customer.</p>
        </div>

        <div className="staff-booking-controls">
          <div className="control-section">
            <h3 className="control-title">1. Chọn rạp</h3>
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

          <div className="control-section">
            <h3 className="control-title">2. Chọn ngày</h3>
            <div className="staff-date-tabs">
              {getSevenDays().map((date) => {
                const parsedDate = new Date(date);
                const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                const label = `${String(parsedDate.getDate()).padStart(2, "0")}/${String(parsedDate.getMonth() + 1).padStart(2, "0")} - ${weekDays[parsedDate.getDay()]}`;
                const count = allShowtimes.filter((showtime) => toLocalDate(showtime.startTime) === date).length;
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

          <div className="control-section">
            <h3 className="control-title">3. Lọc theo phim</h3>
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
                <h3 className="group-movie-title">{group.movie?.title || "Phim chưa xác định"}</h3>
                <div className="time-grid-mini">
                  {group.sessions.map((showtime) => {
                    const startTime = new Date(showtime.startTime);
                    const endTime = new Date(startTime.getTime() + (showtime.duration || 120) * 60 * 1000);
                    const now = new Date();
                    const isFinished = now > endTime;
                    const isOngoing = now >= startTime && now <= endTime;
                    const availableSeats = showtime.availableSeats ?? 0;
                    const isFull = availableSeats === 0;
                    return (
                      <button
                        key={showtime._id}
                        type="button"
                        className={`time-slot-btn ${selectedShowtimeId === showtime._id ? "active" : ""} ${isFull ? "full" : ""} ${isFinished ? "past" : ""} ${isOngoing ? "ongoing" : ""}`}
                        onClick={() => !isFinished && handleSelectShowtime(showtime._id)}
                        disabled={isFull || isFinished}
                      >
                        <span className="slot-time">{startTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="slot-room">{showtime.roomId?.name || showtime.room?.name || "N/A"}</span>
                        <span className="slot-seats">
                          {isFinished
                            ? "Đã chiếu xong"
                            : isOngoing
                              ? "Đang chiếu"
                              : isFull
                                ? "Hết ghế"
                                : `Còn ${availableSeats} ghế`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!loadingShowtimes && groupedShowtimes.length === 0 ? (
              <div className="empty-state">Không có suất chiếu phù hợp với bộ lọc hiện tại.</div>
            ) : null}
          </div>
        </section>

        <section className="staff-booking-panel wide">
          <div className="panel-heading">
            <h2>5. Chọn ghế</h2>
            <div className="panel-actions">
              <button type="button" className="refresh-btn" onClick={() => loadSeatMap()} disabled={loadingSeatMap}>
                {loadingSeatMap ? "..." : "Làm mới"}
              </button>
              <span className="count-badge">{selectedSeatIds.length ? `${selectedSeatIds.length} ghế đang giữ` : "Chưa giữ ghế"}</span>
            </div>
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
                <span><i className="selected" /> Ghế staff đang giữ</span>
                <span><i className="holding" /> Đang giữ bởi người khác</span>
                <span><i className="booked" /> Đã đặt</span>
                <span><i className="vip" /> VIP</span>
                <span><i className="couple" /> Đôi</span>
              </div>

              <div className="seat-map">
                {Object.entries(groupedSeats).map(([row, seats]) => (
                  <div key={row} className="seat-row">
                    <div className="row-label">{row}</div>
                    <div className="row-seats">
                      {seats.sort((a, b) => a.number - b.number).map((seat) => (
                        <button
                          key={seat._id}
                          type="button"
                          className={seatButtonClass(seat)}
                          onClick={() => toggleSeat(seat)}
                          disabled={seatActionLoading || submitting || (!seat.isHeldByMe && seat.status !== "Available")}
                          title={seat.label}
                        >
                          {seat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="selection-summary">
                <div>
                  <span>Ghế staff đang giữ</span>
                  <strong className="summary-text">{selectedSeats.length ? selectedSeats.map((seat) => seat.label).join(", ") : "Chưa có"}</strong>
                </div>
                <div>
                  <span>Tạm tính</span>
                  <strong className="summary-text">{formatMoney(totalPrice)}</strong>
                </div>
                <div>
                  <span>Countdown hold</span>
                  <strong className="summary-text">
                    {countdownSeconds > 0
                      ? `${Math.floor(countdownSeconds / 60)}:${String(countdownSeconds % 60).padStart(2, "0")}`
                      : "--:--"}
                  </strong>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="staff-booking-panel checkout-panel">
        <div className="panel-heading">
          <h2>6. Thông tin khách hàng và thanh toán</h2>
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
              <select id="paymentStatus" name="paymentStatus" value={formData.paymentStatus} onChange={handleFormChange}>
                <option value="PayAtCounter">Thanh toán tại quầy</option>
                <option value="Paid">Đã thanh toán</option>
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
              placeholder="Thông tin thêm nếu cần"
            />
          </div>

          <div className="voucher-group">
            <label htmlFor="voucherInput">Mã giảm giá / Voucher</label>
            <div className="voucher-row">
              <input
                id="voucherInput"
                type="text"
                value={voucherCode}
                onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                placeholder="Nhập mã code"
              />
              <button type="button" className="voucher-btn" onClick={handleApplyVoucher} disabled={checkingVoucher || !voucherCode}>
                {checkingVoucher ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
            </div>
            {voucherError ? <p className="voucher-error">{voucherError}</p> : null}
            {voucherSuccess ? <p className="voucher-success">{voucherSuccess}</p> : null}
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="sendEmail" name="sendEmail" checked={formData.sendEmail} onChange={handleFormChange} />
            <label htmlFor="sendEmail">Gửi email xác nhận vé cho khách</label>
          </div>

          <div className="checkout-bar">
            <div className="checkout-info">
              <span>Phim và suất chiếu</span>
              <strong>
                {selectedShowtime
                  ? `${selectedShowtime.movieId?.title || "Phim"} - ${new Date(selectedShowtime.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                  : "Chưa chọn"}
              </strong>
            </div>
            <div className="checkout-info">
              <span>Tiền vé: {formatMoney(totalPrice)}</span>
              {ticketTaxRate > 0 && <span>Thuế ({ticketTaxRate}%): {formatMoney(taxAmount)}</span>}
              {discountAmount > 0 && <span>Giảm giá: -{formatMoney(discountAmount)}</span>}
              <span>Tổng tiền thanh toán</span>
              <div className="price-block">
                <strong className="final-price">{formatMoney(finalPrice)}</strong>
              </div>
            </div>
            <button type="submit" className="checkout-btn" disabled={submitting || !selectedShowtime || !selectedSeatIds.length}>
              {submitting ? "Đang xử lý..." : "Xác nhận và in vé"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default StaffBooking;
