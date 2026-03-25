import React from "react";
import { formatPrice, formatShowtime } from "../../utils/orderUtils";

/**
 * Order details table component
 * @param {object} props - Component props
 * @param {object} props.orderData - Order data
 * @param {object} props.movie - Movie information
 * @param {object} props.cinema - Cinema information
 * @param {object} props.room - Room information
 * @param {object} props.showtime - Showtime information
 * @returns {JSX.Element} Order details table component
 */
const OrderDetailsTable = ({ orderData, movie, cinema, room, showtime }) => {
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
            <td className="table-label">Đạo diễn</td>
            <td className="table-value">{movie?.director || "N/A"}</td>
          </tr>
          <tr>
            <td className="table-label">Ngày giờ chiếu</td>
            <td className="table-value">{formatShowtime(showtime?.startTime)}</td>
          </tr>
          <tr>
            <td className="table-label">Rạp</td>
            <td className="table-value">{cinema?.name || "N/A"}</td>
          </tr>
          <tr>
            <td className="table-label">Địa chỉ rạp</td>
            <td className="table-value">{cinema?.address || "N/A"}, {cinema?.city || ""}</td>
          </tr>
          <tr>
            <td className="table-label">Phòng</td>
            <td className="table-value">{room?.name || "N/A"}</td>
          </tr>
          <tr>
            <td className="table-label">Ghế ngồi</td>
            <td className="table-value">
              <div className="seats-list">
                {orderData.seats?.map((seat, index) => (
                  <span key={index} className="seat-tag">
                    {seat.label || seat}
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
            <td className="table-value">{formatPrice(showtime?.price || 75000)} x {orderData.seats?.length || 0}</td>
          </tr>
          <tr className="total-row">
            <td className="table-label">Tổng cộng</td>
            <td className="table-value">{formatPrice(orderData.totalPrice)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default OrderDetailsTable;
