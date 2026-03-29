import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserTransactions, getUserTransactionStats } from "../../services/transactionsApi";

export default function TransactionHistory() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    timePeriod: "",
    type: "",
    status: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Time period options
  const timePeriods = [
    { value: "", label: "Tất cả" },
    { value: "today", label: "Hôm nay" },
    { value: "week", label: "Tuần này" },
    { value: "month", label: "Tháng này" },
    { value: "3months", label: "3 tháng gần đây" },
    { value: "6months", label: "6 tháng gần đây" },
    { value: "year", label: "1 năm gần đây" },
  ];

  // Calculate date range based on time period
  const getDateRangeFromPeriod = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case "today":
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
        };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          startDate: weekStart.toISOString(),
          endDate: now.toISOString(),
        };
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: monthStart.toISOString(),
          endDate: now.toISOString(),
        };
      case "3months":
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        return {
          startDate: threeMonthsAgo.toISOString(),
          endDate: now.toISOString(),
        };
      case "6months":
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        return {
          startDate: sixMonthsAgo.toISOString(),
          endDate: now.toISOString(),
        };
      case "year":
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return {
          startDate: oneYearAgo.toISOString(),
          endDate: now.toISOString(),
        };
      default:
        return {
          startDate: "",
          endDate: "",
        };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build query params
        const params = {
          page: pagination.page,
          limit: pagination.limit,
        };

        // Get date range from time period
        const dateRange = getDateRangeFromPeriod(filters.timePeriod);
        if (dateRange.startDate) params.startDate = dateRange.startDate;
        if (dateRange.endDate) params.endDate = dateRange.endDate;
        
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;

        // Fetch wallet stats and transactions in parallel
        const [statsResponse, transactionsResponse] = await Promise.all([
          getUserTransactionStats(),
          getUserTransactions(params)
        ]);

        if (statsResponse.success) {
          setWallet(statsResponse.data.wallet);
        }

        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.data);
          if (transactionsResponse.pagination) {
            setPagination(prev => ({
              ...prev,
              total: transactionsResponse.pagination.total,
              totalPages: transactionsResponse.pagination.totalPages,
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching transaction data:", err);
        setError("Không thể tải dữ liệu giao dịch");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.page, pagination.limit, filters]);

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

  const handleTimePeriodChange = (period) => {
    setFilters(prev => ({
      ...prev,
      timePeriod: period,
    }));
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      timePeriod: "",
      type: "",
      status: "",
    });
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: newPage,
      }));
    }
  };

  const handleTransactionClick = (transactionId) => {
    navigate(`/transaction/${transactionId}`);
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
        
        <button 
          className="topup-button"
          onClick={() => navigate("/topup")}
        >
          Nạp tiền
        </button>
      </div>

      <h3>Lịch sử giao dịch</h3>
      
      {/* Filter Toggle Button */}
      <div className="filter-toggle-container">
        <button 
          className="filter-toggle-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"} 
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="transaction-filters">
          {/* Time Period Filter */}
          <div className="filter-section">
            <label className="filter-label">Thời gian</label>
            <div className="time-period-buttons">
              {timePeriods.map((period) => (
                <button
                  key={period.value}
                  className={`time-period-button ${filters.timePeriod === period.value ? "active" : ""}`}
                  onClick={() => handleTimePeriodChange(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Type and Status Filters */}
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="type">Loại giao dịch</label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả</option>
                <option value="deposit">Nạp tiền</option>
                <option value="withdraw">Rút tiền</option>
                <option value="payment">Thanh toán</option>
                <option value="refund">Hoàn tiền</option>
                <option value="transfer">Chuyển tiền</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="status">Trạng thái</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả</option>
                <option value="completed">Hoàn thành</option>
                <option value="pending">Đang xử lý</option>
                <option value="failed">Thất bại</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button 
              className="filter-apply-button"
              onClick={handleApplyFilters}
            >
              Áp dụng
            </button>
            <button 
              className="filter-reset-button"
              onClick={handleResetFilters}
            >
              Đặt lại
            </button>
          </div>
        </div>
      )}

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <div className="transaction-empty">Chưa có giao dịch nào</div>
      ) : (
        <>
          <div className="transaction-list">
            {transactions.map((t, i) => (
              <div 
                key={t._id || i} 
                className="transaction-item clickable"
                onClick={() => handleTransactionClick(t._id)}
              >
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                « Trước
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.page) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="pagination-ellipsis">...</span>}
                        <button
                          className={`pagination-page ${pagination.page === page ? "active" : ""}`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
              
              <button
                className="pagination-button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Sau »
              </button>
            </div>
          )}

          {/* Pagination Info */}
          <div className="pagination-info">
            Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} giao dịch
          </div>
        </>
      )}
    </section>
  );
}
