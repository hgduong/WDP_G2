import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../assets/styles/TopUp.css";
import { getUserTransactions, createPendingDeposit } from "../services/api";

const DENOMINATIONS = [
  { value: 10000, label: "10.000đ" },
  { value: 20000, label: "20.000đ" },
  { value: 50000, label: "50.000đ" },
  { value: 100000, label: "100.000đ" },
  { value: 200000, label: "200.000đ" },
  { value: 500000, label: "500.000đ" },
  { value: 1000000, label: "1.000.000đ" },
  { value: 2000000, label: "2.000.000đ" },
];

function TopUp() {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [hasPendingTransaction, setHasPendingTransaction] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkPendingTransactions = async () => {
      try {
        const response = await getUserTransactions({ status: "pending" });
        if (response.data && response.data.length > 0) {
          setHasPendingTransaction(true);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra giao dịch pending:", error);
      }
    };
    checkPendingTransactions();
  }, []);

  const handleSelectAmount = (amount) => {
    setSelectedAmount(amount);
  };

  const handleContinue = async () => {
    if (!selectedAmount) {
      toast.warning("Vui lòng chọn mệnh giá nạp tiền");
      return;
    }
    if (hasPendingTransaction) {
      toast.warning("Bạn đang có giao dịch đang chờ xử lý. Vui lòng hoàn tất hoặc hủy giao dịch trước khi nạp tiền mới.");
      return;
    }

    try {
      // Tạo pending transaction trước khi chuyển sang trang thanh toán
      const response = await createPendingDeposit({
        amount: selectedAmount,
        description: `Nạp tiền vào ví - ${formatCurrency(selectedAmount)}`,
        paymentMethod: "payos",
      });

      if (response.success) {
        // Chuyển sang trang thanh toán với dữ liệu transaction
        navigate("/topup/payment", {
          state: {
            amount: selectedAmount,
            paymentData: response.data,
          },
        });
      } else {
        toast.error(response.message || "Không thể tạo yêu cầu nạp tiền");
      }
    } catch (err) {
      console.error("Error creating pending deposit:", err);
      toast.error(err.message || "Đã xảy ra lỗi khi tạo yêu cầu nạp tiền");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="topup-container">
      <div className="topup-header">
        <h1>Nạp tiền vào ví</h1>
      </div>

      <div className="topup-content">
        <div className="denomination-section">
          <h2>Chọn mệnh giá nạp</h2>
          <div className="denomination-grid">
            {DENOMINATIONS.map((denom) => (
              <div
                key={denom.value}
                className={`denomination-card ${
                  selectedAmount === denom.value ? "selected" : ""
                }`}
                onClick={() => handleSelectAmount(denom.value)}
              >
                <span className="denomination-label">{denom.label}</span>
                {selectedAmount === denom.value && (
                  <span className="check-icon">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedAmount && (
          <div className="selected-summary">
            <h3>Số tiền nạp</h3>
            <div className="selected-amount">
              {formatCurrency(selectedAmount)}
            </div>
          </div>
        )}

        {hasPendingTransaction && (
          <div className="pending-warning">
            <p>⚠️ Bạn đang có giao dịch đang chờ xử lý. Vui lòng hoàn tất hoặc hủy giao dịch trước khi nạp tiền mới.</p>
          </div>
        )}

        <button
          className="continue-button"
          onClick={handleContinue}
          disabled={!selectedAmount || hasPendingTransaction}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

export default TopUp;
