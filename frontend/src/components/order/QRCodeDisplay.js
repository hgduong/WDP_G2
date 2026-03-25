import React from "react";
import { generateQRCodeUrl } from "../../utils/orderUtils";

/**
 * QR code display component
 * @param {object} props - Component props
 * @param {object} props.orderData - Order data
 * @param {object} props.movie - Movie information
 * @param {object} props.cinema - Cinema information
 * @param {object} props.room - Room information
 * @param {object} props.showtime - Showtime information
 * @returns {JSX.Element} QR code display component
 */
const QRCodeDisplay = ({ orderData, movie, cinema, room, showtime }) => {
  return (
    <div className="qr-display">
      <div className="qr-main">
        <img
          src={generateQRCodeUrl({
            bookingCode: orderData.bookingCode,
            movie: movie?.title,
            showtime: showtime?.startTime,
            cinema: cinema?.name,
            room: room?.name,
            seats: orderData.seats?.map(s => s.label || s),
            totalPrice: orderData.totalPrice
          })}
          alt="QR Code"
          className="qr-code-main"
        />
        <p className="qr-label">Mã QR đặt vé</p>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
