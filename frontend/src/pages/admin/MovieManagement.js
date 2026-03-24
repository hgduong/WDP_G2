import React, { useState, useEffect } from "react";
import {
  getAllMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../../services/api";
import { getImageUrl } from "../../utils/imageUtils";
import { toast } from "react-toastify";
import "./AdminManagement.css";

const GENRES = [
  "Action", "Comedy", "Drama", "Horror", "Thriller", "Romance",
  "Sci-Fi", "Animation", "Documentary", "Fantasy", "Adventure",
  "Crime", "Mystery", "Family", "Musical", "War", "Western",
];

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMovieId, setDeletingMovieId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: [],
    duration: "",
    releaseDate: "",
    endDate: "",
    language: "",
    director: "",
    cast: "",
    rating: "",
    posterUrl: "",
    trailerUrl: "",
    status: "ComingSoon",
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const data = await getAllMovies();
      setMovies(data);
      setError("");
    } catch (err) {
      setError("Không thể tải danh sách phim");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = () => {
    const now = new Date();
    const release = formData.releaseDate ? new Date(formData.releaseDate) : null;
    const end = formData.endDate ? new Date(formData.endDate) : null;
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (!release || !end) return "ComingSoon";
    if (end < now) return "Ended";
    if (release <= now && end >= now) return "NowShowing";
    if (release > now && release <= sevenDaysFromNow) return "ComingSoon";
    return "ComingSoon";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ComingSoon":
        return "Sắp chiếu";
      case "NowShowing":
        return "Đang chiếu";
      case "Ended":
        return "Đã kết thúc";
      default:
        return "Sắp chiếu";
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "ComingSoon":
        return { background: "#ffc107", color: "#000" };
      case "NowShowing":
        return { background: "#28a745", color: "#fff" };
      case "Ended":
        return { background: "#6c757d", color: "#fff" };
      default:
        return { background: "#ffc107", color: "#000" };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenreChange = (genre) => {
    setFormData((prev) => {
      const currentGenres = prev.genre || [];
      if (currentGenres.includes(genre)) {
        return { ...prev, genre: currentGenres.filter((g) => g !== genre) };
      }
      return { ...prev, genre: [...currentGenres, genre] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.releaseDate && formData.endDate) {
      const release = new Date(formData.releaseDate);
      const end = new Date(formData.endDate);

      if (end < release) {
        const releaseStr = formatDate(formData.releaseDate);
        const endStr = formatDate(formData.endDate);
        toast.error(`Ngày kết thúc (${endStr}) phải sau ngày khởi chiếu (${releaseStr})`);
        return;
      }
    }

    try {
      const autoStatus = calculateStatus();

      const movieData = {
        ...formData,
        status: autoStatus,
        duration: formData.duration ? parseInt(formData.duration, 10) : undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
      };

      if (editingMovie) {
        await updateMovie(editingMovie._id, movieData);
        toast.success("Cập nhật phim thành công!");
      } else {
        await createMovie(movieData);
        toast.success("Thêm phim mới thành công!");
      }

      await fetchMovies();
      closeModal();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi lưu phim";
      toast.error(errorMsg);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || "",
      description: movie.description || "",
      genre: movie.genre || [],
      duration: movie.duration || "",
      releaseDate: movie.releaseDate ? movie.releaseDate.split("T")[0] : "",
      endDate: movie.endDate ? movie.endDate.split("T")[0] : "",
      language: movie.language || "",
      director: movie.director || "",
      cast: movie.cast || "",
      rating: movie.rating || "",
      posterUrl: movie.posterUrl || "",
      trailerUrl: movie.trailerUrl || "",
      status: movie.status || "ComingSoon",
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingMovieId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingMovieId || isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteMovie(deletingMovieId);
      await fetchMovies();
      toast.success("Xóa phim thành công!");
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Có lỗi xảy ra khi xóa phim";
      toast.error(errorMsg);
    } finally {
      setShowDeleteConfirm(false);
      setDeletingMovieId(null);
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingMovieId(null);
  };

  const openAddModal = () => {
    setEditingMovie(null);
    setFormData({
      title: "",
      description: "",
      genre: [],
      duration: "",
      releaseDate: "",
      endDate: "",
      language: "",
      director: "",
      cast: "",
      rating: "",
      posterUrl: "",
      trailerUrl: "",
      status: "ComingSoon",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMovie(null);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      ComingSoon: "badge-warning",
      NowShowing: "badge-success",
      Ended: "badge-secondary",
    };
    return (
      <span className={`badge ${statusClasses[status] || "badge-secondary"}`}>
        {status === "ComingSoon" ? "Sắp chiếu" : status === "NowShowing" ? "Đang chiếu" : "Đã kết thúc"}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý phim</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Thêm phim mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Poster</th>
              <th>Tên phim</th>
              <th>Thể loại</th>
              <th>Thời lượng</th>
              <th>Ngày chiếu</th>
              <th>Ngày kết thúc</th>
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
                      src={getImageUrl(movie.posterUrl)}
                      alt={movie.title}
                      className="table-poster"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <span className="no-poster">Không có ảnh</span>
                  )}
                </td>
                <td>{movie.title}</td>
                <td>{movie.genre && Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}</td>
                <td>{movie.duration ? `${movie.duration} phút` : "-"}</td>
                <td>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "-"}</td>
                <td>{movie.endDate ? new Date(movie.endDate).toLocaleDateString("vi-VN") : "-"}</td>
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
                    onClick={() => handleDeleteClick(movie._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr>
                <td colSpan="9" className="no-data">Không có phim nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMovie ? "Sửa phim" : "Thêm phim mới"}</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tên phim *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Thể loại (chọn nhiều)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "5px" }}>
                    {GENRES.map((genre) => (
                      <label key={genre} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={formData.genre && formData.genre.includes(genre)}
                          onChange={() => handleGenreChange(genre)}
                        />
                        {genre}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời lượng (phút)</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Ngôn ngữ</label>
                  <input type="text" name="language" value={formData.language} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày khởi chiếu</label>
                  <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleInputChange} />
                  <small className="text-muted">Phim sẽ là "Sắp chiếu" khi còn 7 ngày nữa mới chiếu</small>
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Trạng thái (tự động tính theo ngày)</label>
                <div
                  style={{
                    padding: "10px 15px",
                    borderRadius: "5px",
                    display: "inline-block",
                    fontWeight: "bold",
                    ...getStatusBadgeStyle(calculateStatus()),
                  }}
                >
                  {getStatusLabel(calculateStatus())}
                </div>
                <small className="text-muted" style={{ display: "block", marginTop: "5px" }}>
                  • ComingSoon: 7 ngày trước ngày chiếu
                  <br />
                  • NowShowing: từ ngày chiếu đến ngày kết thúc
                  <br />
                  • Ended: sau ngày kết thúc
                </small>
              </div>

              <div className="form-group">
                <label>Đạo diễn</label>
                <input type="text" name="director" value={formData.director} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
              </div>

              <div className="form-group">
                <label>Diễn viên</label>
                <input type="text" name="cast" value={formData.cast} onChange={handleInputChange} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>URL Poster</label>
                  <input type="url" name="posterUrl" value={formData.posterUrl} onChange={handleInputChange} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>URL Trailer</label>
                  <input type="url" name="trailerUrl" value={formData.trailerUrl} onChange={handleInputChange} placeholder="https://..." />
                </div>
              </div>

              {formData.posterUrl && (
                <div className="form-group">
                  <label>Xem trước poster</label>
                  <img
                    src={getImageUrl(formData.posterUrl)}
                    alt="Preview"
                    className="poster-preview"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMovie ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={isDeleting ? undefined : cancelDelete}>
          <div
            className={`modal-content modal-small ${isDeleting ? "deleting" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Xác nhận xóa</h3>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa phim này không?</p>
              <p className="text-muted">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={cancelDelete}>
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span>
                    <span className="spinner"></span> Đang xóa...
                  </span>
                ) : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieManagement;
