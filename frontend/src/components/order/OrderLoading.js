import React from "react";

/**
 * Loading state component for order page
 * @returns {JSX.Element} Loading component
 */
const OrderLoading = () => {
  return (
    <div className="order-container">
      <div className="order-loading">
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    </div>
  );
};

export default OrderLoading;
