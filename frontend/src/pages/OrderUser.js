import React from "react";
import { useOrder } from "../hooks/useOrder";
import OrderLoading from "../components/order/OrderLoading";
import OrderError from "../components/order/OrderError";
import PaymentPending from "../components/order/PaymentPending";
import PaymentComplete from "../components/order/PaymentComplete";
import "../assets/styles/Order.css";

/**
 * Main Order page component
 * Displays order information and handles payment flow
 * @returns {JSX.Element} Order page component
 */
export default function Order() {
  const {
    orderData,
    loading,
    error,
    isPaymentComplete,
    movie,
    cinema,
    room,
    showtime,
    customerInfo,
    handleGoHome,
    handleGoBack,
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
      {!isPaymentComplete && (
        <PaymentPending
          orderData={orderData}
          movie={movie}
          cinema={cinema}
          room={room}
          showtime={showtime}
          onPaymentComplete={handlePaymentComplete}
          onGoBack={handleGoBack}
        />
      )}

      {isPaymentComplete && (
        <PaymentComplete
          orderData={orderData}
          movie={movie}
          cinema={cinema}
          room={room}
          showtime={showtime}
          customerInfo={customerInfo}
        />
      )}
    </div>
  );
}
