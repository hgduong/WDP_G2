import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/styles/TopUpFailure.css";

function TopUpFailure() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);
  const [reason, setReason] = useState("");

  const { reason: failureReason, amount } = location.state || {};

  useEffect(() => {
    // Set failure reason based on what was passed
    if (failureReason === "timeout") {
      setReason("Hết thời gian thanh toán");
    } else if (failureReason === "cancelled") {
      setReason("Giao dịch đã bị hủy");
    } else if (failureReason === "exited") {
      setReason("Bạn đã rời khỏi trang thanh toán");
    } else {
      setReason("Thanh toán không thành công");
    }

    // Auto redirect to topup after countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/topup");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, failureReason]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleTryAgain = () => {
    navigate("/topup");
  };

  const handleGoToProfile = () => {
    navigate("/profile");
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  const getFailureIcon = () => {
    if (failureReason === "timeout") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      );
    } else if (failureReason === "cancelled" || failureReason === "exited") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      );
    }
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    );
  };

  return (
    <div className="topup-failure-container">
      <div className="topup-failure-content">
        <div className="failure-icon">{getFailureIcon()}</div>

        <h1>Thanh toán thất bại</h1>

        <div className="failure-reason">
          <p>{reason}</p>
        </div>

        {amount && (
          <div className="failure-details">
            <div className="detail-row">
              <span className="label">Số tiền thanh toán</span>
              <span className="value">{formatCurrency(amount)}</span>
            </div>
          </div>
        )}

        <div className="failure-message">
          <p>
            {failureReason === "timeout"
              ? "Đã hết thời gian chờ thanh toán. Vui lòng thử lại."
              : failureReason === "cancelled"
              ? "Giao dịch đã bị hủy. Tiền sẽ không được trừ."
              : failureReason === "exited"
              ? "Bạn đã rời khỏi trang thanh toán. Giao dịch đã bị hủy."
              : "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại."}
          </p>
        </div>

        <div className="failure-actions">
          <button className="primary-button" onClick={handleTryAgain}>
            Thử lại
          </button>
          <button className="secondary-button" onClick={handleGoToProfile}>
            Về trang cá nhân
          </button>
          <button className="tertiary-button" onClick={handleGoToHome}>
            Quay về trang chủ
          </button>
        </div>

        <div className="auto-redirect-note">
          <p>
            Tự động chuyển về trang nạp tiền sau{" "}
            <span className="countdown">{countdown}</span> giây...
          </p>
        </div>
      </div>
    </div>
  );
}

export default TopUpFailure;
