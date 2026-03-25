import React from "react";
import { formatPrice, formatShowtime } from "../../utils/orderUtils";

/**
 * Ticket content details component
 * @param {object} props - Component props
 * @param {object} props.orderData - Order data
 * @param {object} props.movie - Movie information
 * @param {object} props.cinema - Cinema information
 * @param {object} props.room - Room information
 * @param {object} props.showtime - Showtime information
 * @returns {JSX.Element} Ticket content component
 */
const TicketContent = ({ orderData, movie, cinema, room, showtime }) => {
  return (
    <div className="ticket-content">
      <h3>🎫 Nội dung vé</h3>
      <div className="ticket-info-grid">
        <div className="ticket-info-item">
          <span className="info-label">Phim:</span>
          <span className="info-value">{movie?.title || "N/A"}</span>
        </div>
        <div className="ticket-info-item">
          <span className="info-label">Suất chiếu:</span>
          <span className="info-value">{formatShowtime(showtime?.startTime)}</span>
        </div>
        <div className="ticket-info-item">
          <span className="info-label">Rạp:</span>
          <span className="info-value">{cinema?.name || "N/A"}</span>
        </div>
        <div className="ticket-info-item">
          <span className="info-label">Địa chỉ rạp:</span>
          <span className="info-value">{cinema?.address || "N/A"}, {cinema?.city || ""}</span>
        </div>
        <div className="ticket-info-item">
          <span className="info-label">Phòng:</span>
          <span className="info-value">{room?.name || "N/A"}</span>
        </div>
        <div className="ticket-info-item">
          <span className="info-label">Ghế:</span>
          <span className="info-value">
            {orderData.seats?.map(s => s.label || s).join(", ")}
          </span>
        </div>
        <div className="ticket-info-item">
          <span className="info-label">Mã đặt vé:</span>
          <span className="info-value">{orderData.bookingCode}</span>
        </div>
        <div className="ticket-info-item">
          <span className="info-label">Tổng tiền:</span>
          <span className="info-value">{formatPrice(orderData.totalPrice)}</span>
        </div>
      </div>
    </div>
  );
};

export default TicketContent;
