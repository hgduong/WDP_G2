import React from "react";
import { useOrder } from "../hooks/useOrder";
import OrderLoading from "../components/order/OrderLoading";
import OrderError from "../components/order/OrderError";
import OrderDetailsTable from "../components/order/OrderDetailsTable";
import UserInfoSection from "../components/order/UserInfoSection";
import { generateQRCodeUrl } from "../utils/orderUtils";
import "../assets/styles/Order.css";

const seatLabelForTicket = (seat) => {
  if (!seat?.row) {
    return "-";
  }

  return seat.type === "Couple"
    ? `${seat.row}${seat.number}-${seat.number + 1}`
    : `${seat.row}${seat.number}`;
};

export default function OrderUser() {
  const {
    orderData,
    loading,
    polling,
    error,
    customerInfo,
    handleGoHome,
    handleCancelBooking,
    actionError,
    countdownMs,
    countdownText,
  } = useOrder();

  if (loading) {
    return <OrderLoading />;
  }

  if (error || !orderData) {
    return <OrderError error={error} onGoHome={handleGoHome} />;
  }

  return (
    <div className="order-container">
      <div className="order-info-header">
        <h1>Thông tin đơn hàng</h1>
        <p className="order-code">
          Mã đặt vé: <strong>{orderData.bookingCode}</strong>
        </p>
        <p className="payment-status">
          Trạng thái: <strong>{orderData.paymentStatus}</strong>
        </p>
      </div>

      <OrderDetailsTable orderData={orderData} />
      <UserInfoSection customerInfo={customerInfo} />

      {actionError ? <div className="transaction-error">{actionError}</div> : null}

      {orderData.paymentStatus === "Pending" && orderData.paymentId ? (
        <div className="payment-section">
          <h2>Quét mã QR để thanh toán</h2>
          <div className="payment-qr-container">
            <div className="payment-qr">
              <img
                src={generateQRCodeUrl(orderData.paymentId.qrData)}
                alt="Payment QR"
                className="qr-code-payment"
              />
              <p className="payment-amount">Còn lại: {countdownText}</p>
              <p className="payment-note">
                Trạng thái được đồng bộ từ backend {polling ? "(đang kiểm tra)" : ""}
              </p>
              {orderData.paymentId.checkoutUrl ? (
                <a
                  className="btn btn-secondary"
                  href={orderData.paymentId.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở trang PayOS
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {orderData.paymentStatus === "Paid" ? (
        <div className="tickets-list">
          <h2>Danh sách vé</h2>
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Ghế</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(orderData.tickets || []).map((ticket) => (
                <tr key={ticket._id || ticket.ticketCode}>
                  <td>{ticket.ticketCode}</td>
                  <td>{seatLabelForTicket(ticket.seatId)}</td>
                  <td>{ticket.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="order-actions">
        {orderData.paymentStatus === "Pending" && countdownMs > 0 ? (
          <button className="btn btn-primary" onClick={handleCancelBooking}>
            Hủy booking
          </button>
        ) : null}
        <button className="btn btn-secondary" onClick={handleGoHome}>
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
