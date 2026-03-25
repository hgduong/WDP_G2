import React from "react";

/**
 * Error state component for order page
 * @param {object} props - Component props
 * @param {string} props.error - Error message to display
 * @param {function} props.onGoHome - Handler for going to home page
 * @returns {JSX.Element} Error component
 */
const OrderError = ({ error, onGoHome }) => {
  return (
    <div className="order-container">
      <div className="order-error">
        <h2>Lỗi</h2>
        <p>{error || "Không tìm thấy thông tin đơn hàng"}</p>
        <button className="btn btn-primary" onClick={onGoHome}>
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default OrderError;
