import React, { useState } from "react";
import { verifyTicket, overrideSeatStatus, unlockInternalSeats } from "../../services/api";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import "../../assets/styles/TicketCheck.css";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function TicketCheck() {
  const { user } = useContext(UserContext);
  const [searchCode, setSearchCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isSupervisor = ["Supervisor", "Manager", "Admin", "Staff"].includes(user?.role);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setResult(null);

      const trimmedCode = searchCode.trim().toUpperCase();
      const payload = { action: "verify" };
      
      if (trimmedCode.startsWith("BK") || trimmedCode.startsWith("STF")) {
        payload.bookingCode = trimmedCode;
      } else {
        payload.ticketCode = trimmedCode;
      }

      const res = await verifyTicket(payload);
      setResult(res);
    } catch (err) {
      setError(err?.message || "Không tìm thấy thông tin vé");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!result) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const payload = { action: "checkin" };
      if (result.booking?.bookingCode) {
        payload.bookingCode = result.booking.bookingCode;
      } else if (result.tickets?.[0]?.ticketCode) {
        payload.ticketCode = result.tickets[0].ticketCode;
      }

      const res = await verifyTicket(payload);
      setResult(res);
      setSuccess("Check-in thành công!");
    } catch (err) {
      setError(err?.message || "Check-in thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockInternal = async () => {
    if (!result?.booking?.showtime?._id) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const res = await unlockInternalSeats(result.booking.showtime._id);
      setSuccess(res.message);
    } catch (err) {
      setError(err?.message || "Không thể mở khóa ghế nội bộ");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Valid: { text: "Hợp lệ", class: "valid" },
      Used: { text: "Đã sử dụng", class: "used" },
      Cancelled: { text: "Đã hủy", class: "cancelled" },
    };
    const s = statusMap[status] || { text: status, class: "default" };
    return <span className={`ticket-badge ${s.class}`}>{s.text}</span>;
  };

  return (
    <div className="ticket-check-page">
      <section className="ticket-check-hero">
        <div>
          <span className="ticket-check-eyebrow">Kiểm tra vé</span>
          <h1>Xác nhận và Check-in</h1>
          <p>
            Nhập mã đặt vé hoặc mã vé để xác nhận thông tin và check-in cho khách hàng.
          </p>
        </div>
      </section>

      <section className="ticket-check-search">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Nhập mã đặt vé (BK...) hoặc mã vé (TK...)"
            className="search-input"
          />
          <button type="submit" disabled={loading || !searchCode.trim()}>
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>
      </section>

      {error ? <div className="ticket-check-alert error">{error}</div> : null}
      {success ? <div className="ticket-check-alert success">{success}</div> : null}

      {result && (
        <section className="ticket-check-result">
          <div className="result-header">
            <h2>Thông tin đặt vé</h2>
            {result.booking?.paymentStatus === "Paid" ? (
              <span className="ticket-badge paid">Đã thanh toán</span>
            ) : result.booking?.paymentStatus === "PayAtCounter" ? (
              <span className="ticket-badge pending">Thanh toán tại quầy</span>
            ) : (
              <span className="ticket-badge unpaid">Chưa thanh toán</span>
            )}
          </div>

          <div className="result-details">
            <div className="detail-row">
              <span className="label">Mã đặt vé</span>
              <span className="value">{result.booking?.bookingCode}</span>
            </div>
            <div className="detail-row">
              <span className="label">Phim</span>
              <span className="value">
                {result.booking?.showtime?.movieId?.title || "Đang cập nhật"}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Suất chiếu</span>
              <span className="value">
                {result.booking?.showtime?.startTime
                  ? formatDateTime(result.booking.showtime.startTime)
                  : "-"}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Rạp</span>
              <span className="value">
                {result.booking?.cinema?.name || "-"}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Phòng</span>
              <span className="value">
                {result.booking?.room?.name || "-"}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Khách hàng</span>
              <span className="value">
                {result.booking?.customerInfo?.fullName || "Khách vãng lai"}
                {result.booking?.customerInfo?.phone && (
                  <span className="sub-value">
                    {" "}
                    - {result.booking.customerInfo.phone}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="tickets-list">
            <h3>Danh sách vé ({result.tickets?.length || 0})</h3>
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>Mã vé</th>
                  <th>Ghế</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {result.tickets?.map((ticket, index) => (
                  <tr key={index}>
                    <td>{ticket.ticketCode}</td>
                    <td>{ticket.seatLabel || "Ghế"}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="result-actions">
            {result.tickets?.some((t) => t.status === "Valid") ? (
              <button
                className="btn-checkin"
                onClick={handleCheckIn}
                disabled={actionLoading}
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận Check-in"}
              </button>
            ) : null}

            {isSupervisor && (
              <button
                className="btn-unlock"
                onClick={handleUnlockInternal}
                disabled={actionLoading || !result.booking?.showtime?._id}
              >
                Mở khóa ghế nội bộ
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default TicketCheck;
