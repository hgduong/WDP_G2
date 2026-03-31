import React, { useState, useEffect } from 'react';
import { 
  getCinemaById, 
  updateCinema,
  getRoomsByCinema,
  getShowtimesByCinema,
  getAllMovies,
  createShowtime,
  createRoom,
  updateRoom,
  deleteRoom,
  generateSeatLayout,
  getSeatsByRoom,
  updateSeat,
  deleteSeat,
  addSeat
} from '../../services/api';
import { toast } from 'react-toastify';
import './AdminManagement.css';

// ID của rạp Time Cinemas (hardcoded theo DB)
const TIME_CINEMAS_ID = '69ad9a89012ada8e95feb9cf';

const ROOM_TYPES = ['Standard', 'VIP', 'IMAX'];

// Format date as dd/mm/yyyy
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const CinemaManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCinemaModal, setShowCinemaModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingCinema, setEditingCinema] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [cinemaRooms, setCinemaRooms] = useState([]);
  const [cinemaShowtimes, setCinemaShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
   
  const [cinemaFormData, setCinemaFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    description: '',
    status: 'Active'
  });

  const [roomFormData, setRoomFormData] = useState({
    cinemaId: '',
    name: '',
    capacity: '',
    type: 'Standard',
    movieId: '',
    startTime: '',
    price: '',
    timeSlots: [],
    description: '',
    status: 'Active'
  });

  const [showTimeSlotsModal, setShowTimeSlotsModal] = useState(false);
  const [editingTimeSlotsRoom, setEditingTimeSlotsRoom] = useState(null);
  const [timeSlotsInput, setTimeSlotsInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Seat management state
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomSeats, setRoomSeats] = useState([]);
  const [editingSeat, setEditingSeat] = useState(null);
  const [seatFormData, setSeatFormData] = useState({
    row: '',
    number: '',
    type: 'Standard'
  });
  const [showSeatDeleteConfirm, setShowSeatDeleteConfirm] = useState(false);
  const [deletingSeatId, setDeletingSeatId] = useState(null);
  const [isSeatDeleting, setIsSeatDeleting] = useState(false);

  useEffect(() => {
    fetchTimeCinemas();
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const data = await getAllMovies();
      setMovies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedCinema) {
      fetchRooms(selectedCinema._id);
    }
  }, [selectedCinema]);

  const fetchTimeCinemas = async () => {
    try {
      setLoading(true);
      const cinema = await getCinemaById(TIME_CINEMAS_ID);
      setSelectedCinema(cinema);
      setError('');
    } catch (err) {
      setError('Failed to load cinema');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (cinemaId) => {
    try {
      const [roomsData, showtimesData] = await Promise.all([
        getRoomsByCinema(cinemaId),
        getShowtimesByCinema(cinemaId)
      ]);
      setCinemaRooms(roomsData);
      setCinemaShowtimes(showtimesData);
    } catch (err) {
      console.error(err);
    }
  };

  // Lấy danh sách movieId đã được chọn bởi các phòng khác
  const getAssignedMovieIds = (currentRoomId) => {
    const assignedIds = [];
    cinemaRooms.forEach(room => {
      // Khi thêm mới (currentRoomId là null/undefined), lấy tất cả các phòng có movie
      // Khi sửa, bỏ qua phòng hiện tại
      if (currentRoomId === null || currentRoomId === undefined) {
        if (room.movieId) {
          assignedIds.push(room.movieId);
        }
      } else if (room._id !== currentRoomId && room.movieId) {
        assignedIds.push(room.movieId);
      }
    });
    return assignedIds;
  };

  // Lọc movies để loại trừ phim đã được chọn bởi phòng khác
  const getAvailableMovies = (currentRoomId) => {
    const assignedIds = getAssignedMovieIds(currentRoomId);
    return movies.filter(movie => !assignedIds.includes(movie._id));
  };

  // Lấy phim đang chiếu trong phòng - từ movieId trong room
  const getMovieForRoom = (room) => {
    const movieId = room.movieId;
    if (!movieId) return null;
    if (typeof movieId === 'object') return movieId;
    return movies.find(m => m._id === movieId) || null;
  };

  const handleCinemaInputChange = (e) => {
    const { name, value } = e.target;
    setCinemaFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoomInputChange = (e) => {
    const { name, value } = e.target;
    setRoomFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate endDate must be after startTime
  const validateEndDate = (movieId, startTime) => {
    if (!movieId || !startTime) return { valid: true, message: '' };
    
    const selectedMovie = movies.find(m => m._id === movieId);
    if (!selectedMovie || !selectedMovie.endDate) return { valid: true, message: '' };
    
    const startDate = new Date(startTime);
    const movieReleaseDate = selectedMovie.releaseDate ? new Date(selectedMovie.releaseDate) : null;
    const movieEndDate = new Date(selectedMovie.endDate);
    
    // Get just the date parts (year, month, day) for comparison
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(movieEndDate.getFullYear(), movieEndDate.getMonth(), movieEndDate.getDate());
    
    // Validate: showtime cannot be BEFORE the movie's releaseDate
    if (movieReleaseDate) {
      const releaseDateOnly = new Date(movieReleaseDate.getFullYear(), movieReleaseDate.getMonth(), movieReleaseDate.getDate());
      if (startDateOnly < releaseDateOnly) {
        const releaseStr = formatDate(selectedMovie.releaseDate);
        const startDateStr = formatDate(startTime);
        return {
          valid: false,
          message: `Không thể chọn ngày chiếu (${startDateStr}) trước ngày khởi chiếu (${releaseStr})`
        };
      }
    }
    
    // Validate: showtime cannot be AFTER the movie's endDate
    if (startDateOnly > endDateOnly) {
      const endDateStr = formatDate(selectedMovie.endDate);
      const startDateStr = formatDate(startTime);
      return {
        valid: false,
        message: `Không thể chọn ngày chiếu (${startDateStr}) sau ngày kết thúc chiếu phim (${endDateStr})`
      };
    }
    return { valid: true, message: '' };
  };

  const handleEditTimeSlots = (room) => {
    setEditingTimeSlotsRoom(room);
    const slots = room.timeSlots || [];
    setTimeSlotsInput(slots.join(', '));
    setShowTimeSlotsModal(true);
  };

  const handleSaveTimeSlots = async () => {
    try {
      // Parse time slots from input (comma separated)
      const slotsArray = timeSlotsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s && /^\d{1,2}:\d{2}$/.test(s));

      await updateRoom(editingTimeSlotsRoom._id, { timeSlots: slotsArray });
      await fetchRooms(selectedCinema._id);
      setShowTimeSlotsModal(false);
      setEditingTimeSlotsRoom(null);
      toast.success('Cập nhật khung giờ chiếu thành công!');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu khung giờ';
      toast.error(errorMsg);
    }
  };

  const closeTimeSlotsModal = () => {
    setShowTimeSlotsModal(false);
    setEditingTimeSlotsRoom(null);
    setTimeSlotsInput('');
  };

  const handleCinemaSubmit = async (e) => {
    e.preventDefault();
    try {
      const cinemaData = { ...cinemaFormData };
      await updateCinema(TIME_CINEMAS_ID, cinemaData);
      await fetchTimeCinemas();
      closeCinemaModal();
      toast.success('Cập nhật thông tin rạp thành công!');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu thông tin rạp';
      toast.error(errorMsg);
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    
    // Validate endDate if movie and startTime are selected
    if (roomFormData.movieId && roomFormData.startTime) {
      const validation = validateEndDate(roomFormData.movieId, roomFormData.startTime);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
    }
    
    try {
      const roomData = {
        cinemaId: roomFormData.cinemaId,
        name: roomFormData.name,
        capacity: parseInt(roomFormData.capacity),
        type: roomFormData.type,
        timeSlots: roomFormData.timeSlots || [],
        description: roomFormData.description,
        status: roomFormData.status,
        // Lưu thông tin phim đang chiếu trực tiếp vào room
        movieId: roomFormData.movieId || null,
        startTime: roomFormData.startTime || null,
        price: roomFormData.price ? parseInt(roomFormData.price) : null
      };
      
      let savedRoom;
      if (editingRoom) {
        savedRoom = await updateRoom(editingRoom._id, roomData);
        toast.success('Cập nhật phòng chiếu thành công!');
      } else {
        savedRoom = await createRoom(roomData);
        toast.success('Thêm phòng chiếu mới thành công!');
      }
      
      // Refresh rooms to show updated data
      await fetchRooms(roomFormData.cinemaId);
      closeRoomModal();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu phòng chiếu';
      toast.error(errorMsg);
    }
  };

  const handleEditCinema = (cinema) => {
    setEditingCinema(cinema);
    setCinemaFormData({
      name: cinema.name || '',
      address: cinema.address || '',
      city: cinema.city || '',
      phone: cinema.phone || '',
      email: cinema.email || '',
      description: cinema.description || '',
      status: cinema.status || 'Active'
    });
    setShowCinemaModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      cinemaId: room.cinemaId || selectedCinema._id,
      name: room.name || '',
      capacity: room.capacity || '',
      type: room.type || 'Standard',
      movieId: room.movieId || '',
      startTime: room.startTime || '',
      price: room.price || '',
      timeSlots: room.timeSlots || [],
      description: room.description || '',
      status: room.status || 'Active'
    });
    setShowRoomModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingRoomId(id);
    setShowDeleteConfirm(true);
  };

  const handleGenerateSeats = async (room) => {
    if (!room.capacity) {
      toast.error('Vui lòng nhập số ghế cho phòng trước');
      return;
    }
    
    try {
      await generateSeatLayout(room._id, room.capacity);
      toast.success(`Tạo bố cục ghế thành công cho phòng ${room.name}!`);
      // Refresh rooms
      await fetchRooms(selectedCinema._id);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo bố cục ghế';
      toast.error(errorMsg);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!deletingRoomId || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      await deleteRoom(deletingRoomId);
      await fetchRooms(selectedCinema._id);
      toast.success('Xóa phòng chiếu thành công!');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xóa phòng chiếu';
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
      const errorMsg = err?.message || 'Có lỗi xảy ra khi tải danh sách ghế';
      toast.error(errorMsg);
    }
  };

  const handleSeatInputChange = (e) => {
    const { name, value } = e.target;
    setSeatFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSeat = (seat) => {
    setEditingSeat(seat);
    setSeatFormData({
      row: seat.row || '',
      number: seat.number || '',
      type: seat.type || 'Standard'
    });
  };

  const handleSeatSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSeat) {
        await updateSeat(editingSeat._id, seatFormData);
        toast.success('Cập nhật ghế thành công!');
      } else {
        await addSeat(selectedRoom._id, seatFormData);
        toast.success('Thêm ghế mới thành công!');
      }
      // Refresh seats
      const data = await getSeatsByRoom(selectedRoom._id);
      setRoomSeats(data.seats || []);
      closeSeatModal();
    } catch (err) {
      const errorMsg = err?.message || 'Có lỗi xảy ra khi lưu ghế';
      toast.error(errorMsg);
    }
  };

  const handleDeleteSeatClick = (seatId) => {
    setDeletingSeatId(seatId);
    setShowSeatDeleteConfirm(true);
  };

  const confirmDeleteSeat = async () => {
    if (!deletingSeatId || isSeatDeleting) return;
    
    setIsSeatDeleting(true);
    
    try {
      await deleteSeat(deletingSeatId);
      // Refresh seats
      const data = await getSeatsByRoom(selectedRoom._id);
      setRoomSeats(data.seats || []);
      toast.success('Xóa ghế thành công!');
    } catch (err) {
      const errorMsg = err?.message || 'Có lỗi xảy ra khi xóa ghế';
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

  const openAddSeatModal = () => {
    setEditingSeat(null);
    setSeatFormData({
      row: '',
      number: '',
      type: 'Standard'
    });
  };

  const closeSeatModal = () => {
    setShowSeatModal(false);
    setSelectedRoom(null);
    setRoomSeats([]);
    setEditingSeat(null);
  };

  const openEditCinemaModal = () => {
    if (selectedCinema) {
      handleEditCinema(selectedCinema);
    }
  };

  const closeCinemaModal = () => {
    setShowCinemaModal(false);
    setEditingCinema(null);
  };

  const openAddRoomModal = () => {
    if (!selectedCinema) {
      toast.error('Vui lòng chọn một rạp trước');
      return;
    }
    setEditingRoom(null);
    setRoomFormData({
      cinemaId: selectedCinema._id,
      name: '',
      capacity: '',
      type: 'Standard',
      movieId: '',
      startTime: '',
      price: '',
      timeSlots: [],
      description: '',
      status: 'Active'
    });
    setShowRoomModal(true);
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    setEditingRoom(null);
  };

  const getStatusBadge = (status) => (
    <span className={`badge ${status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
      {status === 'Active' ? 'Hoạt động' : 'Ngừng hoạt động'}
    </span>
  );

  const getRoomTypeBadge = (type) => {
    const typeClasses = {
      'Standard': 'badge-info',
      'VIP': 'badge-warning',
      'IMAX': 'badge-primary'
    };
    return (
      <span className={`badge ${typeClasses[type] || 'badge-info'}`}>
        {type}
      </span>
    );
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
              <p className="cinema-address">{selectedCinema.address}, {selectedCinema.city}</p>
            </div>
            <div>
              <button className="btn btn-primary" onClick={openAddRoomModal}>
                + Thêm Phòng Mới
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên phòng</th>
                  <th>Loại phòng</th>
                  <th>Số ghế</th>
                  <th>Phim đang chiếu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cinemaRooms.map((room, index) => {
                  const movie = getMovieForRoom(room);
                  return (
                  <tr key={room._id}>
                    <td>{index + 1}</td>
                    <td>{room.name}</td>
                    <td>{getRoomTypeBadge(room.type)}</td>
                    <td>{room.capacity}</td>
                    <td>
                      {movie ? (
                        <span className="movie-playing">
                          {typeof movie === 'object' && movie.title ? movie.title : 'Phim đã xóa'}
                        </span>
                      ) : (
                        <span className="no-movie">Chưa có phim</span>
                      )}
                    </td>
                    <td>{getStatusBadge(room.status)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => fetchRoomSeats(room)}
                      >
                        Quản lý ghế
                      </button>
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEditRoom(room)}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDeleteClick(room._id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                )})}
                {cinemaRooms.length === 0 && (
                  <tr>
                    <td colSpan="7" className="no-data">Không có phòng nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cinema Modal */}
      {showCinemaModal && (
        <div className="modal-overlay" onClick={closeCinemaModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCinema ? 'Sửa Rạp' : 'Thêm Rạp Mới'}</h3>
              <button className="modal-close" onClick={closeCinemaModal}>&times;</button>
            </div>
            <form onSubmit={handleCinemaSubmit} className="modal-form">
              <div className="form-group">
                <label>Tên rạp *</label>
                <input
                  type="text"
                  name="name"
                  value={cinemaFormData.name}
                  onChange={handleCinemaInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ *</label>
                <input
                  type="text"
                  name="address"
                  value={cinemaFormData.address}
                  onChange={handleCinemaInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thành phố *</label>
                  <input
                    type="text"
                    name="city"
                    value={cinemaFormData.city}
                    onChange={handleCinemaInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={cinemaFormData.phone}
                    onChange={handleCinemaInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={cinemaFormData.email}
                    onChange={handleCinemaInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={cinemaFormData.status} onChange={handleCinemaInputChange}>
                    <option value="Active">Hoạt động</option>
                    <option value="Inactive">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={cinemaFormData.description}
                  onChange={handleCinemaInputChange}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeCinemaModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCinema ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={closeRoomModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoom ? 'Sửa Phòng' : 'Thêm Phòng Mới'}</h3>
              <button className="modal-close" onClick={closeRoomModal}>&times;</button>
            </div>
            <form onSubmit={handleRoomSubmit} className="modal-form">
              <div className="form-group">
                <label>Tên phòng *</label>
                <input
                  type="text"
                  name="name"
                  value={roomFormData.name}
                  onChange={handleRoomInputChange}
                  placeholder="VD: Phòng 1, Phòng VIP..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số ghế *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={roomFormData.capacity}
                    onChange={handleRoomInputChange}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Loại phòng</label>
                  <select name="type" value={roomFormData.type} onChange={handleRoomInputChange}>
                    {ROOM_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Chọn phim</label>
                  <select name="movieId" value={roomFormData.movieId} onChange={handleRoomInputChange}>
                    <option value="">-- Chưa có phim --</option>
                    {getAvailableMovies(editingRoom ? editingRoom._id : null).map(movie => (
                      <option key={movie._id} value={movie._id}>{movie.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Trạng thái</label>
                <select name="status" value={roomFormData.status} onChange={handleRoomInputChange}>
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={roomFormData.description}
                  onChange={handleRoomInputChange}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeRoomModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Time Slots Modal */}
      {showTimeSlotsModal && (
        <div className="modal-overlay" onClick={closeTimeSlotsModal}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quản lý khung giờ - {editingTimeSlotsRoom?.name}</h3>
              <button className="modal-close" onClick={closeTimeSlotsModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nhập khung giờ (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={timeSlotsInput}
                  onChange={(e) => setTimeSlotsInput(e.target.value)}
                  placeholder="VD: 09:00, 13:00, 17:00, 21:00"
                />
                <small className="form-hint">Định dạng: HH:mm (ví dụ: 09:00, 13:00, 17:00, 21:00)</small>
              </div>
              
              <div className="time-slots-preview">
                <h4>Xem trước:</h4>
                <div className="slots-list">
                  {timeSlotsInput.split(',').map((s, idx) => {
                    const trimmed = s.trim();
                    if (!trimmed || !/^\d{1,2}:\d{2}$/.test(trimmed)) return null;
                    return (
                      <span key={idx} className="time-slot-badge-large">{trimmed}</span>
                    );
                  })}
                  {timeSlotsInput.split(',').filter(s => s.trim() && /^\d{1,2}:\d{2}$/.test(s.trim())).length === 0 && (
                    <span className="no-slots">Chưa có khung giờ hợp lệ</span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeTimeSlotsModal}>
                Hủy
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveTimeSlots}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={isDeleting ? undefined : cancelDelete}>
          <div 
            className={`modal-content modal-small ${isDeleting ? 'deleting' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Xác nhận xóa</h3>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa phòng chiếu này không?</p>
              <p className="text-muted">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={cancelDelete}>
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={confirmDeleteRoom} 
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span>
                    <span className="spinner"></span> Đang xóa...
                  </span>
                ) : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seat Management Modal */}
      {showSeatModal && selectedRoom && (
        <div className="modal-overlay" onClick={closeSeatModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quản lý ghế - {selectedRoom.name}</h3>
              <button className="modal-close" onClick={closeSeatModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="seat-management">
                <div className="seat-form-section">
                  <h4>{editingSeat ? 'Sửa ghế' : 'Thêm ghế mới'}</h4>
                  <form onSubmit={handleSeatSubmit} className="seat-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Hàng *</label>
                        <input
                          type="text"
                          name="row"
                          value={seatFormData.row}
                          onChange={handleSeatInputChange}
                          placeholder="VD: A, B, C"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Số *</label>
                        <input
                          type="number"
                          name="number"
                          value={seatFormData.number}
                          onChange={handleSeatInputChange}
                          placeholder="VD: 1, 2, 3"
                          required
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Loại ghế</label>
                        <select name="type" value={seatFormData.type} onChange={handleSeatInputChange}>
                          <option value="Standard">Standard</option>
                          <option value="VIP">VIP</option>
                          <option value="Couple">Couple</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-actions">
                      {editingSeat && (
                        <button type="button" className="btn btn-secondary" onClick={openAddSeatModal}>
                          Thêm mới
                        </button>
                      )}
                      <button type="submit" className="btn btn-primary">
                        {editingSeat ? 'Cập nhật' : 'Thêm ghế'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="seat-list-section">
                  <h4>Danh sách ghế ({roomSeats.length})</h4>
                  <div className="seat-grid">
                    {roomSeats.map((seat) => (
                      <div key={seat._id} className="seat-item">
                        <div className="seat-info">
                          <span className="seat-label">{seat.row}{seat.number}</span>
                          <span className={`seat-type badge badge-${seat.type === 'VIP' ? 'warning' : seat.type === 'Couple' ? 'primary' : 'info'}`}>
                            {seat.type}
                          </span>
                        </div>
                        <div className="seat-actions">
                          <button 
                            className="btn btn-sm btn-edit"
                            onClick={() => handleEditSeat(seat)}
                          >
                            Sửa
                          </button>
                          <button 
                            className="btn btn-sm btn-delete"
                            onClick={() => handleDeleteSeatClick(seat._id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {roomSeats.length === 0 && (
                      <div className="no-seats">Chưa có ghế nào</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seat Delete Confirmation Modal */}
      {showSeatDeleteConfirm && (
        <div className="modal-overlay" onClick={isSeatDeleting ? undefined : cancelSeatDelete}>
          <div 
            className={`modal-content modal-small ${isSeatDeleting ? 'deleting' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Xác nhận xóa ghế</h3>
              <button className="modal-close" onClick={cancelSeatDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa ghế này không?</p>
              <p className="text-muted">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={cancelSeatDelete}>
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={confirmDeleteSeat} 
                disabled={isSeatDeleting}
              >
                {isSeatDeleting ? (
                  <span>
                    <span className="spinner"></span> Đang xóa...
                  </span>
                ) : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemaManagement;
