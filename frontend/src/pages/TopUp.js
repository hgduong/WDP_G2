import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/TopUp.css";

const DENOMINATIONS = [
  { value: 50000, label: "50.000đ" },
  { value: 100000, label: "100.000đ" },
  { value: 200000, label: "200.000đ" },
  { value: 500000, label: "500.000đ" },
  { value: 1000000, label: "1.000.000đ" },
  { value: 2000000, label: "2.000.000đ" },
];

function TopUp() {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const navigate = useNavigate();

  const handleSelectAmount = (amount) => {
    setSelectedAmount(amount);
  };

  const handleContinue = () => {
    if (!selectedAmount) {
      alert("Vui lòng chọn mệnh giá nạp tiền");
      return;
    }
    navigate("/topup/payment", { state: { amount: selectedAmount } });
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

        <button
          className="continue-button"
          onClick={handleContinue}
          disabled={!selectedAmount}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

export default TopUp;
