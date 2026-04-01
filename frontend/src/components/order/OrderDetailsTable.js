import React from "react";
import {
  formatPrice,
  formatShowtime,
  getMovieInfo,
  getCinemaInfo,
  getRoomInfo,
  getShowtimeInfo,
} from "../../utils/orderUtils";

const seatLabel = (seat) => {
  if (!seat) {
    return "N/A";
  }

  if (typeof seat === "string") {
    return seat;
  }

  if (seat.label) {
    return seat.label;
  }

  if (seat.row) {
    return seat.type === "Couple"
      ? `${seat.row}${seat.number}-${seat.number + 1}`
      : `${seat.row}${seat.number}`;
  }

  return "N/A";
};

const OrderDetailsTable = ({ orderData }) => {
  const movie = getMovieInfo(orderData);
  const cinema = getCinemaInfo(orderData);
  const room = getRoomInfo(orderData);
  const showtime = getShowtimeInfo(orderData);

  return (
    <div className="order-details-table">
      <h2>Thông tin đơn hàng</h2>
      <table className="order-table">
        <tbody>
          <tr>
            <td className="table-label">Mã đặt vé</td>
            <td className="table-value">{orderData.bookingCode}</td>
          </tr>
          <tr>
            <td className="table-label">Tên phim</td>
            <td className="table-value">{movie?.title || "N/A"}</td>
          </tr>
          <tr>
            <td className="table-label">Thời lượng</td>
            <td className="table-value">{movie?.duration || "N/A"} phút</td>
          </tr>
          <tr>
            <td className="table-label">Ngày giờ chiếu</td>
            <td className="table-value">{formatShowtime(showtime?.startTime)}</td>
          </tr>
          <tr>
            <td className="table-label">Rạp chiếu</td>
            <td className="table-value">
              {cinema?.name || "N/A"}
              {cinema?.address ? ` - ${cinema.address}` : ""}
            </td>
          </tr>
          <tr>
            <td className="table-label">Phòng chiếu</td>
            <td className="table-value">{room?.name || room?.roomName || "N/A"}</td>
          </tr>
          <tr>
            <td className="table-label">Ghế ngồi</td>
            <td className="table-value">
              <div className="seats-list">
                {(orderData.seats || []).map((seat, index) => (
                  <span key={`${seat._id || seat}-${index}`} className="seat-tag">
                    {seatLabel(seat)}
                  </span>
                ))}
              </div>
            </td>
          </tr>
          <tr>
            <td className="table-label">Số lượng ghế</td>
            <td className="table-value">{orderData.seats?.length || 0} ghế</td>
          </tr>
          <tr>
            <td className="table-label">Giá vé</td>
            <td className="table-value">
              {formatPrice(showtime?.price || 75000)} x {orderData.seats?.length || 0}
            </td>
          </tr>
          <tr className="total-row">
            <td className="table-label">Tổng cộng</td>
            <td className="table-value total-price">{formatPrice(orderData.totalPrice)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default OrderDetailsTable;
