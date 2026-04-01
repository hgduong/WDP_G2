import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserBookings } from "../../services/bookingsApi";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0));

const formatDate = (dateString) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));

const paymentStatusText = {
  Pending: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  Cancelled: "Đã hủy",
  Expired: "Hết hạn",
  PayAtCounter: "Thanh toán tại quầy",
};

export default function TransactionHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const data = await getUserBookings();
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Không thể tải lịch sử đặt vé.");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  const bookingSummary = useMemo(
    () => ({
      totalBookings: bookings.length,
      paidBookings: bookings.filter((booking) => booking.paymentStatus === "Paid").length,
      pendingBookings: bookings.filter((booking) => booking.paymentStatus === "Pending").length,
    }),
    [bookings],
  );

  const openBooking = (bookingId) => {
    navigate(`/order?bookingId=${bookingId}`);
  };

  if (loading) {
    return (
      <section className="profile-section">
        <h3>Lịch sử đặt vé</h3>
        <div className="transaction-loading">Đang tải...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="profile-section">
        <h3>Lịch sử đặt vé</h3>
        <div className="transaction-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="profile-section">
      <h3>Lịch sử đặt vé</h3>

      <div className="wallet-balance-container">
        <div className="wallet-card">
          <div className="wallet-label">Tổng số đơn</div>
          <div className="wallet-balance">{bookingSummary.totalBookings}</div>
        </div>

        <div className="wallet-stats">
          <div className="wallet-stat">
            <span className="stat-label">Đã thanh toán</span>
            <span className="stat-value positive">{bookingSummary.paidBookings}</span>
          </div>
          <div className="wallet-stat">
            <span className="stat-label">Đang chờ</span>
            <span className="stat-value negative">{bookingSummary.pendingBookings}</span>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="transaction-empty">Chưa có đơn đặt vé nào.</div>
      ) : (
        <div className="transaction-list">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="transaction-item clickable"
              onClick={() => openBooking(booking._id)}
            >
              <div className="transaction-icon">BK</div>
              <div className="transaction-details">
                <span className="transaction-type">{booking.bookingCode}</span>
                <span className="transaction-description">
                  {booking.showtimeId?.movieId?.title || "Phim"}
                </span>
                <span className="transaction-date">
                  {booking.showtimeId?.startTime ? formatDate(booking.showtimeId.startTime) : "-"}
                </span>
              </div>
              <div className="transaction-amount-container">
                <span className="transaction-amount payment">
                  {formatCurrency(booking.totalPrice)}
                </span>
                <span className={`transaction-status ${booking.paymentStatus?.toLowerCase() || ""}`}>
                  {paymentStatusText[booking.paymentStatus] || booking.paymentStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
