import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../assets/styles/AdminManagement.css";

const ROOM_TYPES = [
  { id: "Standard", name: "Standard", defaultRate: 8 },
  { id: "VIP", name: "VIP", defaultRate: 15 },
  { id: "IMAX", name: "IMAX", defaultRate: 10 },
  { id: "Double", name: "Double", defaultRate: 15 },
];

const DAYS_OF_WEEK = [
  { id: "Mon", name: "Thứ 2" },
  { id: "Tue", name: "Thứ 3" },
  { id: "Wed", name: "Thứ 4" },
  { id: "Thu", name: "Thứ 5" },
  { id: "Fri", name: "Thứ 6" },
  { id: "Sat", name: "Thứ 7" },
  { id: "Sun", name: "Chủ nhật" },
];

const PEAK_DAYS = ["Fri", "Sat", "Sun"];

function TaxConfigPage() {
  const [activeTab, setActiveTab] = useState("roomType");
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [roomTypeConfigs, setRoomTypeConfigs] = useState([]);
  const [showtimeRuleConfigs, setShowtimeRuleConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    taxType: "showtime_rule",
    categoryName: "Movie Ticket",
    ruleName: "",
    daysOfWeek: [...PEAK_DAYS],
    timeStart: "18:00",
    timeEnd: "22:00",
    adjustmentType: "add",
    additionalRate: 2,
    priority: 1,
    isActive: true,
  });

  useEffect(() => {
    fetchCinemas();
  }, []);

  useEffect(() => {
    if (selectedCinemaId) {
      fetchConfigs();
    }
  }, [selectedCinemaId, activeTab]);

  const fetchCinemas = async () => {
    try {
      const response = await fetch("http://localhost:9999/api/cinemas");
      const data = await response.json();
      setCinemas(data);
      if (data.length > 0) {
        setSelectedCinemaId(data[0]._id);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách rạp");
    }
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:9999/api/taxs");
      const taxes = await response.json();
      
      if (activeTab === "roomType") {
        const config = ROOM_TYPES.map(type => {
          const tax = taxes.find(
            t => t.taxType === "room_type" && 
                 t.categoryName === "Movie Ticket" && 
                 String(t.cinemaId) === selectedCinemaId &&
                 t.roomType === type.id
          );
          return {
            roomType: type.id,
            taxRate: tax?.taxRate ?? type.defaultRate,
            priority: tax?.roomTypePriority ?? 2,
            taxId: tax?._id,
            isActive: tax?.isActive ?? true,
            description: tax?.description || "",
          };
        });
        setRoomTypeConfigs(config);
      } else {
        const config = taxes.filter(
          t => t.taxType === "showtime_rule" && 
               String(t.cinemaId) === selectedCinemaId
        ).map(t => ({
          _id: t._id,
          ruleName: t.description || `Rule ${t._id?.slice(-4) || 'new'}`,
          categoryName: t.categoryName || "Movie Ticket",
          daysOfWeek: t.daysOfWeek || [],
          timeStart: t.timeStart || "18:00",
          timeEnd: t.timeEnd || "22:00",
          adjustmentType: t.adjustmentType || "add",
          additionalRate: t.additionalRate || 0,
          priority: t.priority || 1,
          isActive: t.isActive ?? true,
        }));
        setShowtimeRuleConfigs(config);
      }
    } catch (error) {
      toast.error("Lỗi khi tải cấu hình thuế");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoomType = async (roomType) => {
    const config = roomTypeConfigs.find(c => c.roomType === roomType);
    if (!config) return;

    try {
      const data = {
        taxType: "room_type",
        categoryName: "Movie Ticket",
        taxRate: config.taxRate,
        roomTypePriority: config.priority,
        roomType: roomType,
        cinemaId: selectedCinemaId,
        applyFrom: new Date().toISOString(),
        isActive: config.isActive,
        description: config.description,
      };

      if (config.taxId) {
        await fetch(`http://localhost:9999/api/taxs/${config.taxId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("http://localhost:9999/api/taxs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      toast.success(`Lưu cấu hình thuế cho ${roomType} thành công`);
      fetchConfigs();
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    }
  };

  const handleToggleActive = async (roomType) => {
    const config = roomTypeConfigs.find(c => c.roomType === roomType);
    if (!config || !config.taxId) {
      toast.warning("Cần lưu cấu hình trước khi thay đổi trạng thái");
      return;
    }

    try {
      await fetch(`http://localhost:9999/api/taxs/${config.taxId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !config.isActive }),
      });
      toast.success(`${config.isActive ? "Vô hiệu hóa" : "Kích hoạt"} ${roomType} thành công`);
      fetchConfigs();
    } catch (error) {
      toast.error("Lỗi khi thay đổi trạng thái");
    }
  };

  const handleSaveShowtimeRule = async (ruleData) => {
    try {
      const data = {
        taxType: "showtime_rule",
        categoryName: ruleData.categoryName,
        daysOfWeek: ruleData.daysOfWeek,
        timeStart: ruleData.timeStart,
        timeEnd: ruleData.timeEnd,
        adjustmentType: ruleData.adjustmentType,
        additionalRate: ruleData.additionalRate,
        priority: ruleData.priority,
        cinemaId: selectedCinemaId,
        applyFrom: new Date().toISOString(),
        isActive: ruleData.isActive,
        description: ruleData.ruleName || "",
      };

      if (ruleData._id) {
        await fetch(`http://localhost:9999/api/taxs/${ruleData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("http://localhost:9999/api/taxs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      toast.success("Lưu quy tắc thành công");
      fetchConfigs();
      setShowAddModal(false);
    } catch (error) {
      toast.error("Lỗi khi lưu quy tắc");
    }
  };

  const handleDeleteShowtimeRule = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa quy tắc này?")) return;
    
    try {
      await fetch(`http://localhost:9999/api/taxs/${id}`, {
        method: "DELETE",
      });
      toast.success("Xóa quy tắc thành công");
      fetchConfigs();
    } catch (error) {
      toast.error("Lỗi khi xóa quy tắc");
    }
  };

  const handleToggleShowtimeRule = async (rule) => {
    try {
      await fetch(`http://localhost:9999/api/taxs/${rule._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      toast.success(`${rule.isActive ? "Vô hiệu hóa" : "Kích hoạt"} thành công`);
      fetchConfigs();
    } catch (error) {
      toast.error("Lỗi khi thay đổi trạng thái");
    }
  };

  const openAddModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        taxType: "showtime_rule",
        categoryName: item.categoryName || "Movie Ticket",
        ruleName: item.ruleName,
        daysOfWeek: item.daysOfWeek || [...PEAK_DAYS],
        timeStart: item.timeStart || "18:00",
        timeEnd: item.timeEnd || "22:00",
        adjustmentType: item.adjustmentType || "add",
        additionalRate: item.additionalRate || 2,
        priority: item.priority || 1,
        isActive: item.isActive ?? true,
      });
    } else {
      setEditingItem(null);
      setFormData({
        taxType: "showtime_rule",
        categoryName: "Movie Ticket",
        ruleName: "",
        daysOfWeek: [...PEAK_DAYS],
        timeStart: "18:00",
        timeEnd: "22:00",
        adjustmentType: "add",
        additionalRate: 2,
        priority: 1,
        isActive: true,
      });
    }
    setShowAddModal(true);
  };

  const handleDayToggle = (dayId) => {
    const currentDays = formData.daysOfWeek;
    if (currentDays.includes(dayId)) {
      setFormData({ ...formData, daysOfWeek: currentDays.filter(d => d !== dayId) });
    } else {
      setFormData({ ...formData, daysOfWeek: [...currentDays, dayId] });
    }
  };

  return (
    <div className="admin-management" style={{ padding: "20px" }}>
      <div className="management-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "24px", color: "#333" }}>Cấu hình Thuế</h2>
        <select
          value={selectedCinemaId}
          onChange={(e) => setSelectedCinemaId(e.target.value)}
          style={{ padding: "10px 15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", minWidth: "200px" }}
        >
          {cinemas.map((cinema) => (
            <option key={cinema._id} value={cinema._id}>
              {cinema.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0", marginBottom: "24px" }}>
        <button
          style={{
            padding: "12px 24px",
            border: "none",
            background: activeTab === "roomType" ? "#4CAF50" : "transparent",
            color: activeTab === "roomType" ? "white" : "#666",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            borderRadius: "8px 8px 0 0",
            transition: "all 0.2s ease",
          }}
          onClick={() => setActiveTab("roomType")}
        >
          Theo loại phòng
        </button>
        <button
          style={{
            padding: "12px 24px",
            border: "none",
            background: activeTab === "showtime" ? "#4CAF50" : "transparent",
            color: activeTab === "showtime" ? "white" : "#666",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            borderRadius: "8px 8px 0 0",
            transition: "all 0.2s ease",
          }}
          onClick={() => setActiveTab("showtime")}
        >
          Theo suất chiếu
        </button>
      </div>

      {activeTab === "roomType" && (
        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <table className="management-table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#333" }}>Loại phòng</th>
                <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#333" }}>Thuế suất (%)</th>
                <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#333" }}>Ưu tiên</th>
                <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#333" }}>Mô tả</th>
                <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#333" }}>Trạng thái</th>
                <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#333" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {roomTypeConfigs.map((config) => (
                <tr key={config.roomType} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "16px" }}>
                    <span style={{ fontWeight: "600", color: "#333", fontSize: "15px" }}>{config.roomType}</span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="number"
                      value={config.taxRate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setRoomTypeConfigs(prev => prev.map(item => 
                          item.roomType === config.roomType ? { ...item, taxRate: value } : item
                        ));
                      }}
                      style={{ width: "80px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", textAlign: "center", fontSize: "14px" }}
                      min="0"
                      max="100"
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <input
                      type="number"
                      value={config.priority}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setRoomTypeConfigs(prev => prev.map(item => 
                          item.roomType === config.roomType ? { ...item, priority: value } : item
                        ));
                      }}
                      style={{ width: "60px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", textAlign: "center", fontSize: "14px" }}
                      min="1"
                      max="10"
                    />
                  </td>
                  <td style={{ padding: "16px" }}>
                    <input
                      type="text"
                      value={config.description}
                      onChange={(e) => {
                        setRoomTypeConfigs(prev => prev.map(item => 
                          item.roomType === config.roomType ? { ...item, description: e.target.value } : item
                        ));
                      }}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
                      placeholder="Mô tả..."
                    />
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span style={{ 
                      padding: "6px 12px", 
                      borderRadius: "20px", 
                      fontSize: "12px", 
                      fontWeight: "600",
                      background: config.isActive ? "#e8f5e9" : "#ffebee",
                      color: config.isActive ? "#2e7d32" : "#c62828"
                    }}>
                      {config.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button className="btn-primary" onClick={() => handleSaveRoomType(config.roomType)} style={{ padding: "8px 16px", fontSize: "13px" }}>
                        Lưu
                      </button>
                      <button 
                        onClick={() => handleToggleActive(config.roomType)} 
                        style={{ 
                          padding: "8px 16px", 
                          fontSize: "13px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          background: config.isActive ? "#ff9800" : "#4CAF50",
                          color: "white",
                          fontWeight: "500"
                        }}
                      >
                        {config.isActive ? "Tắt" : "Bật"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "showtime" && (
        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "600", color: "#333", fontSize: "15px" }}>Danh sách quy tắc</span>
            <button className="btn-primary" onClick={() => openAddModal()} style={{ padding: "10px 20px", fontSize: "13px" }}>
              + Thêm quy tắc
            </button>
          </div>
          <table className="management-table" style={{ margin: 0 }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#333", width: "50px" }}>STT</th>
                <th style={{ padding: "14px", textAlign: "left", fontWeight: "600", color: "#333" }}>Ngày áp dụng</th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#333" }}>Khung giờ</th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#333" }}>Phương thức</th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#333" }}>Giá trị</th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#333" }}>Ưu tiên</th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#333" }}>Trạng thái</th>
                <th style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#333", width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {showtimeRuleConfigs.map((config, index) => (
                <tr key={config._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "14px", textAlign: "center", color: "#666" }}>{index + 1}</td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {config.daysOfWeek.map(d => (
                        <span key={d} style={{ padding: "2px 8px", background: "#e3f2fd", borderRadius: "12px", fontSize: "12px", color: "#1565c0" }}>
                          {DAYS_OF_WEEK.find(day => day.id === d)?.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "14px", textAlign: "center", fontWeight: "500", color: "#333" }}>{config.timeStart} - {config.timeEnd}</td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <span style={{ padding: "4px 10px", background: "#fff3e0", borderRadius: "12px", fontSize: "12px", color: "#e65100" }}>
                      {config.adjustmentType === "add" ? "Cộng thêm" : "Thay thế"}
                    </span>
                  </td>
                  <td style={{ padding: "14px", textAlign: "center", fontWeight: "600", color: "#333" }}>
                    {config.adjustmentType === "add" ? `+${config.additionalRate}%` : `${config.additionalRate}%`}
                  </td>
                  <td style={{ padding: "14px", textAlign: "center", color: "#666" }}>{config.priority}</td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <span style={{ 
                      padding: "4px 10px", 
                      borderRadius: "12px", 
                      fontSize: "12px", 
                      fontWeight: "600",
                      background: config.isActive ? "#e8f5e9" : "#ffebee",
                      color: config.isActive ? "#2e7d32" : "#c62828"
                    }}>
                      {config.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button className="btn-edit" onClick={() => openAddModal(config)} style={{ padding: "6px 12px", fontSize: "12px" }}>Sửa</button>
                      <button 
                        onClick={() => handleToggleShowtimeRule(config)}
                        style={{ 
                          padding: "6px 12px", 
                          fontSize: "12px",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          background: config.isActive ? "#ff9800" : "#4CAF50",
                          color: "white"
                        }}
                      >
                        {config.isActive ? "Tắt" : "Bật"}
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteShowtimeRule(config._id)} style={{ padding: "6px 12px", fontSize: "12px" }}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {showtimeRuleConfigs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                    Chưa có quy tắc nào. Hãy nhấn "Thêm quy tắc" để tạo mới.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" style={{ background: "white", borderRadius: "12px", padding: "24px", maxWidth: "500px", width: "90%" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "18px", color: "#333" }}>{editingItem ? "Sửa quy tắc" : "Thêm quy tắc mới"}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveShowtimeRule(editingItem ? { ...formData, _id: editingItem._id } : formData);
            }}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333" }}>Danh mục:</label>
                <select
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
                >
                  <option value="Movie Ticket">Vé xem phim</option>
                  <option value="Food & Beverage">Combo Đồ ăn/Nước uống</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333" }}>Ngày trong tuần:</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {DAYS_OF_WEEK.map(day => (
                    <label key={day.id} style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", padding: "6px 12px", border: "1px solid #ddd", borderRadius: "6px", background: formData.daysOfWeek.includes(day.id) ? "#e3f2fd" : "white" }}>
                      <input
                        type="checkbox"
                        checked={formData.daysOfWeek.includes(day.id)}
                        onChange={() => handleDayToggle(day.id)}
                      />
                      {day.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333" }}>Giờ bắt đầu:</label>
                  <input
                    type="time"
                    value={formData.timeStart}
                    onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333" }}>Giờ kết thúc:</label>
                  <input
                    type="time"
                    value={formData.timeEnd}
                    onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333" }}>Phương thức:</label>
                <select
                  value={formData.adjustmentType}
                  onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
                >
                  <option value="add">Cộng thêm (%)</option>
                  <option value="replace">Thay thế bằng (%)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333" }}>Giá trị (%):</label>
                <input
                  type="number"
                  value={formData.additionalRate}
                  onChange={(e) => setFormData({ ...formData, additionalRate: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333" }}>Độ ưu tiên:</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}
                  min="1"
                  max="10"
                />
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span style={{ fontWeight: "500", color: "#333" }}>Hoạt động</span>
                </label>
              </div>
              <div className="modal-actions" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>Lưu</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)} style={{ padding: "10px 24px" }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaxConfigPage;