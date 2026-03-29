import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTransactionById, generateQRCode, checkPayOSPaymentStatus, cancelUserTransaction } from "../services/api";
import { toast } from "react-toastify";
import "../assets/styles/TransactionDetail.css";

function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeImage, setQRCodeImage] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const statusCheckInterval = useRef(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await getTransactionById(id);
        if (response.success) {
          setTransaction(response.data);
          
          // Fetch QR code if transaction is pending and has PayOS metadata
          if (response.data.status === "pending" && 
              response.data.paymentMethod === "payos" &&
              response.data.metadata?.payosOrderCode) {
            fetchQRCode(response.data);
          }
        } else {
          setError(response.message || "Không tìm thấy giao dịch");
        }
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError(err.message || "Đã xảy ra lỗi khi tải thông tin giao dịch");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }

    // Cleanup interval on unmount
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [id]);

  // Fetch QR code image
  const fetchQRCode = async (transactionData) => {
    try {
      // Sử dụng qrData từ metadata thay vì tạo object mới
      const qrResponse = await generateQRCode(transactionData.metadata.qrData);
      
      if (qrResponse.success) {
        setQRCodeImage(qrResponse.data);
      }
    } catch (qrErr) {
      console.error("Error fetching QR code:", qrErr);
    }
  };

  // Start polling for payment status when QR code is displayed
  useEffect(() => {
    if (transaction?.status === "pending" && 
        transaction.paymentMethod === "payos" && 
        qrCodeImage) {
      // Check immediately
      checkPaymentStatus();
      
      // Then check every 5 seconds
      statusCheckInterval.current = setInterval(() => {
        checkPaymentStatus();
      }, 5000);
    }

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [transaction, qrCodeImage]);

  const checkPaymentStatus = async () => {
    if (!transaction?._id) return;

    try {
      const response = await checkPayOSPaymentStatus(transaction._id);
      
      if (response.success) {
        const updatedTransaction = response.data;
        
        if (updatedTransaction.status === "completed") {
          // Clear interval
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
          }
          
          toast.success("Thanh toán thành công!");
          navigate("/topup-success", {
            state: {
              amount: transaction.amount,
              transactionId: transaction._id
            }
          });
        } else if (updatedTransaction.status === "cancelled") {
          // Clear interval
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
          }
          
          toast.warning("Giao dịch đã bị hủy.");
          navigate("/topup-failure", {
            state: {
              reason: "cancelled",
              amount: transaction.amount
            }
          });
        } else if (updatedTransaction.status === "failed") {
          // Clear interval
          if (statusCheckInterval.current) {
            clearInterval(statusCheckInterval.current);
          }
          
          toast.error("Giao dịch thất bại.");
          navigate("/topup-failure", {
            state: {
              reason: "failed",
              amount: transaction.amount
            }
          });
        }
        // If status is still "pending", continue polling
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
    }
  };

  const handleCancelTransaction = async () => {
    if (!transaction?._id) {
      toast.error("Không tìm thấy thông tin giao dịch");
      return;
    }

    try {
      setCancelling(true);
      const response = await cancelUserTransaction(transaction._id);
      
      if (response.success) {
        toast.success("Hủy giao dịch thành công!");
        
        // Clear polling interval
        if (statusCheckInterval.current) {
          clearInterval(statusCheckInterval.current);
        }
        
        // Navigate to failure page
        navigate("/topup-failure", {
          state: {
            reason: "cancelled",
            amount: transaction.amount
          }
        });
      } else {
        toast.error(response.message || "Không thể hủy giao dịch");
      }
    } catch (err) {
      console.error("Error canceling transaction:", err);
      toast.error(err.message || "Không thể hủy giao dịch");
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getTransactionTypeLabel = (type) => {
    const typeMap = {
      deposit: "Nạp tiền",
      withdraw: "Rút tiền",
      payment: "Thanh toán",
      refund: "Hoàn tiền",
      transfer: "Chuyển tiền",
    };
    return typeMap[type] || type;
  };

  const getTransactionIcon = (type) => {
    const iconMap = {
      deposit: "↑",
      withdraw: "↓",
      payment: "💳",
      refund: "↩️",
      transfer: "⇄",
    };
    return iconMap[type] || "•";
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      completed: "Hoàn thành",
      pending: "Đang xử lý",
      failed: "Thất bại",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      completed: "#4caf50",
      pending: "#ff9800",
      failed: "#f44336",
      cancelled: "#9e9e9e",
    };
    return colorMap[status] || "#757575";
  };

  const handleCopyTransactionId = async () => {
    try {
      await navigator.clipboard.writeText(transaction._id);
      setCopied(true);
      toast.success("Đã sao chép mã giao dịch!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Không thể sao chép mã giao dịch");
    }
  };

  if (loading) {
    return (
      <div className="transaction-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải thông tin giao dịch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-detail-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Không thể tải thông tin giao dịch</h2>
          <p>{error}</p>
          <button className="back-button" onClick={() => navigate("/profile")}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="transaction-detail-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Không tìm thấy giao dịch</h2>
          <button className="back-button" onClick={() => navigate("/profile")}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-detail-container">
      <div className="transaction-detail-header">
        <button className="back-button" onClick={() => navigate("/profile")}>
          ← Quay lại
        </button>
        <h1>Chi tiết giao dịch</h1>
      </div>

      <div className="transaction-detail-content">
        {/* Transaction Icon and Type */}
        <div className="transaction-detail-icon-section">
          <div className={`transaction-detail-icon ${transaction.type}`}>
            {getTransactionIcon(transaction.type)}
          </div>
          <h2 className="transaction-detail-type">
            {getTransactionTypeLabel(transaction.type)}
          </h2>
          <span
            className="transaction-detail-status"
            style={{ backgroundColor: getStatusColor(transaction.status) }}
          >
            {getStatusLabel(transaction.status)}
          </span>
        </div>

        {/* Transaction Amount */}
        <div className="transaction-detail-amount-section">
          <span className="amount-label">Số tiền</span>
          <span className={`transaction-detail-amount ${transaction.type}`}>
            {transaction.type === "deposit" || transaction.type === "refund"
              ? "+"
              : "-"}
            {formatCurrency(transaction.amount)}
          </span>
        </div>

        {/* QR Code Section for Pending PayOS Transactions */}
        {transaction.paymentMethod === "payos" && transaction.status === "pending" && (
          <div className="transaction-qr-section">
            <h3>Mã QR thanh toán</h3>
            {qrCodeImage ? (
              <div className="qr-code-container">
                <img
                  src={qrCodeImage}
                  alt="QR Code"
                  className="qr-code-image"
                />
              </div>
            ) : (
              <div className="qr-placeholder">
                <p>Đang tải mã QR...</p>
              </div>
            )}
            <p className="qr-instruction">
              Quét mã QR bằng ứng dụng ngân hàng để thanh toán
            </p>
            <p className="qr-note">
              Hệ thống sẽ tự động kiểm tra trạng thái thanh toán mỗi 5 giây
            </p>
          </div>
        )}

        {/* Transaction Details */}
        <div className="transaction-detail-info">
          <div className="info-row">
            <span className="info-label">Mã giao dịch</span>
            <div className="info-value-with-copy">
              <span className="info-value">{transaction._id}</span>
              <button
                className={`copy-button ${copied ? "copied" : ""}`}
                onClick={handleCopyTransactionId}
                title="Sao chép mã giao dịch"
              >
                {copied ? "✓" : "📋"}
              </button>
            </div>
          </div>
          <div className="info-row">
            <span className="info-label">Mô tả</span>
            <span className="info-value">
              {transaction.description || "-"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Thời gian</span>
            <span className="info-value">
              {formatDate(transaction.createdAt)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Phương thức thanh toán</span>
            <span className="info-value">
              {transaction.paymentMethod === "payos"
                ? "PayOS (QR)"
                : transaction.paymentMethod === "banking"
                  ? "Chuyển khoản"
                  : transaction.paymentMethod === "wallet"
                    ? "Ví"
                    : transaction.paymentMethod || "-"}
            </span>
          </div>
          {transaction.referenceType && (
            <div className="info-row">
              <span className="info-label">Loại tham chiếu</span>
              <span className="info-value">
                {transaction.referenceType === "topup"
                  ? "Nạp tiền"
                  : transaction.referenceType === "booking"
                    ? "Đặt vé"
                    : transaction.referenceType === "withdraw"
                      ? "Rút tiền"
                      : transaction.referenceType === "refund"
                        ? "Hoàn tiền"
                        : transaction.referenceType}
              </span>
            </div>
          )}
          {transaction.referenceId && (
            <div className="info-row">
              <span className="info-label">Mã tham chiếu</span>
              <span className="info-value">{transaction.referenceId}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Số dư sau giao dịch</span>
            <span className="info-value">
              {formatCurrency(transaction.balanceAfter)}
            </span>
          </div>
        </div>

        {/* Cancel Button for Pending Transactions */}
        {transaction.status === "pending" && (
          <div className="transaction-actions">
            <button 
              className="cancel-transaction-button" 
              onClick={handleCancelTransaction}
              disabled={cancelling}
            >
              {cancelling ? "Đang hủy..." : "Hủy giao dịch"}
            </button>
          </div>
        )}

        {/* Wallet Info */}
        {transaction.walletId && (
          <div className="transaction-detail-wallet">
            <h3>Thông tin ví</h3>
            <div className="info-row">
              <span className="info-label">Số dư hiện tại</span>
              <span className="info-value">
                {formatCurrency(transaction.walletId.balance)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Loại tiền tệ</span>
              <span className="info-value">
                {transaction.walletId.currency || "VND"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionDetail;
