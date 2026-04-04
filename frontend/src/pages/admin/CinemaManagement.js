import React, { useState, useEffect, useCallback } from "react";
import {
  getCinemaById,
  updateCinema,
  getRoomsByCinema,
  getAllMovies,
  createRoom,
  updateRoom,
  deleteRoom,
  generateSeatLayout,
  getSeatsByRoom,
  updateSeat,
  deleteSeat,
  addSeat,
} from "../../services/api";
import { toast } from "react-toastify";
import "./AdminManagement.css";

// Import components
import CinemaModal from "./components/CinemaModal";
import RoomModal from "./components/RoomModal";
import TimeSlotsModal from "./components/TimeSlotsModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import SeatConfigModal from "./components/SeatConfigModal";
import SeatDeleteConfirmModal from "./components/SeatDeleteConfirmModal";
import SeatPermanentDeleteConfirmModal from "./components/SeatPermanentDeleteConfirmModal";
import RoomTable from "./components/RoomTable";

// ID của rạp Time Cinemas (hardcoded theo DB)
const TIME_CINEMAS_ID = "69ad9a89012ada8e95feb9cf";

// Format date as dd/mm/yyyy
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const CinemaManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCinemaModal, setShowCinemaModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingCinema, setEditingCinema] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [cinemaRooms, setCinemaRooms] = useState([]);
  const [movies, setMovies] = useState([]);

  // Form data states
  const [cinemaFormData, setCinemaFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    description: "",
    status: "Active",
  });

  const [roomFormData, setRoomFormData] = useState({
    cinemaId: "",
    name: "",
    type: "Standard",
    movieId: "",
    startTime: "",
    price: "",
    timeSlots: [],
    description: "",
    status: "Active",
  });

  // Time slots modal state
  const [showTimeSlotsModal, setShowTimeSlotsModal] = useState(false);
  const [editingTimeSlotsRoom, setEditingTimeSlotsRoom] = useState(null);
  const [timeSlotsInput, setTimeSlotsInput] = useState("");

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Seat management state
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomSeats, setRoomSeats] = useState([]);
  const [showSeatDeleteConfirm, setShowSeatDeleteConfirm] = useState(false);
  const [deletingSeatId, setDeletingSeatId] = useState(null);
  const [isSeatDeleting, setIsSeatDeleting] = useState(false);

  // Permanent seat deletion state
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [permanentDeletingSeat, setPermanentDeletingSeat] = useState(null);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  // Grid-based seat configuration state
  const [seatGrid, setSeatGrid] = useState({
    rows: 5,
    columns: 10,
    seats: [],
  });
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [originalSeats, setOriginalSeats] = useState([]);

  // Memoized API calls
  const fetchMovies = useCallback(async () => {
    try {
      const data = await getAllMovies();
      setMovies(data);
    } catch (err) {
      console.error("Error fetching movies:", err);
    }
  }, []);

  const fetchTimeCinemas = useCallback(async () => {
    try {
      setLoading(true);
      const cinema = await getCinemaById(TIME_CINEMAS_ID);
      setSelectedCinema(cinema);
      setError("");
    } catch (err) {
      setError("Failed to load cinema");
      console.error("Error fetching cinema:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRooms = useCallback(async (cinemaId) => {
    try {
      const roomsData = await getRoomsByCinema(cinemaId);
      setCinemaRooms(roomsData);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchTimeCinemas();
    fetchMovies();
  }, [fetchTimeCinemas, fetchMovies]);

  // Fetch rooms when cinema changes
  useEffect(() => {
    if (selectedCinema?._id) {
      fetchRooms(selectedCinema._id);
    }
  }, [selectedCinema, fetchRooms]);

  // Memoized helpers
  const getAssignedMovieIds = useCallback((currentRoomId) => {
    const assignedIds = [];
    cinemaRooms.forEach((room) => {
      if (currentRoomId === null || currentRoomId === undefined) {
        if (room.movieId) {
          assignedIds.push(room.movieId);
        }
      } else if (room._id !== currentRoomId && room.movieId) {
        assignedIds.push(room.movieId);
      }
    });
    return assignedIds;
  }, [cinemaRooms]);

  const getAvailableMovies = useCallback((currentRoomId) => {
    const assignedIds = getAssignedMovieIds(currentRoomId);
    return movies.filter((movie) => !assignedIds.includes(movie._id));
  }, [movies, getAssignedMovieIds]);

  // Initial data fetch
  useEffect(() => {
    fetchTimeCinemas();
    fetchMovies();
  }, [fetchTimeCinemas, fetchMovies]);

  // Fetch rooms when cinema changes
  useEffect(() => {
    if (selectedCinema?._id) {
      fetchRooms(selectedCinema._id);
    }
  }, [selectedCinema, fetchRooms]);

  const getMovieForRoom = useCallback((room) => {
    const movieId = room.movieId;
    if (!movieId) return null;
    if (typeof movieId === "object") return movieId;
    return movies.find((m) => m._id === movieId) || null;
  }, [movies]);

  const handleCinemaInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCinemaFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRoomInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setRoomFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Validate endDate must be after startTime
  const validateEndDate = useCallback((movieId, startTime) => {
    if (!movieId || !startTime) return { valid: true, message: "" };

    const selectedMovie = movies.find((m) => m._id === movieId);
    if (!selectedMovie || !selectedMovie.endDate)
      return { valid: true, message: "" };

    const startDate = new Date(startTime);
    const movieReleaseDate = selectedMovie.releaseDate
      ? new Date(selectedMovie.releaseDate)
      : null;
    const movieEndDate = new Date(selectedMovie.endDate);

    const startDateOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const endDateOnly = new Date(
      movieEndDate.getFullYear(),
      movieEndDate.getMonth(),
      movieEndDate.getDate(),
    );

    if (movieReleaseDate) {
      const releaseDateOnly = new Date(
        movieReleaseDate.getFullYear(),
        movieReleaseDate.getMonth(),
        movieReleaseDate.getDate(),
      );
      if (startDateOnly < releaseDateOnly) {
        const releaseStr = formatDate(selectedMovie.releaseDate);
        const startDateStr = formatDate(startTime);
        return {
          valid: false,
          message: `Không thể chọn ngày chiếu (${startDateStr}) trước ngày khởi chiếu (${releaseStr})`,
        };
      }
    }

    if (startDateOnly > endDateOnly) {
      const endDateStr = formatDate(selectedMovie.endDate);
      const startDateStr = formatDate(startTime);
      return {
        valid: false,
        message: `Không thể chọn ngày chiếu (${startDateStr}) sau ngày kết thúc chiếu phim (${endDateStr})`,
      };
    }
    return { valid: true, message: "" };
  }, [movies]);

  const handleSaveTimeSlots = async () => {
    try {
      // Parse time slots from input (comma separated)
      const slotsArray = timeSlotsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && /^\d{1,2}:\d{2}$/.test(s));

      await updateRoom(editingTimeSlotsRoom._id, { timeSlots: slotsArray });
      await fetchRooms(selectedCinema._id);
      setShowTimeSlotsModal(false);
      setEditingTimeSlotsRoom(null);
      toast.success("Cập nhật khung giờ chiếu thành công!");
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi lưu khung giờ";
      toast.error(errorMsg);
    }
  };

  const closeTimeSlotsModal = () => {
    setShowTimeSlotsModal(false);
    setEditingTimeSlotsRoom(null);
    setTimeSlotsInput("");
  };

  const handleCinemaSubmit = async (e) => {
    e.preventDefault();
    try {
      const cinemaData = { ...cinemaFormData };
      await updateCinema(TIME_CINEMAS_ID, cinemaData);
      await fetchTimeCinemas();
      closeCinemaModal();
      toast.success("Cập nhật thông tin rạp thành công!");
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi lưu thông tin rạp";
      toast.error(errorMsg);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();

    // Validate endDate if movie and startTime are selected
    if (roomFormData.movieId && roomFormData.startTime) {
      const validation = validateEndDate(
        roomFormData.movieId,
        roomFormData.startTime,
      );
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
    }

    try {
      const roomData = {
        cinemaId: roomFormData.cinemaId,
        name: roomFormData.name,
        type: roomFormData.type,
        timeSlots: roomFormData.timeSlots || [],
        description: roomFormData.description,
        status: roomFormData.status,
        // Lưu thông tin phim đang chiếu trực tiếp vào room
        movieId: roomFormData.movieId || null,
        startTime: roomFormData.startTime || null,
        price: roomFormData.price ? parseInt(roomFormData.price) : null,
      };

      let savedRoom;
      if (editingRoom) {
        savedRoom = await updateRoom(editingRoom._id, roomData);
        toast.success("Cập nhật phòng chiếu thành công!");
      } else {
        savedRoom = await createRoom(roomData);
        toast.success("Thêm phòng chiếu mới thành công!");
      }

      // Refresh rooms and movies to show updated data
      await Promise.all([
        fetchRooms(roomFormData.cinemaId),
        fetchMovies()
      ]);
      closeRoomModal();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi lưu phòng chiếu";
      toast.error(errorMsg);
    }
  };

  const handleEditCinema = (cinema) => {
    setEditingCinema(cinema);
    setCinemaFormData({
      name: cinema.name || "",
      address: cinema.address || "",
      city: cinema.city || "",
      phone: cinema.phone || "",
      email: cinema.email || "",
      description: cinema.description || "",
      status: cinema.status || "Active",
    });
    setShowCinemaModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      cinemaId: room.cinemaId || selectedCinema._id,
      name: room.name || "",
      type: room.type || "Standard",
      movieId: room.movieId || "",
      startTime: room.startTime || "",
      price: room.price || "",
      timeSlots: room.timeSlots || [],
      description: room.description || "",
      status: room.status || "Active",
    });
    setShowRoomModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingRoomId(id);
    setShowDeleteConfirm(true);
  };

  const handleGenerateSeats = async (room) => {
    try {
      await generateSeatLayout(room._id);
      toast.success(`Tạo bố cục ghế thành công cho phòng ${room.name}!`);
      // Refresh rooms
      await fetchRooms(selectedCinema._id);
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi tạo bố cục ghế";
      toast.error(errorMsg);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!deletingRoomId || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteRoom(deletingRoomId);
      await fetchRooms(selectedCinema._id);
      toast.success("Xóa phòng chiếu thành công!");
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi xóa phòng chiếu";
      toast.error(errorMsg);
    } finally {
      setShowDeleteConfirm(false);
      setDeletingRoomId(null);
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingRoomId(null);
  };

  // Seat management functions
  const fetchRoomSeats = async (room) => {
    try {
      const data = await getSeatsByRoom(room._id);
      setRoomSeats(data.seats || []);
      setSelectedRoom(room);
      setShowSeatModal(true);
    } catch (err) {
      const errorMsg = err?.message || "Có lỗi xảy ra khi tải danh sách ghế";
      toast.error(errorMsg);
    }
  };

  const confirmDeleteSeat = async () => {
    if (!deletingSeatId || isSeatDeleting) return;

    setIsSeatDeleting(true);

    try {
      await deleteSeat(deletingSeatId);
      // Refresh seats
      const data = await getSeatsByRoom(selectedRoom._id);
      setRoomSeats(data.seats || []);
      toast.success("Ẩn ghế thành công!");
    } catch (err) {
      const errorMsg = err?.message || "Có lỗi xảy ra khi xóa ghế";
      toast.error(errorMsg);
    } finally {
      setShowSeatDeleteConfirm(false);
      setDeletingSeatId(null);
      setIsSeatDeleting(false);
    }
  };

  const cancelSeatDelete = () => {
    setShowSeatDeleteConfirm(false);
    setDeletingSeatId(null);
  };

  // Permanent seat deletion functions
  const handlePermanentDeleteSeatClick = (seat) => {
    setPermanentDeletingSeat(seat);
    setShowPermanentDeleteConfirm(true);
  };

  const confirmPermanentDeleteSeat = async () => {
    if (!permanentDeletingSeat || isPermanentDeleting) return;

    setIsPermanentDeleting(true);

    try {
      await deleteSeat(permanentDeletingSeat.id);
      // Remove seat from grid
      setSeatGrid((prev) => ({
        ...prev,
        seats: prev.seats.filter((seat) => seat.id !== permanentDeletingSeat.id),
      }));
      // Refresh seats
      const data = await getSeatsByRoom(selectedRoom._id);
      setRoomSeats(data.seats || []);
      toast.success("Đã xóa ghế vĩnh viễn!");
    } catch (err) {
      const errorMsg = err?.message || "Có lỗi xảy ra khi xóa ghế";
      toast.error(errorMsg);
    } finally {
      setShowPermanentDeleteConfirm(false);
      setPermanentDeletingSeat(null);
      setIsPermanentDeleting(false);
    }
  };

  const cancelPermanentDeleteSeat = () => {
    setShowPermanentDeleteConfirm(false);
    setPermanentDeletingSeat(null);
  };


  const closeSeatModal = () => {
    setShowSeatModal(false);
    setSelectedRoom(null);
    setRoomSeats([]);
    setSelectedSeat(null);
    setSeatGrid({ rows: 5, columns: 10, seats: [] });
  };

  // Add new row to seat grid
  const handleAddRow = () => {
    setSeatGrid((prev) => {
      const newRowLabel = String.fromCharCode(65 + prev.rows);
      const newSeats = [];
      
      // Create seats for the new row
      for (let c = 1; c <= prev.columns; c++) {
        newSeats.push({
          id: `temp_${newRowLabel}${c}`,
          row: newRowLabel,
          number: c,
          type: "Standard",
          status: "Available",
          isNew: true,
          isModified: false,
        });
      }
      
      return {
        ...prev,
        rows: prev.rows + 1,
        seats: [...prev.seats, ...newSeats],
      };
    });
  };

  // Add new column to seat grid
  const handleAddColumn = () => {
    setSeatGrid((prev) => {
      const newSeats = [];
      const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      
      // Create seats for the new column in each row
      for (let r = 0; r < prev.rows; r++) {
        const rowLabel = rowLabels[r];
        newSeats.push({
          id: `temp_${rowLabel}${prev.columns + 1}`,
          row: rowLabel,
          number: prev.columns + 1,
          type: "Standard",
          status: "Available",
          isNew: true,
          isModified: false,
        });
      }
      
      return {
        ...prev,
        columns: prev.columns + 1,
        seats: [...prev.seats, ...newSeats],
      };
    });
  };

  // Delete last row from seat grid
  const handleDeleteRow = (rowLabel) => {
    setSeatGrid((prev) => ({
      ...prev,
      rows: prev.rows - 1,
      seats: prev.seats.filter((seat) => seat.row !== rowLabel),
    }));
  };

  // Delete last column from seat grid
  const handleDeleteColumn = (columnNumber) => {
    setSeatGrid((prev) => ({
      ...prev,
      columns: prev.columns - 1,
      seats: prev.seats.filter((seat) => seat.number !== columnNumber),
    }));
  };

  // Initialize seat grid from existing seats
  const initializeSeatGrid = (seats, rows = 5, columns = 10) => {
    const grid = [];
    const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // If no seats exist, create empty grid with default size
    if (!seats || seats.length === 0) {
      for (let r = 0; r < rows; r++) {
        const rowLabel = rowLabels[r];
        for (let c = 1; c <= columns; c++) {
          grid.push({
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
      return grid;
    }

    // Calculate grid size based on actual seats
    const maxRow = Math.max(...seats.map((s) => s.row.charCodeAt(0) - 65)) + 1;
    const maxCol = Math.max(...seats.map((s) => s.number));
    const actualRows = Math.max(rows, maxRow);
    const actualCols = Math.max(columns, maxCol);

    // Create grid only for positions that have seats
    for (let r = 0; r < actualRows; r++) {
      const rowLabel = rowLabels[r];
      for (let c = 1; c <= actualCols; c++) {
        const existingSeat = seats.find(
          (s) => s.row === rowLabel && s.number === c,
        );
        // Only add seat if it exists in database
        if (existingSeat) {
          grid.push({
            id: existingSeat._id,
            row: rowLabel,
            number: c,
            type: existingSeat.type || "Standard",
            status: existingSeat.status || "Available",
            couplePairId: existingSeat.couplePairId || null,
            isNew: false,
            isModified: false,
          });
        }
      }
    }

    return grid;
  };

  // Update seat type or status
  const handleUpdateSeatInGrid = (seatId, updates) => {
    setSeatGrid((prev) => ({
      ...prev,
      seats: prev.seats.map((seat) =>
        seat.id === seatId ? { ...seat, ...updates, isModified: true } : seat,
      ),
    }));

    if (selectedSeat && selectedSeat.id === seatId) {
      setSelectedSeat((prev) => ({ ...prev, ...updates }));
    }
  };

  // Select seat for configuration
  const handleSelectSeat = (seat) => {
    setSelectedSeat(seat);
  };

  // Save all seat changes
  const handleSaveAllSeats = async () => {
    if (!selectedRoom) return;

    try {
      const currentSeats = seatGrid.seats;
      const originalIds = originalSeats.map((s) => s._id);

      // Find seats to create, update, or delete
      const toCreate = currentSeats.filter((s) => s.isNew);
      const toUpdate = currentSeats.filter((s) => !s.isNew && s.isModified);
      const toDelete = originalSeats.filter(
        (orig) => !currentSeats.find((curr) => curr.id === orig._id),
      );

      // Execute batch operations
      const promises = [];

      // Create new seats
      for (const seat of toCreate) {
        promises.push(
          addSeat(selectedRoom._id, {
            row: seat.row,
            number: seat.number,
            type: seat.type,
            status: seat.status,
            couplePairId: seat.couplePairId || null,
          }),
        );
      }

      // Update modified seats
      for (const seat of toUpdate) {
        promises.push(
          updateSeat(seat.id, {
            row: seat.row,
            number: seat.number,
            type: seat.type,
            status: seat.status,
            couplePairId: seat.couplePairId || null,
          }),
        );
      }

      // Delete removed seats
      for (const seat of toDelete) {
        promises.push(deleteSeat(seat._id));
      }

      await Promise.all(promises);

      // Refresh seats
      const data = await getSeatsByRoom(selectedRoom._id);
      setRoomSeats(data.seats || []);

      // Update cinemaRooms state to reflect new seat count without reload
      setCinemaRooms((prevRooms) =>
        prevRooms.map((room) =>
          room._id === selectedRoom._id
            ? { ...room, seats: data.seats || [] }
            : room
        )
      );

      toast.success("Đã lưu cấu hình ghế thành công!");
      closeSeatModal();
    } catch (err) {
      const errorMsg = err?.message || "Có lỗi xảy ra khi lưu cấu hình ghế";
      toast.error(errorMsg);
    }
  };

  // Open seat config modal with grid
  const openSeatConfigModal = async (room) => {
    try {
      const data = await getSeatsByRoom(room._id);
      const seats = data.seats || [];

      setRoomSeats(seats);
      setSelectedRoom(room);
      setOriginalSeats(seats);

      // Initialize grid based on actual seats
      const grid = initializeSeatGrid(seats, 5, 10);

      // Calculate actual grid size from the grid
      const maxRow =
        grid.length > 0
          ? Math.max(...grid.map((s) => s.row.charCodeAt(0) - 65)) + 1
          : 5;
      const maxCol =
        grid.length > 0 ? Math.max(...grid.map((s) => s.number)) : 10;

      setSeatGrid({
        rows: Math.max(5, maxRow),
        columns: Math.max(10, maxCol),
        seats: grid,
      });


      setShowSeatModal(true);
    } catch (err) {
      const errorMsg = err?.message || "Có lỗi xảy ra khi tải danh sách ghế";
      toast.error(errorMsg);
    }
  };

  const closeCinemaModal = () => {
    setShowCinemaModal(false);
    setEditingCinema(null);
  };

  const openAddRoomModal = () => {
    if (!selectedCinema) {
      toast.error("Vui lòng chọn một rạp trước");
      return;
    }
    setEditingRoom(null);
    setRoomFormData({
      cinemaId: selectedCinema._id,
      name: "",
      capacity: "",
      type: "Standard",
      movieId: "",
      startTime: "",
      price: "",
      timeSlots: [],
      description: "",
      status: "Active",
    });
    setShowRoomModal(true);
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    setEditingRoom(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý Rạp & Phòng Chiếu</h2>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {selectedCinema && (
        <div className="rooms-section">
          <div className="section-header">
            <div>
              <h3>Phòng chiếu - {selectedCinema.name}</h3>
              <p className="cinema-address">
                {selectedCinema.address}, {selectedCinema.city}
              </p>
            </div>
            <div>
              <button className="btn btn-primary" onClick={openAddRoomModal}>
                + Thêm Phòng Mới
              </button>
            </div>
          </div>

          <RoomTable
            rooms={cinemaRooms}
            movies={movies}
            getMovieForRoom={getMovieForRoom}
            onEditRoom={handleEditRoom}
            onDeleteClick={handleDeleteClick}
            onOpenSeatConfig={openSeatConfigModal}
          />
        </div>
      )}

      {/* Cinema Modal */}
      <CinemaModal
        show={showCinemaModal}
        editingCinema={editingCinema}
        formData={cinemaFormData}
        onInputChange={handleCinemaInputChange}
        onSubmit={handleCinemaSubmit}
        onClose={closeCinemaModal}
      />

      {/* Room Modal */}
      <RoomModal
        show={showRoomModal}
        editingRoom={editingRoom}
        formData={roomFormData}
        movies={movies}
        getAvailableMovies={getAvailableMovies}
        onInputChange={handleRoomInputChange}
        onSubmit={handleRoomSubmit}
        onClose={closeRoomModal}
      />

      {/* Time Slots Modal */}
      <TimeSlotsModal
        show={showTimeSlotsModal}
        editingRoom={editingTimeSlotsRoom}
        timeSlotsInput={timeSlotsInput}
        onTimeSlotsInputChange={setTimeSlotsInput}
        onSave={handleSaveTimeSlots}
        onClose={closeTimeSlotsModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={showDeleteConfirm}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteRoom}
        onCancel={cancelDelete}
      />

      {/* Seat Configuration Modal */}
      <SeatConfigModal
        show={showSeatModal}
        selectedRoom={selectedRoom}
        seatGrid={seatGrid}
        selectedSeat={selectedSeat}
        onClose={closeSeatModal}
        onSeatGridChange={setSeatGrid}
        onSeatSelect={handleSelectSeat}
        onUpdateSeatInGrid={handleUpdateSeatInGrid}
        onPermanentDeleteSeatClick={handlePermanentDeleteSeatClick}
        onSaveAllSeats={handleSaveAllSeats}
        onAddRow={handleAddRow}
        onAddColumn={handleAddColumn}
        onDeleteRow={handleDeleteRow}
        onDeleteColumn={handleDeleteColumn}
      />

      {/* Seat Delete Confirmation Modal */}
      <SeatDeleteConfirmModal
        show={showSeatDeleteConfirm}
        isDeleting={isSeatDeleting}
        onConfirm={confirmDeleteSeat}
        onCancel={cancelSeatDelete}
      />

      {/* Permanent Seat Delete Confirmation Modal */}
      <SeatPermanentDeleteConfirmModal
        show={showPermanentDeleteConfirm}
        seat={permanentDeletingSeat}
        isDeleting={isPermanentDeleting}
        onConfirm={confirmPermanentDeleteSeat}
        onCancel={cancelPermanentDeleteSeat}
      />
    </div>
  );
};

export default CinemaManagement;
