import React, { useState, useEffect } from 'react';
import { 
  getAllCinemas, 
  createCinema, 
  updateCinema, 
  deleteCinema,
  getRoomsByCinema,
  createRoom,
  updateRoom,
  deleteRoom
} from '../../services/api';
import './AdminManagement.css';

const ROOM_TYPES = ['Standard', 'VIP', 'IMAX'];

const CinemaManagement = () => {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCinemaModal, setShowCinemaModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingCinema, setEditingCinema] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [cinemaRooms, setCinemaRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('cinemas');
  
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
    description: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchCinemas();
  }, []);

  useEffect(() => {
    if (selectedCinema) {
      fetchRooms(selectedCinema._id);
    }
  }, [selectedCinema]);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const data = await getAllCinemas();
      setCinemas(data);
      setError('');
    } catch (err) {
      setError('Failed to load cinemas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (cinemaId) => {
    try {
      const data = await getRoomsByCinema(cinemaId);
      setCinemaRooms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCinemaInputChange = (e) => {
    const { name, value } = e.target;
    setCinemaFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoomInputChange = (e) => {
    const { name, value } = e.target;
    setRoomFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCinemaSubmit = async (e) => {
    e.preventDefault();
    try {
      const cinemaData = { ...cinemaFormData };
      
      if (editingCinema) {
        await updateCinema(editingCinema._id, cinemaData);
      } else {
        await createCinema(cinemaData);
      }
      
      await fetchCinemas();
      closeCinemaModal();
    } catch (err) {
      setError(err.message || 'Failed to save cinema');
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        ...roomFormData,
        capacity: parseInt(roomFormData.capacity)
      };
      
      if (editingRoom) {
        await updateRoom(editingRoom._id, roomData);
      } else {
        await createRoom(roomData);
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

  const handleDeleteCinema = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cinema? All rooms will also be deleted.')) return;
    
    try {
      await deleteCinema(id);
      await fetchCinemas();
      if (selectedCinema && selectedCinema._id === id) {
        setSelectedCinema(null);
        setCinemaRooms([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete cinema');
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      cinemaId: room.cinemaId || selectedCinema._id,
      name: room.name || '',
      capacity: room.capacity || '',
      type: room.type || 'Standard',
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

  const openAddCinemaModal = () => {
    setEditingCinema(null);
    setCinemaFormData({
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      description: '',
      status: 'Active'
    });
    setShowCinemaModal(true);
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

      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'cinemas' ? 'active' : ''}`}
          onClick={() => setActiveTab('cinemas')}
        >
          Danh sách Rạp
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
          disabled={!selectedCinema}
        >
          Phòng chiếu {selectedCinema ? `- ${selectedCinema.name}` : ''}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {activeTab === 'cinemas' && (
        <div className="cinemas-section">
          <div className="section-header">
            <h3>Danh sách Rạp</h3>
            <button className="btn btn-primary" onClick={openAddCinemaModal}>
              + Thêm Rạp Mới
            </button>
          </div>

          <div className="cinemas-grid">
            {cinemas.map((cinema) => (
              <div 
                key={cinema._id} 
                className={`cinema-card ${selectedCinema?._id === cinema._id ? 'selected' : ''}`}
                onClick={() => setSelectedCinema(cinema)}
              >
                <div className="cinema-card-header">
                  <h4>{cinema.name}</h4>
                  {getStatusBadge(cinema.status)}
                </div>
                <p className="cinema-address">{cinema.address}, {cinema.city}</p>
                <p className="cinema-info">Số phòng: {cinema.rooms?.length || 0}</p>
                <div className="cinema-actions">
                  <button 
                    className="btn btn-sm btn-edit"
                    onClick={(e) => { e.stopPropagation(); handleEditCinema(cinema); }}
                  >
                    Sửa
                  </button>
                  <button 
                    className="btn btn-sm btn-delete"
                    onClick={(e) => { e.stopPropagation(); handleDeleteCinema(cinema._id); }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
            {cinemas.length === 0 && (
              <p className="no-data">Không có rạp nào</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rooms' && selectedCinema && (
        <div className="rooms-section">
          <div className="section-header">
            <h3>Phòng chiếu của {selectedCinema.name}</h3>
            <button className="btn btn-primary" onClick={openAddRoomModal}>
              + Thêm Phòng Mới
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên phòng</th>
                  <th>Loại phòng</th>
                  <th>Số ghế</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cinemaRooms.map((room, index) => (
                  <tr key={room._id}>
                    <td>{index + 1}</td>
                    <td>{room.name}</td>
                    <td>{getRoomTypeBadge(room.type)}</td>
                    <td>{room.capacity}</td>
                    <td>{getStatusBadge(room.status)}</td>
                    <td>
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
                ))}
                {cinemaRooms.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">Không có phòng nào</td>
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
    </div>
  );
};

export default CinemaManagement;
