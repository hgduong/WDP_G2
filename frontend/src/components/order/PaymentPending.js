import React from "react";
import { formatDate, formatPrice, generateQRCodeUrl } from "../../utils/orderUtils";
import OrderDetailsTable from "./OrderDetailsTable";

/**
 * Payment pending section component
 * @param {object} props - Component props
 * @param {object} props.orderData - Order data
 * @param {object} props.movie - Movie information
 * @param {object} props.cinema - Cinema information
 * @param {object} props.room - Room information
 * @param {object} props.showtime - Showtime information
 * @param {function} props.onPaymentComplete - Handler for payment completion
 * @param {function} props.onGoBack - Handler for going back
 * @returns {JSX.Element} Payment pending component
 */
const PaymentPending = ({
  orderData,
  movie,
  cinema,
  room,
  showtime,
  onPaymentComplete,
  onGoBack
}) => {
  return (
    <>
      <div className="payment-pending">
        <div className="pending-icon">⏳</div>
        <h1>Chờ thanh toán</h1>
        <p className="order-code">Mã đặt vé: <strong>{orderData.bookingCode}</strong></p>
        <p className="purchase-date">Ngày mua: {formatDate(orderData.purchaseDate || orderData.createdAt)}</p>
      </div>

      <OrderDetailsTable
        orderData={orderData}
        movie={movie}
        cinema={cinema}
        room={room}
        showtime={showtime}
      />

      <div className="payment-section">
        <h2>Quét mã QR để thanh toán</h2>
        <div className="payment-qr-container">
          <div className="payment-qr">
            <img
              src={generateQRCodeUrl({
                type: "payment",
                bookingCode: orderData.bookingCode,
                amount: orderData.totalPrice,
                cinema: cinema?.name,
                movie: movie?.title
              })}
              alt="Payment QR Code"
              className="qr-code-payment"
            />
            <p className="payment-amount">Số tiền: {formatPrice(orderData.totalPrice)}</p>
            <p className="payment-note">Quét mã QR bằng ứng dụng ngân hàng để thanh toán</p>
          </div>
        </div>
        <div className="payment-actions">
          <button className="btn btn-primary" onClick={onPaymentComplete}>
            Đã thanh toán
          </button>
          <button className="btn btn-secondary" onClick={onGoBack}>
            Hủy
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentPending;
