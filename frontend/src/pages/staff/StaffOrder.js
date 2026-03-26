import React, { useEffect, useState } from "react";
import { getStaffBookings, getAllBookings } from "../../services/api";
import "../../assets/styles/StaffOrder.css";

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

function StaffOrder() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({
    date: "",
    status: "",
    paymentStatus: "",
    type: "staff", // 'staff' or 'all'
  });

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (filter.date) params.date = filter.date;
      if (filter.status) params.status = filter.status;
      if (filter.paymentStatus) params.paymentStatus = filter.paymentStatus;

      let data;
      if (filter.type === "all") {
        data = await getAllBookings(params);
      } else {
        data = await getStaffBookings(params);
      }

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Không tải được danh sách đặt vé.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Pending: { text: "Chờ", class: "pending" },
      Confirmed: { text: "Xác nhận", class: "confirmed" },
      Done: { text: "Hoàn tất", class: "done" },
      Cancelled: { text: "Hủy", class: "cancelled" },
    };
    const s = statusMap[status] || { text: status, class: "default" };
    return <span className={`badge ${s.class}`}>{s.text}</span>;
  };

  const getPaymentBadge = (status) => {
    const statusMap = {
      Unpaid: { text: "Chưa thanh toán", class: "unpaid" },
      PayAtCounter: { text: "Thanh toán tại quầy", class: "counter" },
      Paid: { text: "Đã thanh toán", class: "paid" },
    };
    const s = statusMap[status] || { text: status, class: "default" };
    return <span className={`badge ${s.class}`}>{s.text}</span>;
  };

  return (
    <div className="staff-order-page">
      <section className="staff-order-hero">
        <div>
          <span className="staff-order-eyebrow">Quản lý đặt vé</span>
          <h1>Theo dõi đơn hàng</h1>
          <p>
            Xem danh sách vé đã bán trong ngày, kiểm tra trạng thái thanh toán và
            quản lý các đơn đặt vé.
          </p>
        </div>

        <div className="staff-order-filters">
          <label>
            Ngày
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
            />
          </label>

          <label>
            Loại
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="staff">Staff</option>
              <option value="all">Tất cả</option>
            </select>
          </label>

          <label>
            Trạng thái
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">Tất cả</option>
              <option value="Pending">Chờ</option>
              <option value="Confirmed">Xác nhận</option>
              <option value="Done">Hoàn tất</option>
              <option value="Cancelled">Hủy</option>
            </select>
          </label>

          <label>
            Thanh toán
            <select
              value={filter.paymentStatus}
              onChange={(e) => setFilter({ ...filter, paymentStatus: e.target.value })}
            >
              <option value="">Tất cả</option>
              <option value="Unpaid">Chưa thanh toán</option>
              <option value="PayAtCounter">Tại quầy</option>
              <option value="Paid">Đã thanh toán</option>
            </select>
          </label>
        </div>
      </section>

      {error ? <div className="staff-order-alert error">{error}</div> : null}

      <div className="staff-order-table-wrapper">
        {loading ? (
          <div className="staff-order-loading">Đang tải...</div>
        ) : bookings.length === 0 ? (
          <div className="staff-order-empty">Không có đơn đặt vé nào.</div>
        ) : (
          <table className="staff-order-table">
            <thead>
              <tr>
                <th>Mã đặt vé</th>
                <th>Phim</th>
                <th>Suất chiếu</th>
                <th>Rạp</th>
                <th>Ghế</th>
                <th>Tổng tiền</th>
                <th>Khách hàng</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const showtime = booking.showtimeId;
                const movie = showtime?.movieId;
                return (
                  <tr key={booking._id}>
                    <td>
                      <strong>{booking.bookingCode}</strong>
                      {booking.bookingSource === "Staff" && (
                        <span className="badge staff-badge">Staff</span>
                      )}
                    </td>
                    <td>{movie?.title || "Đang cập nhật"}</td>
                    <td>
                      {showtime?.startTime
                        ? formatDateTime(showtime.startTime)
                        : "-"}
                    </td>
                    <td>{booking.cinemaId?.name || "-"}</td>
                    <td>
                      {booking.seats?.length > 0
                        ? booking.seats.length
                        : 0}{" "}
                      ghế
                    </td>
                    <td>{formatMoney(booking.totalPrice)}</td>
                    <td>
                      <div>
                        {booking.customerInfo?.fullName || "Khách vãng lai"}
                      </div>
                      <div className="sub-text">
                        {booking.customerInfo?.phone || "-"}
                      </div>
                    </td>
                    <td>{getPaymentBadge(booking.paymentStatus)}</td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>
                      {booking.createdAt
                        ? formatDateTime(booking.createdAt)
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default StaffOrder;
