import React, { useState } from "react";
import { toast } from "react-toastify";

const SeatConfigModal = ({
  show,
  selectedRoom,
  seatGrid,
  selectedSeat,
  onClose,
  onSeatGridChange,
  onSeatSelect,
  onUpdateSeatInGrid,
  onPermanentDeleteSeatClick,
  onSaveAllSeats,
  onAddRow,
  onAddColumn,
  onDeleteRow,
  onDeleteColumn,
}) => {
  const [showAddSeatModal, setShowAddSeatModal] = useState(false);
  const [showDeleteRowModal, setShowDeleteRowModal] = useState(false);
  const [showDeleteColumnModal, setShowDeleteColumnModal] = useState(false);
  const [selectedRowForAdd, setSelectedRowForAdd] = useState("");
  const [seatCountToAdd, setSeatCountToAdd] = useState(1);

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

  // Tìm ghế liền kề (ghế bên phải) cho ghế đôi
  const getAdjacentSeat = (seat) => {
    return seatGrid.seats.find(
      (s) => s.row === seat.row && s.number === seat.number + 1 && s.status !== 'Deleted'
    );
  };

  // Kiểm tra ghế có phải là ghế đầu tiên trong cặp đôi không (số ghế nhỏ hơn)
  const isFirstInCouplePair = (seat) => {
    if (seat.type !== 'Couple' || !seat.couplePairId) return false;
    const pairSeat = seatGrid.seats.find((s) => s.id === seat.couplePairId);
    if (!pairSeat) return false;
    return seat.number < pairSeat.number;
  };

  // Kiểm tra ghế có phải là ghế thứ hai trong cặp đôi không (số ghế lớn hơn)
  const isSecondInCouplePair = (seat) => {
    if (seat.type !== 'Couple' || !seat.couplePairId) return false;
    const pairSeat = seatGrid.seats.find((s) => s.id === seat.couplePairId);
    if (!pairSeat) return false;
    return seat.number > pairSeat.number;
  };

  // Kiểm tra ghế có phải là ghế đôi không
  const isCoupleSeat = (seat) => {
    return seat.type === 'Couple';
  };

  // Tìm ghế pair của ghế đôi
  const getCouplePairSeat = (seat) => {
    if (!seat.couplePairId) return null;
    const pair = seatGrid.seats.find((s) => s.id === seat.couplePairId);
    // Nếu ghế pair đã bị xóa hoặc không tồn tại trong grid, trả về null (orphan)
    if (!pair || pair.status === "Deleted") return null;
    return pair;
  };

  const handleAddRowClick = () => {
    onAddRow();
    toast.success(`Đã thêm hàng ${String.fromCharCode(65 + seatGrid.rows)} thành công!`);
  };

  const handleAddColumnClick = () => {
    onAddColumn();
    toast.success(`Đã thêm cột ${seatGrid.columns + 1} thành công!`);
  };

  const handleConfirmAddSeats = () => {
    if (!selectedRowForAdd || seatCountToAdd < 1) {
      toast.error("Vui lòng chọn hàng và số ghế hợp lệ!");
      return;
    }

    const rowIndex = selectedRowForAdd.charCodeAt(0) - 65;
    const currentColumns = seatGrid.columns;
    const newColumns = currentColumns + seatCountToAdd;

    // Add new seats to the selected row
    const newSeats = [];
    for (let i = 1; i <= seatCountToAdd; i++) {
      newSeats.push({
        id: `temp_${selectedRowForAdd}${currentColumns + i}`,
        row: selectedRowForAdd,
        number: currentColumns + i,
        type: "Standard",
        status: "Available",
        isNew: true,
        isModified: false,
      });
    }

    onSeatGridChange({
      ...seatGrid,
      columns: newColumns,
      seats: [...seatGrid.seats, ...newSeats],
    });

    toast.success(`Đã thêm ${seatCountToAdd} ghế vào hàng ${selectedRowForAdd} thành công!`);
    setShowAddSeatModal(false);
    setSelectedRowForAdd("");
    setSeatCountToAdd(1);
  };

  const handleDeleteRowClick = () => {
    if (seatGrid.rows <= 1) {
      toast.error("Không thể xóa hàng cuối cùng!");
      return;
    }
    setShowDeleteRowModal(true);
  };

  const handleConfirmDeleteRow = () => {
    const lastRow = String.fromCharCode(65 + seatGrid.rows - 1);
    onDeleteRow(lastRow);
    toast.success(`Đã xóa hàng ${lastRow} thành công!`);
    setShowDeleteRowModal(false);
  };

  const handleDeleteColumnClick = () => {
    if (seatGrid.columns <= 1) {
      toast.error("Không thể xóa cột cuối cùng!");
      return;
    }
    setShowDeleteColumnModal(true);
  };

  const handleConfirmDeleteColumn = () => {
    onDeleteColumn(seatGrid.columns);
    toast.success(`Đã xóa cột ${seatGrid.columns} thành công!`);
    setShowDeleteColumnModal(false);
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
            {/* Toolbar with 5 control buttons */}
            <div className="seat-config-toolbar">
              <div className="toolbar-section">
                <span className="toolbar-section-title">THÊM MỚI</span>
                <button
                  type="button"
                  className="seat-control-btn add"
                  onClick={handleAddRowClick}
                  title="Thêm hàng mới vào cuối"
                >
                  + Hàng
                </button>
                <button
                  type="button"
                  className="seat-control-btn add"
                  onClick={handleAddColumnClick}
                  title="Thêm cột mới vào cuối"
                >
                  + Cột
                </button>
                <button
                  type="button"
                  className="seat-control-btn add"
                  onClick={() => setShowAddSeatModal(true)}
                  title="Thêm ghế vào hàng đã chọn"
                >
                  + Ghế
                </button>
              </div>
              <div className="toolbar-section">
                <span className="toolbar-section-title">XÓA</span>
                <button
                  type="button"
                  className="seat-control-btn delete"
                  onClick={handleDeleteRowClick}
                  title="Xóa hàng cuối cùng"
                >
                  - Hàng
                </button>
                <button
                  type="button"
                  className="seat-control-btn delete"
                  onClick={handleDeleteColumnClick}
                  title="Xóa cột cuối cùng"
                >
                  - Cột
                </button>
              </div>
            </div>

            {/* Screen indicator */}
            <div className="screen-indicator">
              <div className="screen-label">MÀN HÌNH CHIẾU</div>
              <div className="screen-line"></div>
            </div>

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
                            // Kiểm tra nếu ghế này là ghế thứ hai trong cặp đôi thì bỏ qua (không render)
                            if (isSecondInCouplePair(seat)) {
                              return null;
                            }

                            // Kiểm tra nếu ghế này là ghế đầu tiên trong cặp đôi
                            const isFirstInPair = isFirstInCouplePair(seat);
                            const pairSeat = isFirstInPair ? getCouplePairSeat(seat) : null;

                            return (
                              <div
                                key={seat.id}
                                className={`seat-cell ${(seat.type || 'standard').toLowerCase()} ${seat.status === "Deleted" ? "deleted" : ""} ${selectedSeat?.id === seat.id ? "selected" : ""} ${isFirstInPair ? 'couple-pair-first' : ''}`}
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
                                      // Toggle between Standard, VIP, and Couple
                                      const types = [
                                        "Standard",
                                        "VIP",
                                        "Couple",
                                      ];
                                      // Fallback to Standard if type is invalid/null
                                      const validType = types.includes(seat.type) ? seat.type : "Standard";
                                      const currentIndex = types.indexOf(validType);
                                      const newType =
                                        types[
                                          (currentIndex + 1) % types.length
                                        ];

                                      // Xử lý logic ghế đôi
                                      if (newType === 'Couple') {
                                        // Kiểm tra ghế liền kề
                                        const adjacentSeat = getAdjacentSeat(seat);
                                        if (!adjacentSeat) {
                                          toast.error(
                                            `Không thể chuyển ghế ${seat.row}${seat.number} sang Couple: Không có ghế liền kề bên phải!`
                                          );
                                          // Không return, cho phép chuyển sang type khác
                                          // Quay lại Standard thay vì Couple
                                          onUpdateSeatInGrid(seat.id, {
                                            type: 'Standard',
                                          });
                                          toast.info(
                                            `Đã chuyển ghế ${seat.row}${seat.number} sang Standard thay thế`
                                          );
                                          return;
                                        }
                                        if (adjacentSeat.type === 'Couple') {
                                          toast.error(
                                            `Không thể chuyển ghế ${seat.row}${seat.number} sang Couple: Ghế ${adjacentSeat.row}${adjacentSeat.number} đã là ghế đôi!`
                                          );
                                          // Không return, cho phép chuyển sang type khác
                                          // Quay lại Standard thay vì Couple
                                          onUpdateSeatInGrid(seat.id, {
                                            type: 'Standard',
                                          });
                                          toast.info(
                                            `Đã chuyển ghế ${seat.row}${seat.number} sang Standard thay thế`
                                          );
                                          return;
                                        }

                                        // Cập nhật cả 2 ghế thành Couple và link với nhau
                                        onUpdateSeatInGrid(seat.id, {
                                          type: 'Couple',
                                          couplePairId: adjacentSeat.id,
                                        });
                                        onUpdateSeatInGrid(adjacentSeat.id, {
                                          type: 'Couple',
                                          couplePairId: seat.id,
                                        });
                                        toast.success(
                                          `Đã chuyển ghế ${seat.row}${seat.number} và ${adjacentSeat.row}${adjacentSeat.number} sang Couple!`
                                        );
                                      } else if (seat.type === 'Couple' && newType !== 'Couple') {
                                        // Chuyển từ Couple sang Standard/VIP: Hủy liên kết ghế đôi
                                        const pairSeat = getCouplePairSeat(seat);
                                        if (pairSeat) {
                                          onUpdateSeatInGrid(pairSeat.id, {
                                            type: 'Standard',
                                            couplePairId: null,
                                          });
                                        }
                                        onUpdateSeatInGrid(seat.id, {
                                          type: newType,
                                          couplePairId: null,
                                        });
                                        toast.success(
                                          `Đã chuyển ghế ${seat.row}${seat.number} sang ${newType} và hủy liên kết ghế đôi!`
                                        );
                                      } else {
                                        // Chuyển đổi bình thường (Standard <-> VIP)
                                        onUpdateSeatInGrid(seat.id, {
                                          type: newType,
                                        });
                                        toast.success(
                                          `Đã chuyển ghế ${seat.row}${seat.number} sang ${newType}`,
                                        );
                                      }
                                    }
                                  }
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (seat.status === "Deleted") {
                                    // Second right-click on deleted seat - show permanent delete confirmation
                                    // Check if this is a new seat (not saved to database yet)
                                    if (seat.isNew || (seat.id && seat.id.startsWith('temp_'))) {
                                      // New seat - just remove from local state without calling API
                                      const updatedSeats = seatGrid.seats.filter(s => s.id !== seat.id);
                                      onSeatGridChange({
                                        ...seatGrid,
                                        seats: updatedSeats,
                                      });
                                      toast.success(
                                        `Đã xóa ghế ${seat.row}${seat.number}`,
                                      );
                                    } else {
                                      // Existing seat - show permanent delete confirmation modal
                                      onPermanentDeleteSeatClick(seat);
                                    }
                                  } else {
                                    // First right-click - hide the seat
                                    // Nếu là ghế đôi, cần cập nhật cả ghế pair
                                    if (seat.type === 'Couple' && seat.couplePairId) {
                                      const pairSeat = getCouplePairSeat(seat);
                                      if (pairSeat) {
                                        // Chuyển ghế pair về Standard và xóa liên kết
                                        onUpdateSeatInGrid(pairSeat.id, {
                                          type: 'Standard',
                                          couplePairId: null,
                                        });
                                        toast.info(
                                          `Đã hủy liên kết ghế đôi với ${pairSeat.row}${pairSeat.number}`
                                        );
                                      }
                                    }
                                    onUpdateSeatInGrid(seat.id, {
                                      status: "Deleted",
                                      couplePairId: null,
                                    });
                                    toast.success(
                                      `Đã ẩn ghế ${seat.row}${seat.number}`,
                                    );
                                  }
                                }}
                                title={`${seat.row}${seat.number}${isFirstInPair && pairSeat ? ` - ${pairSeat.row}${pairSeat.number}` : ''} - ${seat.type} - ${seat.status === "Deleted" ? "Đã xóa (Click để khôi phục)" : seat.status === "Available" ? "Còn trống" : "Đã đặt"}\nClick trái: Chuyển Standard ↔ VIP ↔ Couple\nClick phải: Ẩn ghế\nClick phải 2 lần: Xóa vĩnh viễn`}
                              >
                                {seat.status === "Deleted" ? (
                                  <span className="seat-deleted-x">×</span>
                                ) : (
                                  <span className="seat-number">
                                    {seat.row}{seat.number}{isFirstInPair && pairSeat ? `-${pairSeat.row}${pairSeat.number}` : ''}
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
                <div className="legend-color couple"></div>
                <span>Couple</span>
              </div>
              <div className="legend-item">
                <div className="legend-color deleted"></div>
                <span>Đã ẩn</span>
              </div>
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
                  Couple
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

        {/* Add Seat Modal */}
        {showAddSeatModal && (
          <div className="modal-overlay" onClick={() => setShowAddSeatModal(false)}>
            <div className="modal-content add-seat-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Thêm ghế mới</h3>
                <button className="modal-close" onClick={() => setShowAddSeatModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Hàng:</label>
                  <select
                    className="form-control"
                    value={selectedRowForAdd}
                    onChange={(e) => setSelectedRowForAdd(e.target.value)}
                  >
                    <option value="">Chọn hàng</option>
                    {getRowLabels().map((row) => (
                      <option key={row} value={row}>
                        Hàng {row}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Số ghế muốn thêm:</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="10"
                    value={seatCountToAdd}
                    onChange={(e) => setSeatCountToAdd(parseInt(e.target.value) || 1)}
                  />
                  <small className="form-text text-muted">
                    Ghế sẽ được thêm vào cuối hàng đã chọn.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddSeatModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmAddSeats}
                  disabled={!selectedRowForAdd || seatCountToAdd < 1}
                >
                  Thêm ghế
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Row Modal */}
        {showDeleteRowModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteRowModal(false)}>
            <div className="modal-content delete-row-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Xác nhận xóa hàng</h3>
                <button className="modal-close" onClick={() => setShowDeleteRowModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc muốn xóa hàng <strong className="row-info">{String.fromCharCode(65 + seatGrid.rows - 1)}</strong>?</p>
                <p className="seat-count">
                  Hàng này nằm ở ngoài cùng và sẽ bị xóa vĩnh viễn.
                </p>
                <p className="seat-count">
                  Tất cả ghế trong hàng này sẽ bị xóa.
                </p>
                <p className="warning-text">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteRowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDeleteRow}
                >
                  Xóa hàng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Column Modal */}
        {showDeleteColumnModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteColumnModal(false)}>
            <div className="modal-content delete-column-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Xác nhận xóa cột</h3>
                <button className="modal-close" onClick={() => setShowDeleteColumnModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc muốn xóa cột <strong className="column-info">{seatGrid.columns}</strong>?</p>
                <p className="seat-count">
                  Tất cả ghế trong cột này sẽ bị xóa.
                </p>
                <p className="warning-text">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteColumnModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDeleteColumn}
                >
                  Xóa cột
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatConfigModal;
