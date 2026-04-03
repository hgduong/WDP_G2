import React, { useEffect, useState } from "react";
import {
  getAllActors,
  createActor,
  updateActor,
  deleteActor,
} from "../../services/actorsApi";
import { getAllMovies } from "../../services/moviesApi";
import { toast } from "react-toastify";
import "./AdminManagement.css";

const ActorsManagement = () => {
  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };
  const [actors, setActors] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMovieFilter, setSelectedMovieFilter] = useState("");
  const [selectedGenderFilter, setSelectedGenderFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingActor, setEditingActor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    description: "",
  });

  useEffect(() => {
    fetchActors();
    fetchMovies();
  }, []);

  const fetchActors = async () => {
    try {
      setLoading(true);
      const data = await getAllActors();
      setActors(data);
      setError("");
    } catch (err) {
      setError("Không thể tải danh sách diễn viên");
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

  const getMovieTitles = (movieIds) => {
    if (!Array.isArray(movieIds) || movieIds.length === 0) return "-";
    const movieMap = new Map(movies.map((movie) => [movie._id, movie.title]));
    const titles = movieIds
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return movieMap.get(item) || null;
        if (item.title) return item.title;
        return movieMap.get(item._id) || null;
      })
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
    setEditingActor(null);
    setFormData({ name: "", dateOfBirth: "", gender: "", nationality: "", description: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingActor(null);
  };

  const handleEdit = (actor) => {
    setEditingActor(actor);
    setFormData({
      name: actor.name || "",
      dateOfBirth: actor.dateOfBirth ? actor.dateOfBirth.split("T")[0] : "",
      gender: actor.gender || "",
      nationality: actor.nationality || "",
      description: actor.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingActor) {
        await updateActor(editingActor._id, formData);
        toast.success("Cập nhật diễn viên thành công!");
      } else {
        await createActor(formData);
        toast.success("Thêm diễn viên mới thành công!");
      }

      await fetchActors();
      closeModal();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi lưu diễn viên";
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
      await deleteActor(deletingId);
      await fetchActors();
      toast.success("Xóa diễn viên thành công!");
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi xóa diễn viên";
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

  const filteredActors = selectedMovieFilter || selectedGenderFilter
    ? actors.filter((actor) => {
        const matchesMovie = selectedMovieFilter
          ? normalizeMovieIds(actor.movies).includes(selectedMovieFilter)
          : true;
        const matchesGender = selectedGenderFilter
          ? actor.gender === selectedGenderFilter
          : true;
        return matchesMovie && matchesGender;
      })
    : actors;

  const itemsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredActors.length / itemsPerPage)
  );
  const pagedActors = filteredActors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMovieFilter, selectedGenderFilter, actors.length]);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý diễn viên</h2>
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
            <option value="">Tất cả diễn viên</option>
            <option value="Nam">Diễn viên Nam</option>
            <option value="Nữ">Diễn viên Nữ</option>
          </select>
          {/*
          <button className="btn btn-primary" onClick={openAddModal}>
            + Thêm diễn viên
          </button>
          */}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên diễn viên</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Quốc tịch</th>
              <th>Phim đã đóng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagedActors.map((actor, index) => (
              <tr key={actor._id}>
                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td>{actor.name}</td>
                <td>{formatDate(actor.dateOfBirth)}</td>
                <td>{actor.gender || "-"}</td>
                <td>{actor.nationality || "-"}</td>
                <td>{getMovieTitles(actor.movies)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => handleEdit(actor)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => handleDeleteClick(actor._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filteredActors.length === 0 && (
              <tr>
                <td colSpan="7" className="no-data">
                  Không có diễn viên nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredActors.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginTop: "16px",
            flexWrap: "wrap"
          }}
        >
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={`page-${i + 1}`}
              className={`btn btn-sm ${
                currentPage === i + 1 ? "btn-primary" : "btn-secondary"
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="btn btn-sm btn-secondary"
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingActor ? "Sửa diễn viên" : "Thêm diễn viên"}</h3>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Tên diễn viên *</label>
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
                <label>Phim đã tham gia (tự động)</label>
                <textarea
                  value={
                    editingActor
                      ? getMovieTitles(editingActor.movies)
                      : "Tự động cập nhật theo Quản lý phim"
                  }
                  rows="2"
                  disabled
                />
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
                  {editingActor ? "Cập nhật" : "Thêm mới"}
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
              <p>Bạn có chắc chắn muốn xóa diễn viên này không?</p>
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

export default ActorsManagement;
