import React, { useEffect, useState } from "react";
import { getUserTransactions, getUserTransactionStats } from "../../services/api";

export default function TransactionHistory() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch wallet stats and transactions in parallel
        const [statsResponse, transactionsResponse] = await Promise.all([
          getUserTransactionStats(),
          getUserTransactions({ limit: 50 })
        ]);

        if (statsResponse.success) {
          setWallet(statsResponse.data.wallet);
        }

        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.data);
        }
      } catch (err) {
        console.error("Error fetching transaction data:", err);
        setError("Không thể tải dữ liệu giao dịch");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (loading) {
    return (
      <section className="profile-section">
        <h3>Lịch sử giao dịch</h3>
        <div className="transaction-loading">Đang tải...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="profile-section">
        <h3>Lịch sử giao dịch</h3>
        <div className="transaction-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="profile-section">
      <h3>Số dư ví</h3>
      
      {/* Wallet Balance Display */}
      <div className="wallet-balance-container">
        <div className="wallet-card">
          <div className="wallet-label">Số dư hiện tại</div>
          <div className="wallet-balance">
            {wallet?.balance !== undefined ? formatCurrency(wallet.balance) : "0 đ"}
          </div>
        </div>
        
        <div className="wallet-stats">
          <div className="wallet-stat">
            <span className="stat-label">Tổng đã nạp</span>
            <span className="stat-value positive">
              {wallet?.totalDeposited !== undefined ? formatCurrency(wallet.totalDeposited) : "0 đ"}
            </span>
          </div>
          <div className="wallet-stat">
            <span className="stat-label">Tổng đã chi tiêu</span>
            <span className="stat-value negative">
              {wallet?.totalSpent !== undefined ? formatCurrency(wallet.totalSpent) : "0 đ"}
            </span>
          </div>
        </div>
      </div>

      <h3>Lịch sử giao dịch</h3>
      
      {transactions.length === 0 ? (
        <div className="transaction-empty">Chưa có giao dịch nào</div>
      ) : (
        <div className="transaction-list">
          {transactions.map((t, i) => (
            <div key={t._id || i} className="transaction-item">
              <div className="transaction-icon">
                {getTransactionIcon(t.type)}
              </div>
              <div className="transaction-details">
                <span className="transaction-type">
                  {getTransactionTypeLabel(t.type)}
                </span>
                <span className="transaction-description">
                  {t.description || "-"}
                </span>
                <span className="transaction-date">
                  {formatDate(t.createdAt)}
                </span>
              </div>
              <div className="transaction-amount-container">
                <span className={`transaction-amount ${t.type}`}>
                  {t.type === "deposit" || t.type === "refund" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
                <span className={`transaction-status ${t.status}`}>
                  {t.status === "completed" ? "Hoàn thành" : 
                   t.status === "pending" ? "Đang xử lý" :
                   t.status === "failed" ? "Thất bại" : 
                   t.status === "cancelled" ? "Đã hủy" : t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
