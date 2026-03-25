import React from "react";

/**
 * User info section component
 * @param {object} props - Component props
 * @param {object} props.customerInfo - Customer information
 * @returns {JSX.Element} User info section component
 */
const UserInfoSection = ({ customerInfo }) => {
  return (
    <div className="user-info-section">
      <h3>👤 Thông tin người đặt vé</h3>
      <div className="user-info-grid">
        <div className="user-info-item">
          <span className="info-label">Họ tên:</span>
          <span className="info-value">{customerInfo?.fullName || "Khách hàng"}</span>
        </div>
        <div className="user-info-item">
          <span className="info-label">Email:</span>
          <span className="info-value">{customerInfo?.email || "N/A"}</span>
        </div>
        <div className="user-info-item">
          <span className="info-label">Số điện thoại:</span>
          <span className="info-value">{customerInfo?.phone || "N/A"}</span>
        </div>
      </div>
    </div>
  );
};

export default UserInfoSection;
