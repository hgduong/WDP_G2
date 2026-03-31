import React, { useEffect, useState } from "react";
import {
  getAllDirectors,
  createDirector,
  updateDirector,
  deleteDirector,
} from "../../services/directorsApi";
import { getAllMovies } from "../../services/moviesApi";
import { toast } from "react-toastify";
import "./AdminManagement.css";

const DirectorsManagement = () => {
  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };
  const [directors, setDirectors] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMovieFilter, setSelectedMovieFilter] = useState("");
  const [selectedGenderFilter, setSelectedGenderFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingDirector, setEditingDirector] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    description: "",
    movies: [],
  });

  useEffect(() => {
    fetchDirectors();
    fetchMovies();
  }, []);

  const fetchDirectors = async () => {
    try {
      setLoading(true);
      const data = await getAllDirectors();
      setDirectors(data);
      setError("");
    } catch (err) {
      setError("Không thể tải danh sách đạo diễn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const data = await getAllMovies();
      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMovieToggle = (movieId) => {
    setFormData((prev) => {
      const current = prev.movies || [];
      if (current.includes(movieId)) {
        return { ...prev, movies: current.filter((id) => id !== movieId) };
      }
      return { ...prev, movies: [...current, movieId] };
    });
  };

  const getMovieTitles = (movieIds) => {
    if (!Array.isArray(movieIds) || movieIds.length === 0) return "-";
    const movieMap = new Map(movies.map((movie) => [movie._id, movie.title]));
    const titles = movieIds
      .map((item) => (typeof item === "string" ? item : item?._id))
      .map((id) => movieMap.get(id))
      .filter(Boolean);
    return titles.length > 0 ? titles.join(", ") : "-";
  };

  const normalizeMovieIds = (movieIds) => {
    if (!Array.isArray(movieIds)) return [];
    return movieIds
      .map((item) => (typeof item === "string" ? item : item?._id))
      .filter(Boolean);
  };

  const openAddModal = () => {
    setEditingDirector(null);
    setFormData({ name: "", dateOfBirth: "", gender: "", nationality: "", description: "", movies: [] });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDirector(null);
  };

  const handleEdit = (director) => {
    setEditingDirector(director);
    setFormData({
      name: director.name || "",
      dateOfBirth: director.dateOfBirth ? director.dateOfBirth.split("T")[0] : "",
      gender: director.gender || "",
      nationality: director.nationality || "",
      description: director.description || "",
      movies: Array.isArray(director.movies) ? director.movies.map((m) => (typeof m === "string" ? m : m?._id)).filter(Boolean) : [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingDirector) {
        await updateDirector(editingDirector._id, formData);
        toast.success("Cập nhật đạo diễn thành công!");
      } else {
        await createDirector(formData);
        toast.success("Thêm đạo diễn mới thành công!");
      }

      await fetchDirectors();
      closeModal();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi lưu đạo diễn";
      toast.error(errorMsg);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId || isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteDirector(deletingId);
      await fetchDirectors();
      toast.success("Xóa đạo diễn thành công!");
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi xóa đạo diễn";
      toast.error(errorMsg);
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingId(null);
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  const filteredDirectors = selectedMovieFilter || selectedGenderFilter
    ? directors.filter((director) => {
        const matchesMovie = selectedMovieFilter
          ? normalizeMovieIds(director.movies).includes(selectedMovieFilter)
          : true;
        const matchesGender = selectedGenderFilter
          ? director.gender === selectedGenderFilter
          : true;
        return matchesMovie && matchesGender;
      })
    : directors;

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý đạo diễn</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            className="filter-select"
            value={selectedMovieFilter}
            onChange={(e) => setSelectedMovieFilter(e.target.value)}
          >
            <option value="">Tất cả phim</option>
            {movies.map((movie) => (
              <option key={movie._id} value={movie._id}>
                {movie.title}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={selectedGenderFilter}
            onChange={(e) => setSelectedGenderFilter(e.target.value)}
          >
            <option value="">Tất cả đạo diễn</option>
            <option value="Nam">Đạo diễn Nam</option>
            <option value="Nữ">Đạo diễn Nữ</option>
          </select>
          <button className="btn btn-primary" onClick={openAddModal}>
            + Thêm đạo diễn
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên đạo diễn</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Quốc tịch</th>
              <th>Phim đạo diễn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredDirectors.map((director, index) => (
              <tr key={director._id}>
                <td>{index + 1}</td>
                <td>{director.name}</td>
                <td>{formatDate(director.dateOfBirth)}</td>
                <td>{director.gender || "-"}</td>
                <td>{director.nationality || "-"}</td>
                <td>{getMovieTitles(director.movies)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(director)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDeleteClick(director._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filteredDirectors.length === 0 && (
              <tr>
                <td colSpan="7" className="no-data">
                  Không có đạo diễn nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDirector ? "Sửa đạo diễn" : "Thêm đạo diễn"}</h3>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Tên đạo diễn *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Giới tính</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="">Chọn</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div className="form-group">
                <label>Phim đã tham gia (tick chọn)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "5px" }}>
                  {movies.length === 0 && (
                    <span className="text-muted">Chưa có phim</span>
                  )}
                  {movies.map((movie) => (
                    <label key={movie._id} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.movies.includes(movie._id)}
                        onChange={() => handleMovieToggle(movie._id)}
                      />
                      {movie.title}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Quốc tịch</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                />
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

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDirector ? "Cập nhật" : "Thêm mới"}
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
              <button className="modal-close" onClick={cancelDelete}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa đạo diễn này không?</p>
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
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorsManagement;
