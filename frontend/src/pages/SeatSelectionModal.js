import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getSeatmapByShowtime,
  holdSeats,
  prepareQrBooking,
  releaseSeats,
} from "../services/api";

const DEFAULT_PRICE = 75000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatSeatLabel = (seat) => {
  if (!seat) {
    return "";
  }

  if (seat.label) {
    return seat.label;
  }

  return seat.type === "Couple"
    ? `${seat.row}${seat.number}-${seat.number + 1}`
    : `${seat.row}${seat.number}`;
};

const formatCountdown = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const normalizePhone = (value) => value.replace(/[^\d]/g, "").slice(0, 11);

const seatPrice = (seat, basePrice) =>
  seat?.type === "Couple" ? basePrice * 2 : basePrice;

export default function SeatSelectionModal({
  isOpen,
  selectedShowtime,
  movie,
  user,
  socketRef,
  onClose,
  onBookingSuccess,
}) {
  const [seatMapData, setSeatMapData] = useState(null);
  const [seatModalLoading, setSeatModalLoading] = useState(false);
  const [seatActionLoading, setSeatActionLoading] = useState(false);
  const [preparingBooking, setPreparingBooking] = useState(false);
  const [error, setError] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const bookingPreparedRef = useRef(false);
  const releaseInFlightRef = useRef(false);
  const selectedSeatIdsRef = useRef([]);
  const showtimeIdRef = useRef(null);

  const showtimeId = selectedShowtime?._id || null;
  const basePrice = Number(selectedShowtime?.price || DEFAULT_PRICE);

  useEffect(() => {
    setCustomerInfo((current) => ({
      ...current,
      fullName: current.fullName || user?.fullName || "",
      email: current.email || user?.email || "",
      phone: current.phone || user?.phone || "",
    }));
  }, [user]);

  const loadSeatMap = useCallback(
    async (options = {}) => {
      if (!showtimeId) {
        return;
      }

      const { silent = false } = options;

      try {
        if (!silent) {
          setSeatModalLoading(true);
        }

        const seatmap = await getSeatmapByShowtime(showtimeId);
        setSeatMapData(seatmap);
        setError("");
      } catch (loadError) {
        console.error("Error loading seatmap:", loadError);
        if (!silent) {
          setError(loadError?.message || "Không thể tải sơ đồ ghế.");
        }
      } finally {
        if (!silent) {
          setSeatModalLoading(false);
        }
      }
    },
    [showtimeId],
  );

  useEffect(() => {
    if (!isOpen || !showtimeId) {
      bookingPreparedRef.current = false;
      setSeatMapData(null);
      setError("");
      return;
    }

    bookingPreparedRef.current = false;
    loadSeatMap();
  }, [isOpen, showtimeId, loadSeatMap]);

  const selectedSeats = useMemo(
    () => (seatMapData?.seats || []).filter((seat) => seat.isHeldByMe),
    [seatMapData],
  );

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeats.map((seat) => seat._id);
    showtimeIdRef.current = showtimeId;
  }, [selectedSeats, showtimeId]);

  useEffect(() => {
    if (!isOpen || selectedSeats.length === 0) {
      setNowTick(Date.now());
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen, selectedSeats.length]);

  const holdDeadline = useMemo(() => {
    if (selectedSeats.length === 0) {
      return null;
    }

    return selectedSeats.reduce((earliest, seat) => {
      const seatDeadline = seat.heldUntil ? new Date(seat.heldUntil).getTime() : null;
      if (!seatDeadline) {
        return earliest;
      }

      if (!earliest) {
        return seatDeadline;
      }

      return Math.min(earliest, seatDeadline);
    }, null);
  }, [selectedSeats]);

  const countdownSeconds = holdDeadline
    ? Math.max(0, Math.floor((holdDeadline - nowTick) / 1000))
    : 0;

  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + seatPrice(seat, basePrice),
    0,
  );

  const releaseHeldSeats = useCallback(async (options = {}) => {
    if (releaseInFlightRef.current || bookingPreparedRef.current) {
      return;
    }

    const targetShowtimeId = options.showtimeId || showtimeIdRef.current;
    const targetSeatIds = options.seatIds || selectedSeatIdsRef.current;

    if (!targetShowtimeId || !Array.isArray(targetSeatIds) || targetSeatIds.length === 0) {
      return;
    }

    releaseInFlightRef.current = true;

    try {
      await releaseSeats({
        showtimeId: targetShowtimeId,
        seatIds: targetSeatIds,
      });
    } catch (releaseError) {
      console.error("Best-effort release failed:", releaseError);
    } finally {
      releaseInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !showtimeId || !socketRef?.current) {
      return undefined;
    }

    const socket = socketRef.current;
    const handleSeatChange = (payload) => {
      if (payload?.showtimeId === showtimeId) {
        loadSeatMap({ silent: true });
      }
    };

    socket.emit("join_showtime", showtimeId);
    socket.on("showtime_seats_changed", handleSeatChange);

    return () => {
      socket.emit("leave_showtime", showtimeId);
      socket.off("showtime_seats_changed", handleSeatChange);
    };
  }, [isOpen, showtimeId, socketRef, loadSeatMap]);

  useEffect(() => {
    if (!isOpen || !showtimeId) {
      return undefined;
    }

    const handlePageHide = () => {
      void releaseHeldSeats();
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [isOpen, showtimeId, releaseHeldSeats]);

  useEffect(() => {
    if (!showtimeId) {
      return undefined;
    }

    return () => {
      if (!bookingPreparedRef.current) {
        void releaseHeldSeats({ showtimeId });
      }
    };
  }, [showtimeId, releaseHeldSeats]);

  useEffect(() => {
    if (!isOpen || user?._id || user?.id) {
      return;
    }

    void releaseHeldSeats();
  }, [isOpen, user, releaseHeldSeats]);

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

  const handleCustomerInfoChange = (event) => {
    const { name, value } = event.target;

    setCustomerInfo((current) => ({
      ...current,
      [name]:
        name === "phone"
          ? normalizePhone(value)
          : value,
    }));
  };

  const toggleSeat = async (seat) => {
    if (!showtimeId || seatActionLoading || preparingBooking) {
      return;
    }

    try {
      setSeatActionLoading(true);
      setError("");

      if (seat.isHeldByMe) {
        await releaseSeats({
          showtimeId,
          seatIds: [seat._id],
        });
      } else if (seat.status === "Available") {
        await holdSeats({
          showtimeId,
          seatIds: [seat._id],
        });
      } else if (seat.status === "Holding") {
        setError("Ghế này đang được người khác giữ.");
      } else {
        setError("Ghế này không còn khả dụng.");
      }

      await loadSeatMap({ silent: true });
    } catch (toggleError) {
      console.error("Seat action failed:", toggleError);
      setError(toggleError?.message || "Không thể cập nhật trạng thái ghế.");
      await loadSeatMap({ silent: true });
    } finally {
      setSeatActionLoading(false);
    }
  };

  const handleClose = () => {
    if (!preparingBooking) {
      void releaseHeldSeats();
    }

    onClose?.();
  };

  const handleBookingConfirmation = async () => {
    if (!showtimeId || selectedSeats.length === 0) {
      setError("Vui lòng chọn ít nhất một ghế.");
      return;
    }

    const normalizedCustomerInfo = {
      fullName: customerInfo.fullName.trim(),
      email: customerInfo.email.trim(),
      phone: customerInfo.phone.trim(),
      notes: customerInfo.notes.trim(),
    };

    if (!normalizedCustomerInfo.fullName) {
      setError("Vui lòng nhập họ tên người đặt.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedCustomerInfo.email)) {
      setError("Email không đúng định dạng.");
      return;
    }

    if (normalizedCustomerInfo.phone.length < 9) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    try {
      setPreparingBooking(true);
      setError("");

      const response = await prepareQrBooking({
        showtimeId,
        seatIds: selectedSeats.map((seat) => seat._id),
        customerInfo: normalizedCustomerInfo,
      });

      bookingPreparedRef.current = true;

      if (response?.booking?._id) {
        localStorage.setItem("lastOrderBookingId", response.booking._id);
      }

      onBookingSuccess?.(response?.booking || null);
    } catch (prepareError) {
      console.error("Prepare QR booking failed:", prepareError);
      setError(prepareError?.message || "Không thể tạo QR thanh toán.");
      bookingPreparedRef.current = false;
      await loadSeatMap({ silent: true });
    } finally {
      setPreparingBooking(false);
    }
  };

  const getSeatClass = (seat) => {
    const classes = ["seat-button"];

    if (seat.type === "Couple") {
      classes.push("couple");
    }

    if (seat.type === "VIP") {
      classes.push("vip");
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

  if (!isOpen || !selectedShowtime) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="seat-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="seat-modal-header">
          <h3>Chọn ghế - {movie?.title}</h3>
          <button className="modal-close" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="seat-modal-info">
          <p>
            <strong>Suất chiếu:</strong>{" "}
            {new Date(selectedShowtime.startTime).toLocaleString("vi-VN")}
          </p>
          <p>
            <strong>Rạp:</strong>{" "}
            {selectedShowtime.cinemasId?.name ||
              selectedShowtime.cinema?.name ||
              selectedShowtime.roomId?.cinemaId?.name ||
              selectedShowtime.room?.cinemaId?.name ||
              "N/A"}
          </p>
          <p>
            <strong>Phòng:</strong>{" "}
            {selectedShowtime.roomId?.name || selectedShowtime.room?.name || "N/A"}
          </p>
        </div>

        {error ? <div className="selection-error">{error}</div> : null}

        <div className="screen">MÀN HÌNH CHIẾU</div>

        <div className="seat-grid-modal">
          {seatModalLoading ? (
            <p>Đang tải sơ đồ ghế...</p>
          ) : !seatMapData?.seats?.length ? (
            <p>Không có ghế khả dụng cho suất chiếu này.</p>
          ) : (
            Object.keys(groupedSeats)
              .sort()
              .map((row) => (
                <div key={row} className="seat-row">
                  <span className="row-label">{row}</span>
                  <div className="row-seats">
                    {groupedSeats[row]
                      .sort((left, right) => left.number - right.number)
                      .map((seat) => (
                        <button
                          key={seat._id}
                          className={getSeatClass(seat)}
                          onClick={() => toggleSeat(seat)}
                          disabled={
                            seatActionLoading ||
                            preparingBooking ||
                            (!seat.isHeldByMe && seat.status !== "Available")
                          }
                          title={formatSeatLabel(seat)}
                        >
                          {formatSeatLabel(seat)}
                        </button>
                      ))}
                  </div>
                </div>
              ))
          )}
        </div>

        <div className="seat-legend">
          <span>
            <i className="available" /> Trống
          </span>
          <span>
            <i className="selected" /> Ghế của bạn
          </span>
          <span>
            <i className="booked" /> Đã đặt
          </span>
          <span>
            <i className="holding" /> Đang giữ
          </span>
          <span>
            <i className="vip" /> VIP
          </span>
          <span>
            <i className="couple" /> Ghế đôi
          </span>
        </div>

        <div className="selection-summary">
          <div>
            Ghế đã chọn:{" "}
            <strong>
              {selectedSeats.length > 0
                ? selectedSeats.map((seat) => formatSeatLabel(seat)).join(", ")
                : "Chưa có"}
            </strong>
          </div>
          <div>
            Tổng tiền: <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
          </div>
        </div>

        <div className="seat-customer-form">
          <div className="seat-customer-grid">
            <label className="seat-customer-field">
              <span>Họ tên</span>
              <input
                name="fullName"
                type="text"
                value={customerInfo.fullName}
                onChange={handleCustomerInfoChange}
                placeholder="Nhập họ tên"
              />
            </label>

            <label className="seat-customer-field">
              <span>Số điện thoại</span>
              <input
                name="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={handleCustomerInfoChange}
                placeholder="090..."
              />
            </label>

            <label className="seat-customer-field seat-customer-field-full">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={customerInfo.email}
                onChange={handleCustomerInfoChange}
                placeholder="email@example.com"
              />
            </label>

            <label className="seat-customer-field seat-customer-field-full">
              <span>Ghi chú</span>
              <textarea
                name="notes"
                rows="2"
                value={customerInfo.notes}
                onChange={handleCustomerInfoChange}
                placeholder="Thông tin thêm nếu cần"
              />
            </label>
          </div>
        </div>

        <div className="seat-modal-footer">
          {countdownSeconds > 0 ? (
            <div className="countdown-info">
              Thời gian giữ ghế còn lại:
              <span className="countdown-timer">{formatCountdown(countdownSeconds)}</span>
            </div>
          ) : (
            <div className="countdown-info">Chọn ghế để tạo QR thanh toán.</div>
          )}

          <div className="seat-modal-actions">
            <button className="btn btn-back" onClick={handleClose} disabled={preparingBooking}>
              Đóng
            </button>
            <button
              className="btn btn-primary"
              disabled={selectedSeats.length === 0 || preparingBooking || seatActionLoading}
              onClick={handleBookingConfirmation}
            >
              {preparingBooking
                ? "Đang tạo QR..."
                : `Tạo QR thanh toán (${selectedSeats.length} ghế)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
