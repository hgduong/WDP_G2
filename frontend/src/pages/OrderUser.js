import React from "react";
import { useOrder } from "../hooks/useOrder";
import OrderLoading from "../components/order/OrderLoading";
import OrderError from "../components/order/OrderError";
import OrderDetailsTable from "../components/order/OrderDetailsTable";
import UserInfoSection from "../components/order/UserInfoSection";
import "../assets/styles/Order.css";

/**
 * Order information page for customers to check their order details
 * @returns {JSX.Element} Order information page component
 */
export default function OrderUser() {
  const {
    orderData,
    loading,
    error,
    movie,
    cinema,
    room,
    showtime,
    customerInfo,
    handleGoHome,
    handlePaymentComplete
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
        <p className="order-code">Mã đặt vé: <strong>{orderData.bookingCode}</strong></p>
        <p className="payment-status">
          Trạng thái: <strong>{orderData.paymentStatus === "Paid" ? "Đã thanh toán" : "Chưa thanh toán"}</strong>
        </p>
      </div>

      <OrderDetailsTable
        orderData={orderData}
        movie={movie}
        cinema={cinema}
        room={room}
        showtime={showtime}
      />

      <UserInfoSection customerInfo={customerInfo} />

      <div className="order-actions">
        {orderData.paymentStatus !== "Paid" && (
          <button className="btn btn-primary" onClick={handlePaymentComplete}>
            Thanh toán
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleGoHome}>
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
