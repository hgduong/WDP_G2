import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { deposit, cancelUserTransaction, checkPayOSPaymentStatus, generateQRCode } from "../services/api";
import "../assets/styles/TopUpPayment.css";

function TopUpPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(() => {
    // Try to load payment data from location state first, then sessionStorage
    if (location.state?.paymentData) {
      return location.state.paymentData;
    }
    const saved = sessionStorage.getItem('topupPaymentData');
    return saved ? JSON.parse(saved) : null;
  });
  const [qrCodeImage, setQRCodeImage] = useState(() => {
    // Try to load QR code image from sessionStorage
    return sessionStorage.getItem('topupQRImage') || null;
  });
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(() => {
    // Try to load countdown from sessionStorage
    const saved = sessionStorage.getItem('topupCountdown');
    return saved ? parseInt(saved, 10) : 900;
  });
  const [copied, setCopied] = useState(false);
  const depositInitiated = useRef(false);
  const hasNavigatedAway = useRef(false);

  const amount = location.state?.amount;

  useEffect(() => {
    if (!amount) {
      navigate("/topup");
      return;
    }

    // If payment data already exists (from TopUp.js or sessionStorage), don't create new deposit
    if (paymentData) {
      // Save to sessionStorage to persist across page refresh
      sessionStorage.setItem('topupPaymentData', JSON.stringify(paymentData));
      
      // Fetch QR code image if qrData is available
      if (paymentData?.payment?.qrData) {
        const fetchQRCode = async () => {
          try {
            const qrResponse = await generateQRCode(paymentData.payment.qrData);
            if (qrResponse.success) {
              setQRCodeImage(qrResponse.data);
              sessionStorage.setItem('topupQRImage', qrResponse.data);
            }
          } catch (qrErr) {
            console.error("Error fetching QR code:", qrErr);
          }
        };
        fetchQRCode();
      }
      return;
    }

    // Prevent duplicate calls in React StrictMode
    if (depositInitiated.current) return;
    depositInitiated.current = true;

    // Create deposit request (fallback if paymentData not provided)
    const createDeposit = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await deposit({
          amount: amount,
          description: `Nạp tiền vào ví - ${formatCurrency(amount)}`,
          paymentMethod: "banking",
        });

        if (response.success) {
          setPaymentData(response.data);
          // Save to sessionStorage to persist across page refresh
          sessionStorage.setItem('topupPaymentData', JSON.stringify(response.data));
          toast.success("Tạo yêu cầu nạp tiền thành công!");
          
          // Fetch QR code image if qrData is available
          if (response.data?.payment?.qrData) {
            try {
              const qrResponse = await generateQRCode(response.data.payment.qrData);
              if (qrResponse.success) {
                setQRCodeImage(qrResponse.data);
                sessionStorage.setItem('topupQRImage', qrResponse.data);
              }
            } catch (qrErr) {
              console.error("Error fetching QR code:", qrErr);
            }
          }
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
  }, [amount, navigate, paymentData]);

  // Cancel transaction when user navigates away
  const cancelTransactionOnExit = useCallback(async () => {
    if (paymentData?.transaction?._id && !hasNavigatedAway.current) {
      hasNavigatedAway.current = true;
      try {
        await cancelUserTransaction(paymentData.transaction._id);
      } catch (err) {
        console.error("Error canceling transaction on exit:", err);
      }
    }
  }, [paymentData]);

  // Cleanup effect to detect when user leaves the page
  useEffect(() => {
    // Detect when user tries to navigate away (beforeunload event)
    const handleBeforeUnload = (e) => {
      if (paymentData?.transaction?._id) {
        // Cancel the transaction in the background
        cancelTransactionOnExit();
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // NOTE: Do NOT cancel transaction here - this cleanup runs on every re-render
      // Transaction should only be cancelled when user explicitly navigates away
      // or closes the tab (handled by beforeunload event above)
    };
  }, [paymentData, cancelTransactionOnExit]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning("Hết thời gian thanh toán. Vui lòng thử lại.");
          // Clear sessionStorage when countdown expires
          sessionStorage.removeItem('topupPaymentData');
          sessionStorage.removeItem('topupCountdown');
          sessionStorage.removeItem('topupQRImage');
          // Cancel transaction when countdown expires
          if (paymentData?.transaction?._id && !hasNavigatedAway.current) {
            hasNavigatedAway.current = true;
            cancelUserTransaction(paymentData.transaction._id)
              .catch((err) => {
                console.error("Error canceling transaction on timeout:", err);
              })
              .finally(() => {
                // Navigate to failure page after canceling
                navigate("/topup-failure", {
                  state: {
                    reason: "timeout",
                    amount: amount
                  }
                });
              });
          } else if (!hasNavigatedAway.current) {
            // If no transaction ID, just navigate to failure page
            hasNavigatedAway.current = true;
            navigate("/topup-failure", {
              state: {
                reason: "timeout",
                amount: amount
              }
            });
          }
          return 0;
        }
        // Save countdown to sessionStorage
        sessionStorage.setItem('topupCountdown', prev - 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, navigate, amount, paymentData]);

  // Auto-check payment status after QR code is displayed
  useEffect(() => {
    if (!paymentData?.transaction?._id || !qrCodeImage) return;

    // Check immediately after QR is displayed
    checkPaymentStatus();

    // Then check every 5 seconds
    const statusCheckInterval = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(statusCheckInterval);
  }, [paymentData, qrCodeImage]);

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

  const handleCopyTransactionId = async () => {
    if (!paymentData?.transactionId) return;
    try {
      await navigator.clipboard.writeText(paymentData.transactionId);
      setCopied(true);
      toast.success("Đã sao chép mã giao dịch!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Không thể sao chép mã giao dịch");
    }
  };

  const handleBack = async () => {
    // If there's an active transaction, cancel it first
    if (paymentData?.transaction?._id && !hasNavigatedAway.current) {
      try {
        hasNavigatedAway.current = true;
        await cancelUserTransaction(paymentData.transaction._id);
      } catch (err) {
        console.error("Error canceling transaction:", err);
      }
    }
    // Clear sessionStorage when user cancels
    sessionStorage.removeItem('topupPaymentData');
    sessionStorage.removeItem('topupCountdown');
    sessionStorage.removeItem('topupQRImage');
    // Navigate to failure page
    navigate("/topup-failure", {
      state: {
        reason: "cancelled",
        amount: amount
      }
    });
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.transaction?._id) {
      return;
    }

    try {
      // Sử dụng endpoint mới để kiểm tra trạng thái thanh toán từ PayOS API
      const response = await checkPayOSPaymentStatus(paymentData.transaction._id);
      
      if (response.success) {
        const transaction = response.data;
        
        if (transaction.status === "completed") {
          // Clear sessionStorage after successful payment
          sessionStorage.removeItem('topupPaymentData');
          sessionStorage.removeItem('topupCountdown');
          sessionStorage.removeItem('topupQRImage');
          // Navigate to success page
          navigate("/topup-success", {
            state: {
              amount: amount,
              transactionId: paymentData.transactionId
            }
          });
        } else if (transaction.status === "cancelled") {
          toast.warning("Giao dịch đã bị hủy.");
          sessionStorage.removeItem('topupPaymentData');
          sessionStorage.removeItem('topupCountdown');
          sessionStorage.removeItem('topupQRImage');
          navigate("/topup-failure", {
            state: {
              reason: "cancelled",
              amount: amount
            }
          });
        } else if (transaction.status === "failed") {
          toast.error("Giao dịch thất bại.");
          sessionStorage.removeItem('topupPaymentData');
          sessionStorage.removeItem('topupCountdown');
          sessionStorage.removeItem('topupQRImage');
          navigate("/topup-failure", {
            state: {
              reason: "failed",
              amount: amount
            }
          });
        }
        // If status is "pending", do nothing and continue polling
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
    }
  };

  const handleCancelPayment = async () => {
    if (!paymentData?.transaction?._id) {
      toast.error("Không tìm thấy thông tin giao dịch");
      return;
    }

    try {
      setLoading(true);
      const response = await cancelUserTransaction(paymentData.transaction._id);
      
      if (response.success) {
        toast.success("Hủy giao dịch thành công!");
        // Clear sessionStorage
        sessionStorage.removeItem('topupPaymentData');
        sessionStorage.removeItem('topupCountdown');
        sessionStorage.removeItem('topupQRImage');
        // Navigate to failure page
        navigate("/topup-failure", {
          state: {
            reason: "cancelled",
            amount: amount
          }
        });
      } else {
        toast.error(response.message || "Không thể hủy giao dịch");
      }
    } catch (err) {
      console.error("Error canceling transaction:", err);
      toast.error(err.message || "Không thể hủy giao dịch");
    } finally {
      setLoading(false);
    }
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

          {paymentData?.transactionId && (
            <div className="payment-transaction-id">
              <span className="label">Mã giao dịch</span>
              <div className="transaction-id-container">
                <span className="transaction-id">{paymentData.transactionId}</span>
                <button
                  className={`copy-button ${copied ? "copied" : ""}`}
                  onClick={handleCopyTransactionId}
                  title="Sao chép mã giao dịch"
                >
                  {copied ? "✓" : "📋"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="qr-section">
          <h2>Quét mã QR để thanh toán</h2>

          {qrCodeImage ? (
            <div className="qr-code-container">
              <img
                src={qrCodeImage}
                alt="QR Code"
                className="qr-code"
              />
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
          <button className="cancel-button" onClick={handleCancelPayment}>
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
