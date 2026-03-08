import React, { useState, useEffect } from 'react';
import { 
  getAllShowtimes, 
  createShowtime, 
  updateShowtime, 
  deleteShowtime,
  getAllMovies,
  getAllCinemas,
  getRoomsByCinema
} from '../../services/api';
import './AdminManagement.css';

const ShowtimeManagement = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [filterCinema, setFilterCinema] = useState('');
  const [filterMovie, setFilterMovie] = useState('');
  
  const [formData, setFormData] = useState({
    movieId: '',
    cinemasId: '',
    roomId: '',
    startTime: '',
    price: '',
    language: 'Tiếng Việt'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.cinemasId) {
      fetchRooms(formData.cinemasId);
    }
  }, [formData.cinemasId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showtimesData, moviesData, cinemasData] = await Promise.all([
        getAllShowtimes(),
        getAllMovies(),
        getAllCinemas()
      ]);
      setShowtimes(showtimesData);
      setMovies(moviesData);
      setCinemas(cinemasData);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (cinemaId) => {
    try {
      const roomsData = await getRoomsByCinema(cinemaId);
      setRooms(roomsData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const showtimeData = {
        ...formData,
        price: parseInt(formData.price)
      };

      if (editingShowtime) {
        await updateShowtime(editingShowtime._id, showtimeData);
      } else {
        await createShowtime(showtimeData);
      }
      
      await fetchData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Failed to save showtime');
    }
  };

  const handleEdit = (showtime) => {
    setEditingShowtime(showtime);
    setFormData({
      movieId: showtime.movieId?._id || showtime.movieId || '',
      cinemasId: showtime.cinemasId?._id || showtime.cinemasId || '',
      roomId: showtime.roomId?._id || showtime.roomId || '',
      startTime: showtime.startTime ? new Date(showtime.startTime).toISOString().slice(0, 16) : '',
      price: showtime.price || '',
      language: showtime.language || 'Tiếng Việt'
    });
    
    // Fetch rooms for the selected cinema
    if (showtime.cinemasId?._id || showtime.cinemasId) {
      fetchRooms(showtime.cinemasId?._id || showtime.cinemasId);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this showtime?')) return;
    
    try {
      await deleteShowtime(id);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete showtime');
    }
  };

  const openAddModal = () => {
    setEditingShowtime(null);
    setFormData({
      movieId: '',
      cinemasId: '',
      roomId: '',
      startTime: '',
      price: '',
      language: 'Tiếng Việt'
    });
    setRooms([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShowtime(null);
    setRooms([]);
  };

  const filteredShowtimes = showtimes.filter(showtime => {
    if (filterCinema && (showtime.cinemasId?._id || showtime.cinemasId) !== filterCinema) return false;
    if (filterMovie && (showtime.movieId?._id || showtime.movieId) !== filterMovie) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Scheduled': 'badge-success',
      'Cancelled': 'badge-danger',
      'Completed': 'badge-secondary'
    };
    return (
      <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
        {status === 'Scheduled' ? 'Đã lên lịch' : status === 'Cancelled' ? 'Đã hủy' : 'Hoàn thành'}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý Lịch Chiếu</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Thêm Lịch Chiếu Mới
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Lọc theo phim:</label>
          <select value={filterMovie} onChange={(e) => setFilterMovie(e.target.value)}>
            <option value="">Tất cả phim</option>
            {movies.map(movie => (
              <option key={movie._id} value={movie._id}>{movie.title}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Lọc theo rạp:</label>
          <select value={filterCinema} onChange={(e) => setFilterCinema(e.target.value)}>
            <option value="">Tất cả rạp</option>
            {cinemas.map(cinema => (
              <option key={cinema._id} value={cinema._id}>{cinema.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Phim</th>
              <th>Rạp</th>
              <th>Phòng</th>
              <th>Giờ chiếu</th>
              <th>Giá vé</th>
              <th>Ngôn ngữ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredShowtimes.map((showtime, index) => (
              <tr key={showtime._id}>
                <td>{index + 1}</td>
                <td className="movie-title">
                  {showtime.movieId?.title || 'N/A'}
                </td>
                <td>{showtime.cinemasId?.name || 'N/A'}</td>
                <td>{showtime.roomId?.name || 'N/A'}</td>
                <td>{formatDateTime(showtime.startTime)}</td>
                <td>{showtime.price?.toLocaleString('vi-VN')} VNĐ</td>
                <td>{showtime.language}</td>
                <td>{getStatusBadge(showtime.status)}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(showtime)}
                  >
                    Sửa
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(showtime._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filteredShowtimes.length === 0 && (
              <tr>
                <td colSpan="9" className="no-data">Không có lịch chiếu nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingShowtime ? 'Sửa Lịch Chiếu' : 'Thêm Lịch Chiếu Mới'}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Chọn phim *</label>
                <select
                  name="movieId"
                  value={formData.movieId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Chọn phim</option>
                  {movies.map(movie => (
                    <option key={movie._id} value={movie._id}>{movie.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Chọn rạp *</label>
                  <select
                    name="cinemasId"
                    value={formData.cinemasId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Chọn rạp</option>
                    {cinemas.map(cinema => (
                      <option key={cinema._id} value={cinema._id}>{cinema.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Chọn phòng *</label>
                  <select
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.cinemasId}
                  >
                    <option value="">Chọn phòng</option>
                    {rooms.map(room => (
                      <option key={room._id} value={room._id}>
                        {room.name} ({room.type} - {room.capacity} ghế)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày giờ chiếu *</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Giá vé (VNĐ) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="VD: 75000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ngôn ngữ</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                >
                  <option value="Tiếng Việt">Tiếng Việt</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Tiếng Hàn">Tiếng Hàn</option>
                  <option value="Tiếng Nhật">Tiếng Nhật</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingShowtime ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowtimeManagement;
