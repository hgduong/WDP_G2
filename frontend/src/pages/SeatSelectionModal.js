import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getSeatmapByShowtime,
  getBookingById,
  holdSeats,
  prepareQrBooking,
  releaseSeats,
} from "../services/api";
import { generateQRCodeUrl } from "../utils/orderUtils";

const DEFAULT_PRICE = 75000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatSeatLabel = (seat, allSeats = []) => {
  if (!seat) {
    return "";
  }

  if (seat.label) {
    return seat.label;
  }

  // Dynamic Couple Label based on pair
  if (seat.type === "Couple") {
    let rightNumber = seat.number + 1; // Fallback
    if (seat.couplePairId) {
      const pair = allSeats.find((s) => s._id === seat.couplePairId);
      if (pair) {
        rightNumber = pair.number;
      }
    }
    // Return formatted as smallerNumber-largerNumber regardless of orientation
    return seat.number < rightNumber
      ? `${seat.row}${seat.number}-${rightNumber}`
      : `${seat.row}${rightNumber}-${seat.number}`;
  }

  return `${seat.row}${seat.number}`;
};
// 60 Second
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
  const [qrResult, setQrResult] = useState(null);
  const [paymentNowTick, setPaymentNowTick] = useState(Date.now());
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
        //Hide

        if (seatmap && Array.isArray(seatmap.seats)) {
          seatmap.seats = seatmap.seats.map((seat) => {
            let isHidden = false;
            if (seat.type === "Couple" && seat.couplePairId) {
              const pairSeat = seatmap.seats.find((s) => s._id === seat.couplePairId);
              if (pairSeat && seat.number > pairSeat.number) {
                isHidden = true; // Hide the right-side seat of the pair
              }
            }
            return { ...seat, isHidden };
          });
        }

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
    () => (seatMapData?.seats || []).filter((seat) => seat.isHeldByMe && !seat.isHidden),
    [seatMapData],
  );

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeats.map((seat) => seat._id);
    showtimeIdRef.current = showtimeId;
  }, [selectedSeats, showtimeId]);

  useEffect(() => {
    if (!isOpen || (selectedSeats.length === 0 && !qrResult)) {
      setNowTick(Date.now());
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen, selectedSeats.length, qrResult]);

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

  const paymentCountdownSeconds = useMemo(() => {
    const expiresAt = qrResult?.payment?.expiresAt;
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - nowTick) / 1000));
  }, [qrResult, nowTick]);

  const handleCancelPayment = () => {
    setQrResult(null);
    bookingPreparedRef.current = false;
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!qrResult?.booking?._id) return;
    try {
      const booking = await getBookingById(qrResult.booking._id);

      // If payment is Paid, Expired, or Cancelled, we should stop showing the overlay
      if (booking.paymentStatus === "Paid") {
        setQrResult(null);
        bookingPreparedRef.current = false;
        onBookingSuccess?.(booking);
      } else if (["Expired", "Cancelled"].includes(booking.paymentStatus)) {
        setQrResult(null);
        bookingPreparedRef.current = false;
        setError(booking.paymentStatus === "Expired" ? "Yêu cầu thanh toán đã hết hạn." : "Thanh toán đã bị hủy.");
        loadSeatMap({ silent: true });
      }
    } catch (err) {
      console.error("Failed to check payment status:", err);
    }
  }, [qrResult, onBookingSuccess, loadSeatMap]);

  // Fallback Polling if socket fails
  useEffect(() => {
    if (!qrResult?._id && !qrResult?.booking?._id) return undefined;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [qrResult, checkPaymentStatus]);

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
        if (payload.reason === "payment_paid") {
          checkPaymentStatus();
        }
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
      if (seat.isHidden) return groups;

      if (!groups[seat.row]) {
        groups[seat.row] = [];
      }

      groups[seat.row].push(seat);
      return groups;
    }, {});
  }, [seatMapData]);

  const maxColumns = useMemo(() => {
    return (seatMapData?.seats || []).reduce((max, seat) => Math.max(max, seat.number), 0);
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
      console.error("Seat action failed [toggleError]:", toggleError);
      if (toggleError?.response?.data) {
        console.error("Response data details:", toggleError.response.data);
      }
      setError(toggleError?.message || toggleError?.response?.data?.message || "Không thể cập nhật trạng thái ghế.");
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
        setQrResult(response);
      }
    } catch (prepareError) {
      console.error("Prepare QR booking failed [prepareError]:", prepareError);
      if (prepareError?.response?.data) {
        console.error("Response data details:", prepareError.response.data);
      }
      setError(prepareError?.message || prepareError?.response?.data?.message || "Không thể tạo QR thanh toán.");
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
    <div className="modal-overlay" onClick={!qrResult ? handleClose : undefined}>
      <div
        className="seat-modal-content"
        style={{ position: "relative" }}
        onClick={(event) => event.stopPropagation()}
      >
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

        <div className="screen">MÀN HÌNH CHIẾU </div>

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
                    {Array.from({ length: maxColumns }, (_, i) => i + 1).map((colNumber) => {
                      const seat = groupedSeats[row].find((s) => s.number === colNumber);

                      if (!seat) {
                        // Check if it's the hidden right half of a Couple seat
                        const isCoupleRightHalf = (seatMapData?.seats || []).some(
                          (s) => s.row === row && s.number === colNumber && s.isHidden
                        );
                        if (isCoupleRightHalf) {
                          return null; // Let the left half (flex: 2) take space
                        }

                        // Completely missing (deleted permanently) -> render transparent gap
                        return (
                          <div
                            key={`empty-${row}-${colNumber}`}
                            className="seat-button"
                            style={{ visibility: "hidden", border: "none", background: "transparent" }}
                          />
                        );
                      }
                      //Hide seat
                      if (seat.status === "Deleted") {
                        // "Ẩn ghế" -> Shows an 'X'
                        return (
                          <button
                            key={seat._id}
                            className={`seat-button booked ${seat.type === "Couple" ? "couple" : ""}`}
                            disabled
                            style={{ background: "#f3f3f8ff", borderColor: "#e9e9edff", color: "#eae4e4ff", cursor: "not-allowed", opacity: 0 }}
                            title="Ghế này đang tạm ẩn"
                          >

                          </button>
                        );
                      }

                      return (
                        <button
                          key={seat._id}
                          className={getSeatClass(seat)}
                          onClick={() => toggleSeat(seat)}
                          disabled={
                            seatActionLoading ||
                            preparingBooking ||
                            !!qrResult ||
                            (!seat.isHeldByMe && seat.status !== "Available")
                          }
                          title={formatSeatLabel(seat, seatMapData?.seats)}
                        >
                          {formatSeatLabel(seat, seatMapData?.seats)}
                        </button>
                      );
                    })}
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
                ? selectedSeats.map((seat) => formatSeatLabel(seat, seatMapData?.seats)).join(", ")
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
                readOnly={!!qrResult}
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
                readOnly={!!qrResult}
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
                readOnly={!!qrResult}
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
                readOnly={!!qrResult}
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
            <button className="btn btn-back" onClick={handleClose} disabled={preparingBooking || !!qrResult}>
              Đóng
            </button>
            <button
              className="btn btn-primary"
              disabled={selectedSeats.length === 0 || preparingBooking || seatActionLoading || !!qrResult}
              onClick={handleBookingConfirmation}
            >
              {preparingBooking
                ? "Đang tạo QR..."
                : `Tạo QR thanh toán (${selectedSeats.length} ghế)`}
            </button>
          </div>
        </div>

        {qrResult && (
          <div className="payment-overlay">
            <div className="payment-qr-card">
              <h4>THANH TOÁN ĐẶT VÉ</h4>

              {qrResult.qrData ? (
                <div className="qr-image-wrapper">
                  {/* <img
                    src={generateQRCodeUrl(qrResult.qrData)}
                    alt="Payment QR Code"
                  /> */}
                </div>
              ) : (
                <div className="payment-no-qr">
                  <div className="no-qr-icon">💳</div>
                  <p>Nhấn nút bên dưới để mở trang thanh toán PayOS</p>
                </div>
              )}

              <div className="payment-details">
                <p>Mã đơn: <strong>{qrResult.booking?.bookingCode}</strong></p>
                <p>Số tiền: <strong className="amount">{(qrResult.payment?.amount ?? totalPrice).toLocaleString("vi-VN")}đ</strong></p>
              </div>
              <div className="payment-timer-box">
                <span>Hết hạn trong:</span>
                <span className="timer">{formatCountdown(paymentCountdownSeconds)}</span>
              </div>
              <div className="payment-actions">
                {qrResult.paymentUrl && (
                  <a href={qrResult.paymentUrl} target="_blank" rel="noreferrer" className="btn btn-primary">Mở trang PayOS</a>
                )}
                <button className="btn btn-secondary" onClick={handleCancelPayment}>Hủy &amp; Chọn lại</button>
              </div>
              <p className="payment-hint">Màn hình sẽ tự động cập nhật khi thanh toán thành công</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
