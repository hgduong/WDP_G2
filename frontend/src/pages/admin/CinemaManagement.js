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
  deleteRoom
} from '../../services/api';
import './AdminManagement.css';

// ID của rạp Time Cinemas (hardcoded theo DB)
const TIME_CINEMAS_ID = '69ad9a89012ada8e95feb9cf';

const ROOM_TYPES = ['Standard', 'VIP', 'IMAX'];

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

  // Lấy phim đang chiếu trong phòng
  const getMovieForRoom = (roomId) => {
    const activeShowtime = cinemaShowtimes.find(st => 
      st.roomId?._id === roomId || st.roomId === roomId
    );
    return activeShowtime?.movieId || null;
  };

  const handleCinemaInputChange = (e) => {
    const { name, value } = e.target;
    setCinemaFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoomInputChange = (e) => {
    const { name, value } = e.target;
    setRoomFormData(prev => ({ ...prev, [name]: value }));
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
    } catch (err) {
      setError(err.message || 'Failed to save time slots');
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
    } catch (err) {
      setError(err.message || 'Failed to save cinema');
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        cinemaId: roomFormData.cinemaId,
        name: roomFormData.name,
        capacity: parseInt(roomFormData.capacity),
        type: roomFormData.type,
        timeSlots: roomFormData.timeSlots || [],
        description: roomFormData.description,
        status: roomFormData.status
      };
      
      let savedRoom;
      if (editingRoom) {
        savedRoom = await updateRoom(editingRoom._id, roomData);
      } else {
        savedRoom = await createRoom(roomData);
      }
      
      // Tạo showtime nếu có chọn phim
      if (roomFormData.movieId && roomFormData.startTime && roomFormData.price) {
        const showtimeData = {
          movieId: roomFormData.movieId,
          cinemasId: roomFormData.cinemaId,
          roomId: savedRoom._id,
          startTime: roomFormData.startTime,
          price: parseInt(roomFormData.price),
          language: 'Tiếng Việt'
        };
        await createShowtime(showtimeData);
      }
      
      await fetchRooms(roomFormData.cinemaId);
      closeRoomModal();
    } catch (err) {
      setError(err.message || 'Failed to save room');
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
    const currentMovie = getMovieForRoom(room._id);
    setEditingRoom(room);
    setRoomFormData({
      cinemaId: room.cinemaId || selectedCinema._id,
      name: room.name || '',
      capacity: room.capacity || '',
      type: room.type || 'Standard',
      movieId: currentMovie?._id || '',
      startTime: '',
      price: '',
      timeSlots: room.timeSlots || [],
      description: room.description || '',
      status: room.status || 'Active'
    });
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await deleteRoom(id);
      await fetchRooms(selectedCinema._id);
    } catch (err) {
      setError(err.message || 'Failed to delete room');
    }
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
      alert('Vui lòng chọn một rạp trước');
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
                  <th>Khung giờ</th>
                  <th>Phim đang chiếu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cinemaRooms.map((room, index) => {
                  const movie = getMovieForRoom(room._id);
                  return (
                  <tr key={room._id}>
                    <td>{index + 1}</td>
                    <td>{room.name}</td>
                    <td>{getRoomTypeBadge(room.type)}</td>
                    <td>{room.capacity}</td>
                    <td>
                      <div className="time-slots-display">
                        {room.timeSlots && room.timeSlots.length > 0 ? (
                          room.timeSlots.map((slot, idx) => (
                            <span key={idx} className="time-slot-badge">{slot}</span>
                          ))
                        ) : (
                          <span className="no-time-slots">Chưa set</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {movie ? (
                        <span className="movie-playing">{movie.title}</span>
                      ) : (
                        <span className="no-movie">Chưa có phim</span>
                      )}
                    </td>
                    <td>{getStatusBadge(room.status)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-time"
                        onClick={() => handleEditTimeSlots(room)}
                        title="Quản lý khung giờ"
                      >
                        Giờ
                      </button>
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEditRoom(room)}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDeleteRoom(room._id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                )})}
                {cinemaRooms.length === 0 && (
                  <tr>
                    <td colSpan="8" className="no-data">Không có phòng nào</td>
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
                    <option value="">-- Không có phim --</option>
                    {movies.map(movie => (
                      <option key={movie._id} value={movie._id}>{movie.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Giờ chiếu</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={roomFormData.startTime}
                    onChange={handleRoomInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Giá vé (VNĐ)</label>
                <input
                  type="number"
                  name="price"
                  value={roomFormData.price}
                  onChange={handleRoomInputChange}
                  placeholder="VD: 75000"
                  min="0"
                />
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
    </div>
  );
};

export default CinemaManagement;
