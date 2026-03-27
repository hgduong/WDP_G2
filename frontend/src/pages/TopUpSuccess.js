import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/styles/TopUpSuccess.css";

function TopUpSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const { amount, transactionId } = location.state || {};

  useEffect(() => {
    // Auto redirect to profile after 5 seconds
    const timer = setTimeout(() => {
      navigate("/profile");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleGoToProfile = () => {
    navigate("/profile");
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  return (
    <div className="topup-success-container">
      <div className="topup-success-content">
        <div className="success-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>

        <h1>Nạp tiền thành công!</h1>

        <div className="success-details">
          <div className="detail-row">
            <span className="label">Số tiền đã nạp</span>
            <span className="value amount">
              {amount ? formatCurrency(amount) : "—"}
            </span>
          </div>

          {transactionId && (
            <div className="detail-row">
              <span className="label">Mã giao dịch</span>
              <span className="value transaction-id">{transactionId}</span>
            </div>
          )}
        </div>

        <div className="success-message">
          <p>
            Cảm ơn bạn đã nạp tiền vào ví! Số dư ví của bạn đã được cập nhật.
          </p>
        </div>

        <div className="success-actions">
          <button className="primary-button" onClick={handleGoToProfile}>
            Xem số dư ví
          </button>
          <button className="secondary-button" onClick={handleGoToHome}>
            Quay về trang chủ
          </button>
        </div>

        <div className="auto-redirect-note">
          <p>Bạn sẽ được chuyển về trang cá nhân sau 5 giây...</p>
        </div>
      </div>
    </div>
  );
}

export default TopUpSuccess;
