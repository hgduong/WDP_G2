import React from "react";
import { formatDate } from "../../utils/orderUtils";
import OrderDetailsTable from "./OrderDetailsTable";
import QRCodeDisplay from "./QRCodeDisplay";
import TicketContent from "./TicketContent";
import UserInfoSection from "./UserInfoSection";

/**
 * Payment complete section component
 * @param {object} props - Component props
 * @param {object} props.orderData - Order data
 * @param {object} props.movie - Movie information
 * @param {object} props.cinema - Cinema information
 * @param {object} props.room - Room information
 * @param {object} props.showtime - Showtime information
 * @param {object} props.customerInfo - Customer information
 * @returns {JSX.Element} Payment complete component
 */
const PaymentComplete = ({
  orderData,
  movie,
  cinema,
  room,
  showtime,
  customerInfo
}) => {
  return (
    <>
      <div className="order-success">
        <div className="success-icon">✓</div>
        <h1>Đặt vé thành công!</h1>
        <p className="order-code">Mã đặt vé: <strong>{orderData.bookingCode}</strong></p>
        <p className="purchase-date">Ngày mua: {formatDate(orderData.purchaseDate || orderData.createdAt)}</p>
        <p className="payment-status">Thanh toán: <strong>Đã thanh toán</strong></p>
      </div>

      <OrderDetailsTable
        orderData={orderData}
        movie={movie}
        cinema={cinema}
        room={room}
        showtime={showtime}
      />

      {/* QR Code and Ticket Content */}
      <div className="qr-ticket-section">
        <h2>Mã QR và Thông tin vé</h2>
        
        {/* Ticket Message */}
        <div className="ticket-message">
          <p className="message-title">📩 Lời nhắn:</p>
          <p className="message-content">
            Cảm ơn quý khách đã đặt vé tại rạp {cinema?.name}! 
            Quý khách vui lòng đến trước giờ chiếu 15 phút và mang theo mã QR này để nhận vé tại quầy.
          </p>
        </div>

        {/* QR Code Display */}
        <QRCodeDisplay
          orderData={orderData}
          movie={movie}
          cinema={cinema}
          room={room}
          showtime={showtime}
        />

        {/* Ticket Content Details */}
        <TicketContent
          orderData={orderData}
          movie={movie}
          cinema={cinema}
          room={room}
          showtime={showtime}
        />

        {/* User Info Section */}
        <UserInfoSection customerInfo={customerInfo} />

        {/* Email Sent Notification */}
        <div className="email-notification">
          <p>📧 Thông tin vé đã được gửi về email: <strong>{customerInfo?.email || "N/A"}</strong></p>
        </div>
      </div>
    </>
  );
};

export default PaymentComplete;
