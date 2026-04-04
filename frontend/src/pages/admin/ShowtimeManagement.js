import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAllShowtimes, 
  createShowtime, 
  updateShowtime, 
  deleteShowtime
} from '../../services/showtimesApi';
import { getAllMovies } from '../../services/moviesApi';
import { getRoomsByCinema } from '../../services/cinemasApi';
import { toast } from 'react-toastify';
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
  const [editGeneratedSlots, setEditGeneratedSlots] = useState([]);
  const [editFormData, setEditFormData] = useState({
    movieId: '',
    roomId: '',
    language: 'Tiếng Việt',
    status: 'Scheduled'
  });
  const [filterMovie, setFilterMovie] = useState('');
  
  // Delete confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingShowtimeId, setDeletingShowtimeId] = useState(null);
  const [deletingShowtimeIds, setDeletingShowtimeIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle actual delete after confirmation
  const handleConfirmDelete = async () => {
    if (deletingShowtimeIds.length === 0) {
      toast.warning('Không có suất chiếu để xóa');
      setShowDeleteConfirm(false);
      return;
    }
    
    setIsDeleting(true);
    try {
      console.log('Deleting:', deletingShowtimeIds.length, 'showtimes');
      let deletedCount = 0;
      for (const id of deletingShowtimeIds) {
        await deleteShowtime(id);
        deletedCount++;
      }
      console.log('Deleted:', deletedCount, 'showtimes');
      await fetchData();
      toast.success(`Đã xóa ${deletedCount} suất chiếu!`);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete showtime');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingShowtimeId(null);
      setDeletingShowtimeIds([]);
    }
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingShowtimeId(null);
    setDeletingShowtimeIds([]);
  };
  
  // State for multi-showtime creation
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get movies that already have showtimes created
  const getMoviesWithShowtimes = () => {
    const movieIds = new Set();
    showtimes.forEach(showtime => {
      const movieId = showtime.movieId?._id || showtime.movieId;
      if (movieId) movieIds.add(movieId);
    });
    return movieIds;
  };

  // Filter movies that don't have showtimes yet
  const getAvailableMovies = () => {
    const moviesWithShowtimes = getMoviesWithShowtimes();
    return movies.filter(movie => !moviesWithShowtimes.has(movie._id));
  };

  // Get rooms that have the selected movie assigned (from CinemaManagement)
  const getRoomsWithMovie = (movieId) => {
    return rooms.filter(room => room.movieId === movieId);
  };

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate time slots based on movie duration (for today as template)
  const generateTimeSlots = () => {
    if (!selectedMovie || !selectedRoom) {
      toast.warning('Vui lòng chọn phim và phòng');
      return;
    }

    const movie = movies.find(m => m._id === selectedMovie);
    const duration = movie?.duration || 120; // Default 120 minutes if no duration
    if (!movie?.duration) {
      toast.info('Phim không có thời lượng, sử dụng mặc định 120 phút');
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slots = [];
    let currentHour = 7; // Start from 7:00 AM
    let currentMinute = 0;
    let showCount = 0;

    // Generate slots until 22:00
    while (currentHour < 22) {
      const roundedMinute = Math.round(currentMinute / 5) * 5;
      let adjustedHour = currentHour;
      let adjustedMinute = roundedMinute;
      if (adjustedMinute >= 60) {
        adjustedHour += 1;
        adjustedMinute -= 60;
      }

      const slotTime = new Date(dateStr);
      slotTime.setHours(adjustedHour, adjustedMinute, 0, 0);

      // Calculate break time: 45 min after odd shows, 15 min otherwise
      const breakTime = (showCount > 0 && showCount % 2 === 1) ? 45 : 15;
      const endTime = new Date(slotTime.getTime() + (duration + breakTime) * 60000);

      // Only add if end time before 23:00
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
      toast.warning('Vui lòng chọn phim, phòng và ít nhất 1 khung giờ');
      return;
    }

    // Prevent multiple clicks
    if (isSaving) return;
    setIsSaving(true);

    try {
      const movie = movies.find(m => m._id === selectedMovie);
      const releaseDate = movie?.releaseDate ? new Date(movie.releaseDate) : new Date();
      
      // Default to next 7 days if no endDate
      let endDate;
      if (movie?.endDate) {
        endDate = new Date(movie.endDate);
      } else {
        endDate = new Date(releaseDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }

      // Normalize to start of day
      releaseDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Generate showtimes for next 7 days or within date range
      const currentDate = new Date(releaseDate);
      if (currentDate < new Date()) {
        currentDate.setTime(Date.now());
        currentDate.setHours(0, 0, 0, 0);
      }
      
      let totalCreated = 0;
      let daysCount = 0;
      const maxDays = 7; // Limit to 7 days

      while (currentDate <= endDate && daysCount < maxDays) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        for (const slot of selectedSlots) {
          const slotTime = new Date(slot.startTime);
          const showtimeDate = new Date(dateStr);
          showtimeDate.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);

          const showtimeData = {
            movieId: selectedMovie,
            roomId: selectedRoom,
            startTime: showtimeDate.toISOString(),
            duration: slot.movieDuration,
            language: 'Tiếng Việt'
          };
          await createShowtime(showtimeData);
          totalCreated++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
        daysCount++;
      }
      
      await fetchData();
      closeModal();
      const selMovie = movies.find(m => m._id === selectedMovie);
      const startDate = selMovie?.releaseDate ? new Date(selMovie.releaseDate) : new Date();
      toast.success(`Đã thêm ${totalCreated} suất chiếu cho ${daysCount} ngày tới!`);
    } catch (err) {
      toast.error(err.message || 'Failed to save showtimes');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDelete = async (id) => {
    // Delete showtime for today (as template)
    // The scheduler will stop generating showtimes for future days
    setDeletingShowtimeId(id);
    setDeletingShowtimeIds([id]);
    setShowDeleteConfirm(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShowtime(null);
    setSelectedMovie('');
    setSelectedRoom('');
    setGeneratedSlots([]);
    setSelectedSlots([]);
    setIsSaving(false);
  };

  const filteredShowtimes = showtimes.filter(showtime => {
    if (filterMovie && (showtime.movieId?._id || showtime.movieId) !== filterMovie) return false;
    return true;
  });

  // Group showtimes by movie + room (only unique times, not by day)
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
          showtimes: [],
          uniqueTimes: new Set()
        };
      }
      
      // Extract just the time part (HH:mm) to check uniqueness
      const timePart = formatTime(showtime.startTime);
      if (!groups[key].uniqueTimes.has(timePart)) {
        groups[key].uniqueTimes.add(timePart);
        groups[key].showtimes.push(showtime);
      }
    });
    
    // Sort showtimes within each group by time
    Object.values(groups).forEach(group => {
      group.showtimes.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });
    
    return Object.values(groups);
  };

  const handleDeleteGroup = async (group) => {
    // Get ALL showtime IDs directly from showtimes (not filtered)
    const allForGroup = showtimes.filter(s => {
      const sMovieId = s.movieId?._id || s.movieId;
      const sRoomId = s.roomId?._id || s.roomId;
      const gMovieId = group.movieId?._id || group.movieId;
      const gRoomId = group.roomId?._id || group.roomId;
      return sMovieId === gMovieId && sRoomId === gRoomId;
    });
    
    const idsToDelete = allForGroup.map(s => s._id);
    console.log('Deleting showtime IDs:', idsToDelete);
    
    setDeletingShowtimeIds(idsToDelete);
    setDeletingShowtimeId(null);
    setShowDeleteConfirm(true);
  };

  const handleEdit = (group) => {
    // Get ALL showtimes for this movie+room from filtered data
    const allForGroup = filteredShowtimes.filter(s => {
      const sMovieId = s.movieId?._id || s.movieId;
      const sRoomId = s.roomId?._id || s.roomId;
      const gMovieId = group.movieId?._id || group.movieId;
      const gRoomId = group.roomId?._id || group.roomId;
      return sMovieId === gMovieId && sRoomId === gRoomId;
    });
    
    setEditingGroup(group);
    setExistingShowtimes(allForGroup);
    setEditSelectedSlots(allForGroup.map(s => ({ startTime: s.startTime, _id: s._id, movieDuration: s.duration })));
    
    setEditGeneratedSlots([]);
    
    setEditFormData({
      movieId: group.movieId?._id || group.movieId,
      roomId: group.roomId?._id || group.roomId,
      language: group.showtimes[0]?.language || 'Tiếng Việt',
      status: group.showtimes[0]?.status || 'Scheduled'
    });
    setShowEditModal(true);
  };

  // Generate time slots based on movie duration for edit modal (for today as template)
  const generateEditTimeSlots = () => {
    if (!editFormData.movieId || !editFormData.roomId) {
      toast.warning('Vui lòng chọn phim và phòng');
      return;
    }

    const movie = movies.find(m => m._id === editFormData.movieId);
    const duration = movie?.duration || 120; // Default 120 minutes if no duration
    if (!movie?.duration) {
      toast.info('Phim không có thời lượng, sử dụng mặc định 120 phút');
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slots = [];
    let currentHour = 7;
    let currentMinute = 0;
    let showCount = 0;

    while (currentHour < 22) {
      const roundedMinute = Math.round(currentMinute / 5) * 5;
      let adjustedHour = currentHour;
      let adjustedMinute = roundedMinute;
      if (adjustedMinute >= 60) {
        adjustedHour += 1;
        adjustedMinute -= 60;
      }

      const slotTime = new Date(dateStr);
      slotTime.setHours(adjustedHour, adjustedMinute, 0, 0);

      const breakTime = (showCount > 0 && showCount % 2 === 1) ? 45 : 15;
      const endTime = new Date(slotTime.getTime() + (duration + breakTime) * 60000);

      if (endTime.getHours() < 23 || (endTime.getHours() === 23 && endTime.getMinutes() === 0)) {
        slots.push({
          startTime: slotTime.toISOString(),
          endTime: endTime.toISOString(),
          movieDuration: duration,
          breakTime: breakTime
        });
        showCount++;
      }

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
    
    // Prevent multiple clicks
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      // Get all existing showtime IDs for this movie+room
      const existingForGroup = filteredShowtimes.filter(s => {
        const sMovieId = s.movieId?._id || s.movieId;
        const sRoomId = s.roomId?._id || s.roomId;
        return sMovieId === editFormData.movieId && sRoomId === editFormData.roomId;
      });
      
      const existingIds = existingForGroup.map(s => s._id);
      const selectedIds = editSelectedSlots.filter(s => s._id).map(s => s._id);
      const toDelete = existingIds.filter(id => !selectedIds.includes(id));

      // Delete all old showtimes
      for (const id of toDelete) {
        await deleteShowtime(id);
      }

      // Get movie info
      const movie = movies.find(m => m._id === editFormData.movieId);
      const releaseDate = movie?.releaseDate ? new Date(movie.releaseDate) : new Date();
      let endDate = movie?.endDate ? new Date(movie.endDate) : new Date(releaseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      releaseDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Generate showtimes for next 7 days
      const currentDate = new Date(releaseDate);
      if (currentDate < new Date()) {
        currentDate.setTime(Date.now());
        currentDate.setHours(0, 0, 0, 0);
      }
      
      let daysCount = 0;
      const maxDays = 7;

      while (currentDate <= endDate && daysCount < maxDays) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        for (const slot of editSelectedSlots.filter(s => !s._id)) {
          const slotTime = new Date(slot.startTime);
          const showtimeDate = new Date(dateStr);
          showtimeDate.setHours(slotTime.getHours(), slotTime.getMinutes(), 0, 0);

          const showtimeData = {
            movieId: editFormData.movieId,
            roomId: editFormData.roomId,
            startTime: showtimeDate.toISOString(),
            duration: slot.movieDuration || 120,
            language: editFormData.language,
            status: editFormData.status
          };
          await createShowtime(showtimeData);
        }

        currentDate.setDate(currentDate.getDate() + 1);
        daysCount++;
      }

      await fetchData();
      setShowEditModal(false);
      setEditingGroup(null);
      setExistingShowtimes([]);
      setEditSelectedSlots([]);
      toast.success('Cập nhật lịch chiếu thành công!');
    } catch (err) {
      toast.error(err.message || 'Failed to update showtimes');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAllEdit = async () => {
    // Delete all showtimes for today (as template)
    // The scheduler will stop generating showtimes for future days
    setDeletingShowtimeIds(existingShowtimes.map(s => s._id));
    setDeletingShowtimeId(null);
    setShowDeleteConfirm(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingGroup(null);
    setExistingShowtimes([]);
    setEditSelectedSlots([]);
    setEditGeneratedSlots([]);
    setIsUpdating(false);
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
                    onClick={() => handleDeleteGroup(group)}
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
              {/* Step 1: Select Movie, Room, Date */}
              <div className="form-row">
                <div className="form-group">
                  <label>Chọn phim *</label>
                  {getAvailableMovies().length === 0 ? (
                    <div style={{
                      padding: '15px',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      color: '#856404'
                    }}>
                      ⚠️ Tất cả các phim đã có suất chiếu. Vui lòng xóa suất chiếu cũ nếu muốn tạo mới.
                    </div>
                  ) : (
                    <select
  value={selectedMovie}
  onChange={(e) => {
    setSelectedMovie(e.target.value);
    setSelectedRoom('');
    setGeneratedSlots([]);
    setSelectedSlots([]);
  }}
  required
  style={{ width: '100%', maxWidth: '300px' }}
>
  <option value="">Chọn phim</option>
  {getAvailableMovies().map(movie => (
    <option key={movie._id} value={movie._id}>
      {movie.title} {movie.duration ? `(${movie.duration} phút)` : ''}
    </option>
  ))}
</select>
                  )}
                </div>
              </div>

              {/* Show rooms as clickable cards */}
              {selectedMovie && getAvailableMovies().length > 0 && (
                <div className="rooms-display">
                  <label style={{display: 'block', marginBottom: '10px', fontWeight: '500'}}>
                    Chọn phòng chiếu:
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    {getRoomsWithMovie(selectedMovie).map(room => (
                      <div
                        key={room._id}
                        onClick={() => {
                          setSelectedRoom(room._id);
                          setGeneratedSlots([]);
                          setSelectedSlots([]);
                        }}
                        style={{
                          padding: '15px',
                          border: selectedRoom === room._id ? '3px solid #28a745' : '1px solid #dee2e6',
                          borderRadius: '8px',
                          background: selectedRoom === room._id ? '#d4edda' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{fontWeight: 'bold', fontSize: '16px'}}>{room.name}</div>
                        <div style={{color: '#666', fontSize: '13px'}}>{room.type} - {room.capacity} ghế</div>
                      </div>
                    ))}
                    {getRoomsWithMovie(selectedMovie).length === 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        padding: '20px',
                        textAlign: 'center',
                        color: '#dc3545',
                        background: '#fff5f5',
                        borderRadius: '8px',
                        border: '1px solid #dc3545'
                      }}>
                        ⚠️ Chưa có phòng nào được gán cho phim này.
                        <br/>
                        Vui lòng gán phim trong "Quản lý Rạp & Phòng Chiếu"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show selected movie and room */}
              {selectedMovie && getAvailableMovies().length > 0 && (
                <div className="selected-info" style={{
                  background: '#e7f3ff',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  border: '1px solid #b3d7ff'
                }}>
                  <p style={{margin: 0, color: '#0056b3'}}>
                    <strong>Phim:</strong> {movies.find(m => m._id === selectedMovie)?.title}
                    {selectedRoom && <span> | <strong>Phòng chiếu:</strong> {rooms.find(r => r._id === selectedRoom)?.name}</span>}
                    {!selectedRoom && getRoomsWithMovie(selectedMovie).length === 0 && 
                      <span style={{color: '#dc3545'}}> | Chưa có phòng được gán cho phim này</span>}
                  </p>
                </div>
              )}

              {/* Step 2: Generate and select time slots */}
              {selectedMovie && selectedRoom && getAvailableMovies().length > 0 && (
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
                disabled={selectedSlots.length === 0 || isSaving}
              >
                {isSaving ? 'Đang lưu...' : `Lưu (${selectedSlots.length}) suất chiếu`}
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
                <label>Thêm giờ chiếu mới (từ khung giờ phòng):</label>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={generateEditTimeSlots}
                  style={{marginTop: '10px'}}
                >
                  🔄 Lấy khung giờ phòng
                </button>

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
                Tổng cộng: <strong>{editSelectedSlots.length}</strong> khung giờ sẽ được lưu cho TẤT CẢ CÁC NGÀY
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
  style={{ width: '100%', maxWidth: '300px' }}
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
                    {getRoomsWithMovie(editFormData.movieId).map(room => (
                      <option key={room._id} value={room._id}>{room.name}</option>
                    ))}
                  </select>
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
                    disabled={editSelectedSlots.length === 0 || isUpdating}
                  >
                    {isUpdating ? 'Đang lưu...' : `Lưu (${editSelectedSlots.length})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận xóa</h3>
              <button className="modal-close" onClick={closeDeleteConfirm}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn xóa {deletingShowtimeIds.length} suất chiếu này?</p>
              <p className="delete-warning">Lưu ý: Hành động này không thể hoàn tác!</p>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="delete-spinner"></span>
                ) : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowtimeManagement;
