import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { deposit } from "../services/api";
import "../assets/styles/TopUpPayment.css";

function TopUpPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(900); // 15 minutes
  const depositInitiated = useRef(false);

  const amount = location.state?.amount;

  useEffect(() => {
    if (!amount) {
      navigate("/topup");
      return;
    }

    // Prevent duplicate calls in React StrictMode
    if (depositInitiated.current) return;
    depositInitiated.current = true;

    // Create deposit request
    const createDeposit = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await deposit({
          amount: amount,
          description: `Nạp tiền vào ví - ${formatCurrency(amount)}`,
          paymentMethod: "payos",
        });

        if (response.success) {
          setPaymentData(response.data);
          toast.success("Tạo yêu cầu nạp tiền thành công!");
        } else {
          setError(response.message || "Không thể tạo yêu cầu nạp tiền");
          toast.error(response.message || "Không thể tạo yêu cầu nạp tiền");
        }
      } catch (err) {
        console.error("Error creating deposit:", err);
        setError(err.message || "Đã xảy ra lỗi khi tạo yêu cầu nạp tiền");
        toast.error(err.message || "Đã xảy ra lỗi khi tạo yêu cầu nạp tiền");
      } finally {
        setLoading(false);
      }
    };

    createDeposit();
  }, [amount, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning("Hết thời gian thanh toán. Vui lòng thử lại.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBack = () => {
    navigate("/profile");
  };

  const handleCheckPayment = async () => {
    // In a real implementation, you would check the payment status
    // For now, we'll simulate a successful payment
    toast.success("Nạp tiền thành công! Số dư ví đã được cập nhật.");
    setTimeout(() => {
      navigate("/profile");
    }, 2000);
  };

  if (!amount) {
    return null;
  }

  if (loading) {
    return (
      <div className="topup-payment-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tạo yêu cầu thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="topup-payment-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Không thể tạo yêu cầu thanh toán</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={handleBack}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="topup-payment-container">
      <div className="topup-payment-header">
        <h1>Thanh toán nạp tiền</h1>
      </div>

      <div className="topup-payment-content">
        <div className="payment-info">
          <div className="payment-amount">
            <span className="label">Số tiền nạp</span>
            <span className="amount">{formatCurrency(amount)}</span>
          </div>

          <div className="payment-timer">
            <span className="label">Thời gian còn lại</span>
            <span className={`timer ${countdown <= 60 ? "warning" : ""}`}>
              {formatTime(countdown)}
            </span>
          </div>
        </div>

        <div className="qr-section">
          <h2>Quét mã QR để thanh toán</h2>

          {paymentData?.payment?.qrData ? (
            <div className="qr-code-container">
              <img
                src={paymentData.payment.qrData}
                alt="QR Code"
                className="qr-code"
              />
            </div>
          ) : paymentData?.payment?.paymentUrl ? (
            <div className="payment-link-container">
              <p>Hoặc nhấn vào link bên dưới để thanh toán:</p>
              <a
                href={paymentData.payment.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="payment-link"
              >
                Thanh toán ngay
              </a>
            </div>
          ) : (
            <div className="qr-placeholder">
              <p>Đang tải mã QR...</p>
            </div>
          )}

          <div className="payment-instructions">
            <h3>Hướng dẫn thanh toán</h3>
            <ol>
              <li>Mở ứng dụng ngân hàng trên điện thoại</li>
              <li>Quét mã QR bên trên</li>
              <li>Xác nhận thanh toán số tiền {formatCurrency(amount)}</li>
              <li>Chờ hệ thống xác nhận giao dịch</li>
            </ol>
          </div>
        </div>

        <div className="payment-actions">
          <button
            className="check-payment-button"
            onClick={handleCheckPayment}
          >
            Tôi đã thanh toán
          </button>
          <button className="cancel-button" onClick={handleBack}>
            Hủy giao dịch
          </button>
        </div>

        <div className="payment-note">
          <p>
            <strong>Lưu ý:</strong> Giao dịch sẽ được xử lý tự động sau khi
            thanh toán thành công. Số dư ví sẽ được cập nhật ngay lập tức.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TopUpPayment;
