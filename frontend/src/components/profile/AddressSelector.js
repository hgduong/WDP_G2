import { useEffect, useState } from "react";
import { getProvinces, getDistricts, getWards } from "../../services/userApi";

export default function AddressSelector({ formData, setFormData }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    getProvinces().then(setProvinces);
  }, []);

  useEffect(() => {
    if (formData.province) {
      getDistricts(formData.province).then((d) =>
        setDistricts(d.districts || [])
      );
    }
  }, [formData.province]);

  useEffect(() => {
    if (formData.district) {
      getWards(formData.district).then((w) => setWards(w.wards || []));
    }
  }, [formData.district]);

  return (
    <>
      <div >
        <label>Tỉnh/Thành phố</label>
        <select
          value={formData.province}
          onChange={(e) =>
            setFormData({
              ...formData,
              province: e.target.value,
              district: "",
              ward: "",
            })
          }
          required
        >
          <option value="">--Chọn tỉnh/thành phố--</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Quận/Huyện</label>
        <select
          value={formData.district}
          onChange={(e) =>
            setFormData({ ...formData, district: e.target.value, ward: "" })
          }
          required
        >
          <option value="">--Chọn quận/huyện--</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Phường/Xã</label>
        <select
          value={formData.ward}
          onChange={(e) =>
            setFormData({ ...formData, ward: e.target.value })
          }
          required
        >
          <option value="">--Chọn phường/xã--</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Số nhà/Đường</label>
        <input
          type="text"
          name="street"
          value={formData.street}
          onChange={(e) =>
            setFormData({ ...formData, street: e.target.value })
          }
          placeholder="Nhập số nhà, tên đường"
          required
        />
      </div>
    </>
  );
}
