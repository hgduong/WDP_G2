import React from "react";
import { toast } from "react-toastify";

const SeatConfigModal = ({
  show,
  selectedRoom,
  seatGrid,
  selectedSeat,
  seatMapGenerated,
  onClose,
  onSeatGridChange,
  onSeatMapGeneratedChange,
  onSeatSelect,
  onUpdateSeatInGrid,
  onPermanentDeleteSeatClick,
  onSaveAllSeats,
}) => {
  if (!show || !selectedRoom) return null;

  const getRowLabels = () => {
    const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return rowLabels.slice(0, seatGrid.rows).split("");
  };

  const getColumnNumbers = () => {
    return Array.from({ length: seatGrid.columns }, (_, i) => i + 1);
  };

  const getSeatByPosition = (row, number) => {
    return seatGrid.seats.find((s) => s.row === row && s.number === number);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Cấu hình ghế - {selectedRoom.name}</h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="seat-config-container">
            {/* Row/Column Configuration - Show only when seat map is not generated */}
            {!seatMapGenerated && (
              <div className="seat-config-toolbar">
                <div className="seat-config-inputs">
                  <div className="seat-config-input-group">
                    <label>Số hàng:</label>
                    <input
                      type="number"
                      min="1"
                      max="26"
                      value={seatGrid.rows}
                      onChange={(e) => {
                        const newRows = parseInt(e.target.value) || 1;
                        if (newRows >= 1 && newRows <= 26) {
                          onSeatGridChange({
                            ...seatGrid,
                            rows: newRows,
                          });
                        }
                      }}
                      className="seat-config-input"
                    />
                  </div>
                  <div className="seat-config-input-group">
                    <label>Số ghế mỗi hàng:</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={seatGrid.columns}
                      onChange={(e) => {
                        const newCols = parseInt(e.target.value) || 1;
                        if (newCols >= 1 && newCols <= 50) {
                          onSeatGridChange({
                            ...seatGrid,
                            columns: newCols,
                          });
                        }
                      }}
                      className="seat-config-input"
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const newSeats = [];
                      const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                      for (let r = 0; r < seatGrid.rows; r++) {
                        const rowLabel = rowLabels[r];
                        for (let c = 1; c <= seatGrid.columns; c++) {
                          const existingSeat = seatGrid.seats.find(
                            (s) => s.row === rowLabel && s.number === c,
                          );
                          if (existingSeat) {
                            newSeats.push(existingSeat);
                          } else {
                            newSeats.push({
                              id: `temp_${rowLabel}${c}`,
                              row: rowLabel,
                              number: c,
                              type: "Standard",
                              status: "Available",
                              isNew: true,
                              isModified: false,
                            });
                          }
                        }
                      }
                      onSeatGridChange({ ...seatGrid, seats: newSeats });
                      onSeatMapGeneratedChange(true);
                      toast.success("Đã tạo sơ đồ ghế mới!");
                    }}
                  >
                    Tạo sơ đồ
                  </button>
                </div>
              </div>
            )}

            {/* Screen Display - Show only when seat map is generated */}
            {seatMapGenerated && (
              <div className="screen-display">
                <div className="screen-label">MÀN HÌNH CHIẾU</div>
                <div className="screen-line"></div>
              </div>
            )}

            {/* Seat Grid */}
            <div className="seat-grid-container">
              <div className="seat-grid-wrapper">
                {getRowLabels().map((rowLabel) => {
                  return (
                    <div key={rowLabel} className="seat-row">
                      <div className="seat-cells">
                        {getColumnNumbers().map((colNumber) => {
                          const seat = getSeatByPosition(
                            rowLabel,
                            colNumber,
                          );

                          if (seat) {
                            return (
                              <div
                                key={seat.id}
                                className={`seat-cell ${seat.type.toLowerCase()} ${seat.status === "Deleted" ? "deleted" : ""} ${selectedSeat?.id === seat.id ? "selected" : ""}`}
                                onClick={(e) => {
                                  if (e.button === 0) {
                                    // Left click
                                    if (seat.status === "Deleted") {
                                      // Restore deleted seat
                                      onUpdateSeatInGrid(seat.id, {
                                        status: "Available",
                                      });
                                      toast.success(
                                        `Đã khôi phục ghế ${seat.row}${seat.number}`,
                                      );
                                    } else {
                                      // Toggle between Standard, VIP, and Double
                                      const types = [
                                        "Standard",
                                        "VIP",
                                        "Double",
                                      ];
                                      const currentIndex = types.indexOf(
                                        seat.type,
                                      );
                                      const newType =
                                        types[
                                          (currentIndex + 1) % types.length
                                        ];
                                      onUpdateSeatInGrid(seat.id, {
                                        type: newType,
                                      });
                                      toast.success(
                                        `Đã chuyển ghế ${seat.row}${seat.number} sang ${newType}`,
                                      );
                                    }
                                  }
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (seat.status !== "Deleted") {
                                    onUpdateSeatInGrid(seat.id, {
                                      status: "Deleted",
                                    });
                                    toast.success(
                                      `Đã ẩn ghế ${seat.row}${seat.number}`,
                                    );
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  if (e.button === 2) {
                                    // Double right-click - permanently delete
                                    e.preventDefault();
                                    onPermanentDeleteSeatClick(seat);
                                  }
                                }}
                                title={`${seat.row}${seat.number} - ${seat.type} - ${seat.status === "Deleted" ? "Đã xóa (Click để khôi phục)" : seat.status === "Available" ? "Còn trống" : "Đã đặt"}\nClick trái: Chuyển Standard ↔ VIP ↔ Double\nClick phải: Ẩn ghế\nClick phải 2 lần: Xóa vĩnh viễn`}
                              >
                                {seat.status === "Deleted" ? (
                                  <span className="seat-deleted-x">×</span>
                                ) : (
                                  <span className="seat-number">
                                    {seat.row}
                                    {seat.number}
                                  </span>
                                )}
                              </div>
                            );
                          } else {
                            // Empty cell - show add button
                            return (
                              <div
                                key={`empty_${rowLabel}${colNumber}`}
                                className="seat-cell empty"
                                onClick={() => {
                                  // Add new seat at this position
                                  const newSeat = {
                                    id: `temp_${rowLabel}${colNumber}`,
                                    row: rowLabel,
                                    number: colNumber,
                                    type: "Standard",
                                    status: "Available",
                                    isNew: true,
                                    isModified: false,
                                  };
                                  onSeatGridChange({
                                    ...seatGrid,
                                    seats: [...seatGrid.seats, newSeat],
                                  });
                                  toast.success(
                                    `Đã thêm ghế ${rowLabel}${colNumber}`,
                                  );
                                }}
                                title={`Thêm ghế ${rowLabel}${colNumber}`}
                              >
                                <span className="seat-add-icon">+</span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-color standard"></div>
                <span>Standard</span>
              </div>
              <div className="legend-item">
                <div className="legend-color vip"></div>
                <span>VIP</span>
              </div>
              <div className="legend-item">
                <div className="legend-color double"></div>
                <span>Double</span>
              </div>
              <div className="legend-item">
                <div className="legend-color deleted"></div>
                <span>Đã ẩn</span>
              </div>
              {/* <div className="legend-item">
                <div className="legend-color empty"></div>
                <span>Trống (Click để thêm)</span>
              </div> */}
            </div>

            {/* Instructions */}
            <div className="seat-instructions">
              <h4>Thao tác:</h4>
              <ul>
                <li>
                  <strong>Click ô trống</strong> → Thêm ghế mới
                </li>
                <li>
                  <strong>Click ghế</strong> → Chuyển Standard ↔ VIP ↔
                  Double
                </li>
                <li>
                  <strong>Click phải</strong> → Ẩn ghế
                </li>
                <li>
                  <strong>Click phải 2 lần</strong> → Xóa vĩnh viễn ghế
                </li>
                <li>
                  <strong>Click ghế đã xóa</strong> → Khôi phục
                </li>
              </ul>
              {selectedSeat && selectedSeat.status !== "Deleted" && (
                <div className="selected-seat-actions">
                  <p>
                    Đã chọn: <strong>{selectedSeat.row}{selectedSeat.number}</strong> ({selectedSeat.type})
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => onPermanentDeleteSeatClick(selectedSeat)}
                  >
                    Xóa vĩnh viễn ghế này
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSaveAllSeats}
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatConfigModal;
