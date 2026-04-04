import React, { useMemo, useState, useEffect } from "react";
import "./ComboOrder.css";
import { getActiveFoodBeverageTax } from "../services/taxsApi";

const COMBOS = [
  {
    id: "combo-snoopy",
    name: "SNOOPY SPORT 2025 S",
    items: ["01 Ly nước Snoopy Sport 2025 (không kèm nước)", "01 Coca-cola 32oz", "01 Bắp ngọt lớn 44oz"],
    note: "Nhận hàng vào ngày xem phim (khi mua kèm vé) hoặc vào ngày đã chọn (khi mua tại CGV Store).",
    price: 249000,
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Popcorn_in_bucket.jpg",
  },
  {
    id: "combo-mario-bottle",
    name: "BOTTLE_MARIO CB 2026",
    items: ["01 Bình nước Mario Galaxy", "01 Phần bắp lớn", "01 Nước ngọt siêu lớn"],
    note: "Bình nước Mario Galaxy 2026 • Dung tích: 22oz ~650ml • Chỉ dùng cho thức uống lạnh.",
    price: 239000,
    image: "https://upload.wikimedia.org/wikipedia/commons/9/91/Cola_in_a_cup.jpg",
  },
  {
    id: "combo-blanket",
    name: "BLANKET_MARIO CB 2026",
    items: ["01 Chăn Mario Galaxy", "01 Phần bắp ngọt lớn", "01 Nước ngọt siêu lớn"],
    note: "Chăn Mario Galaxy 2026 • Kích thước: 100 x 150 cm • Chất liệu: Polyester.",
    price: 269000,
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Cinema_popcorn_bucket.jpg",
  },
  {
    id: "combo-set-mario",
    name: "SET_MARIO CB 2026",
    items: ["01 Chăn & 01 Bình nước Mario", "01 Phần bắp ngọt lớn", "01 Nước ngọt siêu lớn"],
    note: "Bình nước Mario Galaxy 2026 • Dung tích: 22oz ~650ml • Chỉ dùng cho thức uống lạnh.",
    price: 499000,
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Popcorn_%281%29.jpg",
  },
  {
    id: "combo-premium-cgv",
    name: "PREMIUM CGV COMBO",
    items: ["1 Bắp Ngọt Lớn + 2 Nước Siêu Lớn + 1 Snack"],
    note: "Áp dụng giá Lễ, Tết cho các sản phẩm bắp nước đổi với giao dịch có suất chiếu vào ngày Lễ, Tết.",
    price: 135000,
    image: "https://upload.wikimedia.org/wikipedia/commons/6/61/Popcorn_detailed_image.jpg",
  },
  {
    id: "combo-premium-my",
    name: "PREMIUM MY COMBO",
    items: ["1 Bắp Ngọt Lớn + 1 Nước Siêu Lớn + 1 Snack"],
    note: "Nhận hàng trong ngày xem phim (khi mua cùng vé) hoặc trong ngày đã chọn (khi mua tại CGV Store).",
    price: 115000,
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Bucket_for_popcorn.jpg",
  },
  {
    id: "combo-cgv",
    name: "CGV COMBO",
    items: ["1 Bắp Ngọt Lớn + 2 Nước Siêu Lớn"],
    note: "Áp dụng giá Lễ, Tết cho các sản phẩm bắp nước đổi với giao dịch có suất chiếu vào ngày Lễ, Tết.",
    price: 125000,
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Popcorn_bucket_inside.jpg",
  },
  {
    id: "combo-my",
    name: "MY COMBO",
    items: ["1 Bắp Ngọt Lớn + 1 Nước Siêu Lớn"],
    note: "Nhận hàng trong ngày xem phim (khi mua cùng vé) hoặc trong ngày đã chọn (khi mua tại CGV Store).",
    price: 95000,
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Popcorn.jpg",
  },
];

const formatVnd = (value) =>
  value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const ComboOrder = () => {
  const [quantities, setQuantities] = useState(
    COMBOS.reduce((acc, combo) => {
      acc[combo.id] = 0;
      return acc;
    }, {})
  );
  const [taxRate, setTaxRate] = useState(0);
  const [taxInfo, setTaxInfo] = useState(null);

  useEffect(() => {
    const fetchTax = async () => {
      try {
        // Get selected combo IDs from quantities
        const selectedComboIds = Object.keys(quantities).filter(id => quantities[id] > 0);
        if (selectedComboIds.length === 0) {
          setTaxInfo(null);
          return;
        }
        
        const comboIds = selectedComboIds.join(",");
        const tax = await getActiveFoodBeverageTax(comboIds);
        
        // Handle both single tax and array of taxes
        const taxes = Array.isArray(tax) ? tax : (tax ? [tax] : []);
        
        if (taxes.length > 0) {
          // Store all applicable taxes with their rates
          const taxMap = {};
          taxes.forEach(t => {
            if (t.applyTo && Array.isArray(t.applyTo)) {
              t.applyTo.forEach(comboId => {
                taxMap[comboId] = t.taxRate;
              });
            }
          });
          setTaxInfo(taxMap);
        } else {
          setTaxInfo(null);
        }
      } catch (error) {
        setTaxInfo(null);
      }
    };
    fetchTax();
  }, [quantities]);

  const total = useMemo(() => {
    return COMBOS.reduce(
      (sum, combo) => sum + combo.price * (quantities[combo.id] || 0),
      0
    );
  }, [quantities]);

  const selectedCombos = useMemo(() => {
    return COMBOS.filter((combo) => quantities[combo.id] > 0).map(
      (combo) => combo.id
    );
  }, [quantities]);

  const taxAmount = useMemo(() => {
    if (!selectedCombos.length || !taxInfo) return 0;
    
    let tax = 0;
    for (const combo of COMBOS) {
      const qty = quantities[combo.id] || 0;
      if (qty > 0) {
        const comboPrice = combo.price * qty;
        const rate = taxInfo[combo.id];
        if (rate) {
          tax += comboPrice * (rate / 100);
        }
      }
    }
    return tax;
  }, [quantities, taxInfo, selectedCombos]);

  const updateQuantity = (id, nextValue) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, nextValue),
    }));
  };

  return (
    <div className="combo-page">
      <div className="combo-header">
        <h1>Bắp Nước</h1>
        <p>Chọn combo bạn muốn thêm vào đơn hàng.</p>
      </div>

      <div className="combo-grid">
        {COMBOS.map((combo) => (
          <div key={combo.id} className="combo-card">
            <div className="combo-image">
              <img src={combo.image} alt={combo.name} />
            </div>
            <div className="combo-body">
              <h3>{combo.name}</h3>
              <ul>
                {combo.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="combo-note">{combo.note}</p>
              <div className="combo-footer">
                <span className="combo-price">{formatVnd(combo.price)}</span>
                <div className="combo-qty">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(combo.id, (quantities[combo.id] || 0) - 1)
                    }
                  >
                    -
                  </button>
                  <span>{quantities[combo.id] || 0}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(combo.id, (quantities[combo.id] || 0) + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="combo-summary">
        <div>
          <strong>Tổng combo:</strong> {formatVnd(total)}
        </div>
        {taxAmount > 0 && (
          <div>
            <strong>Thuế:</strong> {formatVnd(taxAmount)}
          </div>
        )}
        <div>
          <strong>Tổng cộng:</strong> {formatVnd(total + taxAmount)}
        </div>
        <button type="button">Tiếp tục</button>
      </div>
    </div>
  );
};

export default ComboOrder;
