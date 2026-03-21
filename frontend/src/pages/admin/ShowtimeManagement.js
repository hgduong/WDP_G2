import React, { useState, useEffect } from 'react';
import { 
  getAllShowtimes, 
  createShowtime, 
  updateShowtime, 
  deleteShowtime,
  getAllMovies,
  getRoomsByCinema
} from '../../services/api';
import './AdminManagement.css';

// ID của rạp Time Cinemas
const TIME_CINEMAS_ID = '69ad9a89012ada8e95feb9cf';

const ShowtimeManagement = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [existingShowtimes, setExistingShowtimes] = useState([]);
  const [editSelectedSlots, setEditSelectedSlots] = useState([]);
  const [editDate, setEditDate] = useState('');
  const [editGeneratedSlots, setEditGeneratedSlots] = useState([]);
  const [editFormData, setEditFormData] = useState({
    movieId: '',
    roomId: '',
    price: '',
    language: 'Tiếng Việt',
    status: 'Scheduled'
  });
  const [filterMovie, setFilterMovie] = useState('');
  
  // State for multi-showtime creation
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showtimesData, moviesData, roomsData] = await Promise.all([
        getAllShowtimes(),
        getAllMovies(),
        getRoomsByCinema(TIME_CINEMAS_ID)
      ]);
      setShowtimes(showtimesData);
      setMovies(moviesData);
      setRooms(roomsData);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots based on movie duration
  const generateTimeSlots = () => {
    if (!selectedMovie || !selectedDate) {
      alert('Vui lòng chọn phim và ngày chiếu');
      return;
    }

    const movie = movies.find(m => m._id === selectedMovie);
    if (!movie?.duration) {
      alert('Phim không có thời lượng');
      return;
    }

    const duration = movie.duration; // minutes
    const dateObj = new Date(selectedDate);
    const slots = [];
    
    // Start from 7:00 AM (opening time)
    let currentHour = 7;
    let currentMinute = 0;
    let showCount = 0;

    // Generate slots throughout the day until 22:00
    while (currentHour < 22) {
      // Round current minute to nearest 5
      const roundedMinute = Math.round(currentMinute / 5) * 5;
      let adjustedHour = currentHour;
      let adjustedMinute = roundedMinute;
      if (adjustedMinute >= 60) {
        adjustedHour += 1;
        adjustedMinute -= 60;
      }
      
      const slotTime = new Date(dateObj);
      slotTime.setHours(adjustedHour, adjustedMinute, 0, 0);
      
      // Calculate end time
      const breakTime = (showCount > 0 && showCount % 2 === 1) ? 45 : 15;
      const endTime = new Date(slotTime.getTime() + (duration + breakTime) * 60000);
      
      // Only add if end time is before 23:00
      if (endTime.getHours() < 23 || (endTime.getHours() === 23 && endTime.getMinutes() === 0)) {
        slots.push({
          startTime: slotTime.toISOString(),
          endTime: endTime.toISOString(),
          movieDuration: duration,
          breakTime: breakTime
        });
        showCount++;
      }
      
      // Move to next slot
      currentMinute += duration + breakTime;
      while (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
    }

    setGeneratedSlots(slots);
    setSelectedSlots([]);
  };

  const toggleSlot = (slot) => {
    const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);
    if (isSelected) {
      setSelectedSlots(selectedSlots.filter(s => s.startTime !== slot.startTime));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSaveShowtimes = async () => {
    if (!selectedMovie || !selectedRoom || selectedSlots.length === 0) {
      alert('Vui lòng chọn phim, phòng và ít nhất 1 khung giờ');
      return;
    }

    try {
      // Create showtime for each selected slot
      for (const slot of selectedSlots) {
        const showtimeData = {
          movieId: selectedMovie,
          cinemasId: TIME_CINEMAS_ID,
          roomId: selectedRoom,
          startTime: slot.startTime,
          price: 75000, // default price
          language: 'Tiếng Việt'
        };
        await createShowtime(showtimeData);
      }
      
      await fetchData();
      closeModal();
      alert(`Đã thêm ${selectedSlots.length} suất chiếu thành công!`);
    } catch (err) {
      setError(err.message || 'Failed to save showtimes');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa suất chiếu này?')) return;
    
    try {
      await deleteShowtime(id);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete showtime');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShowtime(null);
    setSelectedMovie('');
    setSelectedRoom('');
    setSelectedDate('');
    setGeneratedSlots([]);
    setSelectedSlots([]);
  };

  const filteredShowtimes = showtimes.filter(showtime => {
    if (filterMovie && (showtime.movieId?._id || showtime.movieId) !== filterMovie) return false;
    return true;
  });

  // Group showtimes by movie + room
  const groupedShowtimes = () => {
    const groups = {};
    filteredShowtimes.forEach(showtime => {
      const movieId = showtime.movieId?._id || showtime.movieId;
      const roomId = showtime.roomId?._id || showtime.roomId;
      const key = `${movieId}-${roomId}`;
      
      if (!groups[key]) {
        groups[key] = {
          movieId: showtime.movieId,
          roomId: showtime.roomId,
          showtimes: []
        };
      }
      groups[key].showtimes.push(showtime);
    });
    
    // Sort showtimes within each group by time
    Object.values(groups).forEach(group => {
      group.showtimes.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });
    
    return Object.values(groups);
  };

  const handleDeleteGroup = async (showtimesToDelete) => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${showtimesToDelete.length} suất chiếu này?`)) return;
    
    try {
      for (const showtime of showtimesToDelete) {
        await deleteShowtime(showtime._id);
      }
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete showtimes');
    }
  };

  const handleEdit = (group) => {
    // Load all showtimes in the group
    setEditingGroup(group);
    setExistingShowtimes(group.showtimes);
    setEditSelectedSlots(group.showtimes.map(s => ({ startTime: s.startTime, _id: s._id })));
    
    // Set date to the first showtime's date
    const firstShowtimeDate = group.showtimes[0]?.startTime 
      ? new Date(group.showtimes[0].startTime).toISOString().split('T')[0]
      : '';
    setEditDate(firstShowtimeDate);
    setEditGeneratedSlots([]);
    
    setEditFormData({
      movieId: group.movieId?._id || group.movieId,
      roomId: group.roomId?._id || group.roomId,
      price: group.showtimes[0]?.price || '',
      language: group.showtimes[0]?.language || 'Tiếng Việt',
      status: group.showtimes[0]?.status || 'Scheduled'
    });
    setShowEditModal(true);
  };

  // Generate time slots for edit modal
  const generateEditTimeSlots = () => {
    if (!editFormData.movieId || !editDate) {
      alert('Vui lòng chọn phim và ngày chiếu');
      return;
    }

    const movie = movies.find(m => m._id === editFormData.movieId);
    if (!movie?.duration) {
      alert('Phim không có thời lượng');
      return;
    }

    const duration = movie.duration;
    const dateObj = new Date(editDate);
    const slots = [];
    let currentHour = 7;
    let currentMinute = 0;
    let showCount = 0;

    while (currentHour < 22) {
      // Round current minute to nearest 5
      const roundedMinute = Math.round(currentMinute / 5) * 5;
      let adjustedHour = currentHour;
      let adjustedMinute = roundedMinute;
      if (adjustedMinute >= 60) {
        adjustedHour += 1;
        adjustedMinute -= 60;
      }
      
      const slotTime = new Date(dateObj);
      slotTime.setHours(adjustedHour, adjustedMinute, 0, 0);

      const endTime = new Date(slotTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      // Calculate break time based on show count
      let breakTime = 15;
      if (showCount >= 2) {
        breakTime = 45;
      }

      slots.push({
        startTime: slotTime.toISOString(),
        endTime: endTime.toISOString(),
        movieDuration: duration,
        breakTime: breakTime
      });
      showCount++;

      currentMinute += duration + breakTime;
      while (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
    }

    setEditGeneratedSlots(slots);
  };

  const toggleEditSlot = (slot) => {
    const existsIndex = editSelectedSlots.findIndex(s => s.startTime === slot.startTime);
    if (existsIndex >= 0) {
      // Remove from selected (will be deleted on save)
      const updated = [...editSelectedSlots];
      updated.splice(existsIndex, 1);
      setEditSelectedSlots(updated);
    } else {
      // Add to selected (will be created on save)
      setEditSelectedSlots([...editSelectedSlots, slot]);
    }
  };

  const isSlotSelected = (slot) => {
    return editSelectedSlots.some(s => s.startTime === slot.startTime);
  };

  const handleUpdateShowtime = async (e) => {
    e.preventDefault();
    try {
      // Find showtimes to delete (existing ones not in selectedSlots)
      const existingIds = existingShowtimes.map(s => s._id);
      const selectedIds = editSelectedSlots.filter(s => s._id).map(s => s._id);
      const toDelete = existingIds.filter(id => !selectedIds.includes(id));

      // Find new slots to create (ones without _id)
      const toCreate = editSelectedSlots.filter(s => !s._id);

      // Delete unselected showtimes
      for (const id of toDelete) {
        await deleteShowtime(id);
      }

      // Create new showtimes
      for (const slot of toCreate) {
        const showtimeData = {
          movieId: editFormData.movieId,
          cinemasId: TIME_CINEMAS_ID,
          roomId: editFormData.roomId,
          startTime: slot.startTime,
          price: parseInt(editFormData.price),
          language: editFormData.language
        };
        await createShowtime(showtimeData);
      }

      // Update remaining showtimes
      const toUpdate = existingShowtimes.filter(s => selectedIds.includes(s._id));
      for (const showtime of toUpdate) {
        await updateShowtime(showtime._id, {
          movieId: editFormData.movieId,
          roomId: editFormData.roomId,
          price: parseInt(editFormData.price),
          language: editFormData.language,
          status: editFormData.status
        });
      }

      await fetchData();
      setShowEditModal(false);
      setEditingGroup(null);
      setExistingShowtimes([]);
      setEditSelectedSlots([]);
    } catch (err) {
      setError(err.message || 'Failed to update showtimes');
    }
  };

  const handleDeleteAllEdit = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa tất cả suất chiếu của ${editingGroup?.movieId?.title}?`)) return;
    try {
      for (const showtime of existingShowtimes) {
        await deleteShowtime(showtime._id);
      }
      await fetchData();
      setShowEditModal(false);
      setEditingGroup(null);
    } catch (err) {
      setError(err.message || 'Failed to delete showtimes');
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingGroup(null);
    setExistingShowtimes([]);
    setEditSelectedSlots([]);
    setEditDate('');
    setEditGeneratedSlots([]);
  };

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

  // Round minutes to nearest 5
  const roundToFive = (minutes) => {
    return Math.round(minutes / 5) * 5;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    let minutes = date.getMinutes();
    const roundedMinutes = roundToFive(minutes);
    
    // Handle hour overflow if minutes round up to 60
    let hours = date.getHours();
    if (roundedMinutes === 60) {
      hours += 1;
    }
    
    return `${hours.toString().padStart(2, '0')}:${(roundedMinutes % 60).toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Get selected movie for display
  const getMovieTitle = () => {
    const movie = movies.find(m => m._id === selectedMovie);
    return movie?.title || '';
  };

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý Lịch Chiếu</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Phim</th>
              <th>Phòng</th>
              <th>Giờ chiếu</th>
              <th>Ngôn ngữ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {groupedShowtimes().map((group, index) => (
              <tr key={`${group.movieId?._id || group.movieId}-${group.roomId?._id || group.roomId}`}>
                <td>{index + 1}</td>
                <td className="movie-title">
                  {group.movieId?.title || 'N/A'}
                </td>
                <td>{group.roomId?.name || 'N/A'}</td>
                <td>
                  <div className="time-slots-group">
                    {group.showtimes.map((showtime, idx) => (
                      <span key={showtime._id} className="time-slot-item">
                        {formatTime(showtime.startTime)}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{group.showtimes[0]?.language || 'N/A'}</td>
                <td>{getStatusBadge(group.showtimes[0]?.status)}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(group)}
                  >
                    Sửa
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDeleteGroup(group.showtimes)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {groupedShowtimes().length === 0 && (
              <tr>
                <td colSpan="7" className="no-data">Không có lịch chiếu nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm Lịch Chiếu Mới</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              {/* Bảng giá vé */}
              <div className="pricing-info" style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{marginTop: 0, marginBottom: '10px'}}>💰 Bảng giá vé</h4>
                <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  <div>
                    <span style={{fontWeight: 'bold', color: '#28a745'}}>Dưới 22 tuổi:</span> 50.000 VNĐ
                  </div>
                  <div>
                    <span style={{fontWeight: 'bold', color: '#007bff'}}>Từ 22 tuổi trở lên:</span> 100.000 VNĐ
                  </div>
                  <div>
                    <span style={{fontWeight: 'bold', color: '#dc3545'}}>Trên 70 tuổi:</span> <span style={{color: '#28a745', fontWeight: 'bold'}}>MIỄN PHÍ</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Select Movie, Room, Date */}
              <div className="form-row">
                <div className="form-group">
                  <label>Chọn phim *</label>
                  <select
                    value={selectedMovie}
                    onChange={(e) => {
                      setSelectedMovie(e.target.value);
                      setGeneratedSlots([]);
                      setSelectedSlots([]);
                    }}
                    required
                  >
                    <option value="">Chọn phim</option>
                    {movies.map(movie => (
                      <option key={movie._id} value={movie._id}>
                        {movie.title} {movie.duration ? `(${movie.duration} phút)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Chọn phòng *</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setGeneratedSlots([]);
                      setSelectedSlots([]);
                    }}
                    required
                  >
                    <option value="">Chọn phòng</option>
                    {rooms.map(room => (
                      <option key={room._id} value={room._id}>
                        {room.name} ({room.type} - {room.capacity} ghế)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ngày chiếu *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setGeneratedSlots([]);
                      setSelectedSlots([]);
                    }}
                    required
                  />
                </div>
              </div>

              {/* Step 2: Generate and select time slots */}
              {selectedMovie && selectedRoom && selectedDate && (
                <div className="slots-section">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                    <h4>Chọn khung giờ chiếu</h4>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={generateTimeSlots}
                    >
                      🔄 Tạo khung giờ
                    </button>
                  </div>

                  {generatedSlots.length > 0 && (
                    <>
                      <p style={{marginBottom: '10px', color: '#666'}}>
                        Đã chọn: <strong>{selectedSlots.length}</strong> suất chiếu - {getMovieTitle()}
                      </p>
                      <div className="slots-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: '10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px'
                      }}>
                        {generatedSlots.map((slot, index) => {
                          const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);
                          return (
                            <div
                              key={index}
                              onClick={() => toggleSlot(slot)}
                              style={{
                                padding: '12px',
                                border: isSelected ? '2px solid #28a745' : '1px solid #dee2e6',
                                borderRadius: '8px',
                                background: isSelected ? '#d4edda' : '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{fontWeight: 'bold', fontSize: '16px'}}>
                                {new Date(slot.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                              </div>
                              <div style={{fontSize: '12px', color: '#666'}}>
                                → {new Date(slot.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                              </div>
                              <div style={{fontSize: '11px', color: '#888', marginTop: '5px'}}>
                                Nghỉ: {slot.breakTime} phút
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {generatedSlots.length === 0 && (
                    <p style={{color: '#666', fontStyle: 'italic'}}>
                      Nhấn "Tạo khung giờ" để xem các khung giờ có thể chọn
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveShowtimes}
                disabled={selectedSlots.length === 0}
              >
                Lưu ({selectedSlots.length}) suất chiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Showtime Modal */}
      {showEditModal && editingGroup && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sửa Lịch Chiếu - {editingGroup.movieId?.title}</h3>
              <button className="modal-close" onClick={closeEditModal}>&times;</button>
            </div>
            <div className="modal-body">
              {/* List of time slots with checkboxes */}
              <div className="form-group">
                <label>Giờ chiếu hiện tại (bỏ tick để xóa):</label>
                <div className="slots-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '10px',
                  marginTop: '10px'
                }}>
                  {editingGroup.showtimes.map((showtime) => (
                    <div
                      key={showtime._id}
                      onClick={() => toggleEditSlot(showtime)}
                      style={{
                        padding: '10px',
                        border: editSelectedSlots.some(s => s.startTime === showtime.startTime) ? '2px solid #28a745' : '1px solid #dee2e6',
                        borderRadius: '8px',
                        background: editSelectedSlots.some(s => s.startTime === showtime.startTime) ? '#d4edda' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editSelectedSlots.some(s => s.startTime === showtime.startTime)}
                        onChange={() => toggleEditSlot(showtime)}
                      />
                      <span>{formatTime(showtime.startTime)}</span>
                    </div>
                  ))}
                </div>
                <small style={{color: '#666'}}>Đã chọn: {editSelectedSlots.length} suất chiếu</small>
              </div>

              {/* Thêm giờ mới */}
              <div className="form-group" style={{marginTop: '20px'}}>
                <label>Thêm giờ chiếu mới:</label>
                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    style={{padding: '8px', borderRadius: '5px', border: '1px solid #ddd'}}
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={generateEditTimeSlots}
                  >
                    🔄 Tạo khung giờ
                  </button>
                </div>

                {editGeneratedSlots.length > 0 && (
                  <div className="slots-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '10px',
                    marginTop: '15px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px'
                  }}>
                    {editGeneratedSlots.map((slot, index) => {
                      const isSelected = isSlotSelected(slot);
                      return (
                        <div
                          key={index}
                          onClick={() => toggleEditSlot(slot)}
                          style={{
                            padding: '10px',
                            border: isSelected ? '2px solid #28a745' : '1px solid #dee2e6',
                            borderRadius: '8px',
                            background: isSelected ? '#d4edda' : '#fff',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{fontWeight: 'bold'}}>
                            {new Date(slot.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
                          </div>
                          {isSelected && <div style={{fontSize: '11px', color: '#28a745'}}>✓ Thêm</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <p style={{marginTop: '15px', color: '#666'}}>
                Tổng cộng: <strong>{editSelectedSlots.length}</strong> suất chiếu sẽ được lưu
              </p>

              <hr style={{margin: '20px 0'}} />

              <form onSubmit={handleUpdateShowtime} className="modal-form">
                <div className="form-group">
                  <label>Phim</label>
                  <select 
                    name="movieId" 
                    value={editFormData.movieId} 
                    onChange={(e) => setEditFormData({...editFormData, movieId: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn phim --</option>
                    {movies.map(movie => (
                      <option key={movie._id} value={movie._id}>{movie.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Phòng</label>
                  <select 
                    name="roomId" 
                    value={editFormData.roomId} 
                    onChange={(e) => setEditFormData({...editFormData, roomId: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map(room => (
                      <option key={room._id} value={room._id}>{room.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Giá vé (VNĐ)</label>
                  <input
                    type="number"
                    name="price"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Ngôn ngữ</label>
                  <select 
                    name="language" 
                    value={editFormData.language} 
                    onChange={(e) => setEditFormData({...editFormData, language: e.target.value})}
                  >
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select 
                    name="status" 
                    value={editFormData.status} 
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  >
                    <option value="Scheduled">Đã lên lịch</option>
                    <option value="Cancelled">Đã hủy</option>
                    <option value="Completed">Hoàn thành</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={handleDeleteAllEdit}
                    disabled={editSelectedSlots.length === 0}
                    style={{marginRight: 'auto'}}
                  >
                    Xóa đã chọn
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                    Hủy
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleUpdateShowtime}
                    disabled={editSelectedSlots.length === 0}
                  >
                    Lưu ({editSelectedSlots.length})
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowtimeManagement;
