import React from "react";

const RoomTable = ({
  rooms,
  movies,
  getMoviesForRoom,
  onEditRoom,
  onDeleteClick,
  onOpenSeatConfig,
}) => {
  const getRoomTypeBadge = (type) => {
    const typeClasses = {
      Standard: "badge-info",
      VIP: "badge-warning",
      IMAX: "badge-primary",
    };
    return (
      <span className={`badge ${typeClasses[type] || "badge-info"}`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status) => (
    <span
      className={`badge ${status === "Active" ? "badge-success" : "badge-secondary"}`}
    >
      {status === "Active" ? "Hoạt động" : "Ngừng hoạt động"}
    </span>
  );

  return (
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
          {rooms.map((room, index) => {
            const movieList = getMoviesForRoom(room);
            return (
              <tr key={room._id}>
                <td>{index + 1}</td>
                <td>{room.name}</td>
                <td>{getRoomTypeBadge(room.type)}</td>
                <td>{room.seats?.length || 0}</td>
                <td>
                  {movieList && movieList.length > 0 ? (
                    <div className="movie-list">
                      {movieList.map((movie, i) => (
                        <span key={i} className="movie-playing">
                          {movie?.title || "Phim đã xóa"}
                          {i < movieList.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="no-movie">Chưa có phim</span>
                  )}
                </td>
                <td>{getStatusBadge(room.status)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-seat-config"
                    style={{ marginRight: '6px' }}
                    onClick={() => onOpenSeatConfig(room)}
                  >
                    Cấu hình ghế
                  </button>
                  <button
                    className="btn btn-sm btn-edit"
                    style={{ marginRight: '6px' }}
                    onClick={() => onEditRoom(room)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => onDeleteClick(room._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
          {rooms.length === 0 && (
            <tr>
              <td colSpan="7" className="no-data">
                Không có phòng nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RoomTable;
