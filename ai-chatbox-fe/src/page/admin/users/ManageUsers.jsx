import React, { useState, useEffect } from "react";
import API from "../../../api/userApi";
import { useNavigate } from "react-router-dom";
import "../scssa/user.scss";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Lấy danh sách users
    const fetchUsers = async () => {
        try {
            const response = await API.get("/users");
            console.log("Users data:", response.data);
            setUsers(response.data);
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Không thể tải danh sách users: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Xóa người dùng
    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}"?`)) {
            try {
                await API.delete(`/users/${userId}`);
                alert("Xóa người dùng thành công!");
                fetchUsers(); // Load lại danh sách
            } catch (error) {
                console.error("Lỗi khi xóa user:", error);
                alert("Không thể xóa người dùng: " + error.message);
            }
        }
    };

    // Nâng cấp/VIP người dùng
    const handleUpgradeUser = async (userId, userName, currentVIPStatus) => {
        const newStatus = !currentVIPStatus;
        const action = newStatus ? "nâng cấp VIP" : "hủy VIP";

        if (window.confirm(`Bạn có chắc chắn muốn ${action} cho người dùng "${userName}"?`)) {
            try {
                await API.put("/users/update-vip", {
                    userId,
                    vipStatus: newStatus
                });
                alert(`${action} thành công!`);
                fetchUsers(); // Load lại danh sách
            } catch (error) {
                console.error("Lỗi khi cập nhật VIP:", error);
                alert("Không thể cập nhật VIP: " + error.message);
            }
        }
    };

    // Quay lại trang trước
    const handleGoBack = () => {
        navigate(-1); // Quay lại trang trước
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }

    return (
        <div className="user-management">
            {/* Header với nút quay lại */}
            <div className="page-header">
                <button className="btn-back" onClick={handleGoBack}>
                    ← Quay lại
                </button>
                <h1>Quản lý Người dùng</h1>
                <div style={{ width: '100px' }}></div> {/* For spacing */}
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Tên</th>
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>VIP Status</th>
                            <th>Ngày tạo</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name || user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || 'Chưa có'}</td>
                                    <td>
                                        <span className={`vip-status ${user.vipStatus}`}>
                                            {user.vipStatus ? 'VIP' : 'Thường'}
                                        </span>
                                    </td>
                                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            {/* Nút nâng cấp VIP */}
                                            <button
                                                className={`btn-upgrade ${user.vipStatus ? 'btn-downgrade' : ''}`}
                                                onClick={() => handleUpgradeUser(
                                                    user._id,
                                                    user.name || user.username,
                                                    user.vipStatus
                                                )}
                                            >
                                                {user.vipStatus ? 'Hủy VIP' : 'Nâng cấp VIP'}
                                            </button>

                                            {/* Nút xóa */}
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDeleteUser(
                                                    user._id,
                                                    user.name || user.username
                                                )}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                    Không có dữ liệu users
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="user-stats">
                <div className="stat-card">
                    <h3>Tổng số người dùng</h3>
                    <p>{users.length}</p>
                </div>
                <div className="stat-card">
                    <h3>VIP Users</h3>
                    <p>{users.filter(user => user.vipStatus).length}</p>
                </div>
                <div className="stat-card">
                    <h3>Users Thường</h3>
                    <p>{users.filter(user => !user.vipStatus).length}</p>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;