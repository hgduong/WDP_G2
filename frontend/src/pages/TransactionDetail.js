import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTransactionById } from "../services/api";
import { generateQRCodeUrl } from "../utils/orderUtils";
import { toast } from "react-toastify";
import "../assets/styles/TransactionDetail.css";

function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await getTransactionById(id);
        if (response.success) {
          setTransaction(response.data);
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
  }, [id]);

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

        {/* QR Code Section */}
        {transaction.paymentMethod === "payos" && transaction.status === "pending" && (
          <div className="transaction-qr-section">
            <h3>Mã QR thanh toán</h3>
            <div className="qr-code-container">
              <img
                src={generateQRCodeUrl({
                  transactionId: transaction._id,
                  amount: transaction.amount,
                  description: transaction.description
                })}
                alt="QR Code"
                className="qr-code-image"
              />
            </div>
            <p className="qr-instruction">Quét mã QR để thanh toán</p>
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
