import React, { useState, useEffect } from 'react';
import { 
  getAllMovies, 
  createMovie, 
  updateMovie, 
  deleteMovie 
} from '../../services/api';
import './AdminManagement.css';

const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Romance', 
  'Sci-Fi', 'Animation', 'Documentary', 'Fantasy', 'Adventure', 
  'Crime', 'Mystery', 'Family', 'Musical', 'War', 'Western'
];

const STATUS_OPTIONS = ['ComingSoon', 'NowShowing', 'Ended'];

const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    duration: '',
    releaseDate: '',
    endDate: '',
    language: '',
    director: '',
    cast: '',
    rating: '',
    posterUrl: '',
    trailerUrl: '',
    status: 'ComingSoon'
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const data = await getAllMovies();
      setMovies(data);
      setError('');
    } catch (err) {
      setError('Failed to load movies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const movieData = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
      };

      if (editingMovie) {
        await updateMovie(editingMovie._id, movieData);
      } else {
        await createMovie(movieData);
      }
      
      await fetchMovies();
      closeModal();
    } catch (err) {
      setError(err.message || 'Failed to save movie');
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || '',
      description: movie.description || '',
      genre: movie.genre || '',
      duration: movie.duration || '',
      releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
      endDate: movie.endDate ? movie.endDate.split('T')[0] : '',
      language: movie.language || '',
      director: movie.director || '',
      cast: movie.cast || '',
      rating: movie.rating || '',
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || '',
      status: movie.status || 'ComingSoon'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;
    
    try {
      await deleteMovie(id);
      await fetchMovies();
    } catch (err) {
      setError(err.message || 'Failed to delete movie');
    }
  };

  const openAddModal = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      genre: '',
      duration: '',
      releaseDate: '',
      endDate: '',
      language: '',
      director: '',
      cast: '',
      rating: '',
      posterUrl: '',
      trailerUrl: '',
      status: 'ComingSoon'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMovie(null);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'ComingSoon': 'badge-warning',
      'NowShowing': 'badge-success',
      'Ended': 'badge-secondary'
    };
    return (
      <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
        {status === 'ComingSoon' ? 'Sắp chiếu' : status === 'NowShowing' ? 'Đang chiếu' : 'Đã kết thúc'}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý Phim</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Thêm Phim Mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Poster</th>
              <th>Tên Phim</th>
              <th>Thể loại</th>
              <th>Thời lượng</th>
              <th>Ngày chiếu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => (
              <tr key={movie._id}>
                <td>{index + 1}</td>
                <td>
                  {movie.posterUrl ? (
                    <img 
                      src={movie.posterUrl} 
                      alt={movie.title} 
                      className="table-poster"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <span className="no-poster">No Image</span>
                  )}
                </td>
                <td>{movie.title}</td>
                <td>{movie.genre}</td>
                <td>{movie.duration ? `${movie.duration} phút` : '-'}</td>
                <td>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : '-'}</td>
                <td>{getStatusBadge(movie.status)}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(movie)}
                  >
                    Sửa
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDelete(movie._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr>
                <td colSpan="8" className="no-data">Không có phim nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMovie ? 'Sửa Phim' : 'Thêm Phim Mới'}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tên phim *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Thể loại</label>
                  <select name="genre" value={formData.genre} onChange={handleInputChange}>
                    <option value="">Chọn thể loại</option>
                    {GENRES.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời lượng (phút)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Ngôn ngữ</label>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày khởi chiếu</label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Đạo diễn</label>
                  <input
                    type="text"
                    name="director"
                    value={formData.director}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>
                        {status === 'ComingSoon' ? 'Sắp chiếu' : status === 'NowShowing' ? 'Đang chiếu' : 'Đã kết thúc'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Diễn viên</label>
                <input
                  type="text"
                  name="cast"
                  value={formData.cast}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>URL Poster</label>
                  <input
                    type="url"
                    name="posterUrl"
                    value={formData.posterUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>URL Trailer</label>
                  <input
                    type="url"
                    name="trailerUrl"
                    value={formData.trailerUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {formData.posterUrl && (
                <div className="form-group">
                  <label>Xem trước Poster</label>
                  <img 
                    src={formData.posterUrl} 
                    alt="Preview" 
                    className="poster-preview"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMovie ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieManagement;
