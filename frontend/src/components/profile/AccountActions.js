export default function AccountActions({ onOpen }) {
  return (
    <div className="account-actions">
      <button onClick={() => onOpen("info")}>Thay đổi thông tin thành viên</button>
      <button onClick={() => onOpen("password")}>Thay đổi mật khẩu</button>
      <button onClick={() => onOpen("delete")}>Ly khai</button>
    </div>
  );
}