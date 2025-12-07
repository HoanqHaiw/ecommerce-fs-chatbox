import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Component/Navbar";
import Footer from "../Component/Footer";
import "../scss/checkOrder.scss";
import jsPDF from "jspdf";
import "jspdf-autotable";

const CheckOrder = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [user, setUser] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        try {
            const userInfo = localStorage.getItem("userInfo");
            console.log(" Kiểm tra auth - UserInfo:", userInfo);

            if (userInfo) {
                const parsedUser = JSON.parse(userInfo);
                console.log(" User đã đăng nhập:", parsedUser);
                setUser(parsedUser);
                fetchUserOrders(parsedUser.email);
            } else {
                console.log(" Chưa đăng nhập");
                setUser(null);
                setLoading(false);
                setError("Vui lòng đăng nhập để xem đơn hàng của bạn");
            }
        } catch (error) {
            console.error("Lỗi kiểm tra auth:", error);
            setUser(null);
            setLoading(false);
            setError("Lỗi xác thực người dùng");
        }
    };

    const fetchUserOrders = async (userEmail) => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            console.log(" Fetching orders từ backend cho user:", userEmail);

            const res = await fetch(`http://localhost:5000/api/orders`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            console.log(" Response status:", res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error(" Lỗi response:", errorText);
                throw new Error(`Không thể tải dữ liệu đơn hàng: ${res.status}`);
            }

            const data = await res.json();
            console.log("Orders data từ backend:", data);
            let userOrders = [];

            if (data.success && Array.isArray(data.orders)) {
                userOrders = data.orders.filter(order =>
                    order.email && order.email.toLowerCase() === userEmail.toLowerCase()
                );
            } else if (Array.isArray(data)) {
                userOrders = data.filter(order =>
                    order.email && order.email.toLowerCase() === userEmail.toLowerCase()
                );
            } else if (data.success && Array.isArray(data.data)) {
                userOrders = data.data.filter(order =>
                    order.email && order.email.toLowerCase() === userEmail.toLowerCase()
                );
            }

            console.log(" User orders sau khi filter:", userOrders);

            if (userOrders.length > 0) {
                setOrders(userOrders);
            } else {
                setOrders([]);
                setSuccess("Bạn chưa có đơn hàng nào");
            }

        } catch (error) {
            console.error(" Lỗi fetch orders từ backend:", error);
            setError(`Không thể tải đơn hàng: ${error.message}`);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const refreshOrders = () => {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
            const parsedUser = JSON.parse(userInfo);
            fetchUserOrders(parsedUser.email);
        } else {
            checkAuth();
        }
    };

    const cancelOrder = async (orderId) => {
        if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.")) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                throw new Error(`Lỗi khi hủy đơn hàng: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                setSuccess("Đã hủy đơn hàng thành công");
                refreshOrders();
            } else {
                setError(data.message || "Lỗi khi hủy đơn hàng");
            }
        } catch (error) {
            console.error("Lỗi hủy order:", error);
            setError("Không thể hủy đơn hàng. Vui lòng thử lại.");
        }
    };

    const canCancelOrder = (order) => {
        const cancellableStatuses = ["pending", "confirmed"];
        return cancellableStatuses.includes(order.status);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            "pending": { class: "warning", text: "Chờ xác nhận", icon: "⏳", desc: "Đơn hàng đang chờ xác nhận" },
            "confirmed": { class: "info", text: "Đã xác nhận", icon: "✅", desc: "Đơn hàng đã được xác nhận" },
            "packing": { class: "primary", text: "Đang đóng gói", icon: "📦", desc: "Đơn hàng đang được đóng gói" },
            "shipping": { class: "primary", text: "Đang giao hàng", icon: "🚚", desc: "Đơn hàng đang trên đường giao" },
            "completed": { class: "success", text: "Đã hoàn thành", icon: "🎉", desc: "Đơn hàng đã giao thành công" },
            "cancelled": { class: "danger", text: "Đã hủy", icon: "❌", desc: "Đơn hàng đã bị hủy" },
            "refunded": { class: "secondary", text: "Đã hoàn tiền", icon: "💸", desc: "Đơn hàng đã được hoàn tiền" }
        };

        return statusConfig[status] || { class: "secondary", text: status, icon: "❓", desc: "Trạng thái không xác định" };
    };

    const getStatusColor = (statusClass) => {
        const colors = {
            "warning": [241, 196, 15],
            "info": [52, 152, 219],
            "primary": [41, 128, 185],
            "success": [46, 204, 113],
            "danger": [231, 76, 60],
            "secondary": [149, 165, 166]
        };
        return colors[statusClass] || colors.secondary;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Chưa có ngày";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0) + '₫';
    };

    const getTotalItems = (order) => {
        if (!order.items || !Array.isArray(order.items)) return 0;
        return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
    };

    const getFilteredAndSortedOrders = () => {
        let filtered = orders;

        if (filterStatus !== "all") {
            filtered = filtered.filter(order => order.status === filterStatus);
        }

        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case "oldest":
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case "price_high":
                    return b.total - a.total;
                case "price_low":
                    return a.total - b.total;
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    };

    const getCancelTimeLeft = (createdAt) => {
        const created = new Date(createdAt);
        const now = new Date();
        const timeDiff = now - created;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        const allowedCancelHours = 2;
        if (hoursDiff >= allowedCancelHours) {
            return null;
        }

        const minutesLeft = Math.floor((allowedCancelHours * 60) - (hoursDiff * 60));
        return minutesLeft;
    };

    const generateInvoicePDF = (order) => {
        setIsGeneratingPDF(true);
        try {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const storeInfo = {
                name: "Doan Tong Outlet",
                address: "41 Yên Nội, Quốc Oai, TP. Hà Nội",
                phone: "0389816563",
                email: "support@doantongoutlet.vn",
                website: "https://doantongoutlet.vn",
                taxCode: "0123456789"
            };

            const primaryColor = [41, 128, 185];
            const secondaryColor = [52, 73, 94];

            doc.setFontSize(24);
            doc.setTextColor(...primaryColor);
            doc.setFont("helvetica", "bold");
            doc.text("HÓA ĐƠN BÁN HÀNG", 105, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);
            doc.setFont("helvetica", "normal");
            doc.text(storeInfo.name, 20, 30);
            doc.text(`Địa chỉ: ${storeInfo.address}`, 20, 35);
            doc.text(`Điện thoại: ${storeInfo.phone}`, 20, 40);
            doc.text(`Email: ${storeInfo.email}`, 20, 45);
            doc.text(`MST: ${storeInfo.taxCode}`, 20, 50);

            doc.text(`Mã hóa đơn: HD-${order._id?.slice(-8).toUpperCase()}`, 150, 30);
            doc.text(`Ngày in: ${new Date().toLocaleDateString('vi-VN')}`, 150, 35);
            doc.text(`Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`, 150, 40);
            doc.text(`Khách hàng: ${order.customerName || 'N/A'}`, 150, 45);

            doc.setDrawColor(200, 200, 200);
            doc.line(20, 55, 190, 55);

            doc.setFontSize(12);
            doc.setTextColor(...secondaryColor);
            doc.setFont("helvetica", "bold");
            doc.text("THÔNG TIN KHÁCH HÀNG", 20, 65);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Họ tên: ${order.customerName || 'N/A'}`, 20, 72);
            doc.text(`Email: ${order.email || 'N/A'}`, 20, 77);
            doc.text(`SĐT: ${order.phone || 'N/A'}`, 20, 82);

            if (order.address) {
                const addressText = `${order.address.specific || ''}${order.address.specific ? ', ' : ''}${order.address.ward || ''}${order.address.ward ? ', ' : ''}${order.address.district || ''}${order.address.district ? ', ' : ''}${order.address.city || ''}`;
                doc.text(`Địa chỉ: ${addressText}`, 20, 87);
            }

            const tableTop = 95;

            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(...primaryColor);
            doc.rect(20, tableTop, 170, 8, 'F');

            doc.text("STT", 25, tableTop + 5.5);
            doc.text("Tên sản phẩm", 40, tableTop + 5.5);
            doc.text("Đơn giá", 110, tableTop + 5.5);
            doc.text("SL", 135, tableTop + 5.5);
            doc.text("Thành tiền", 160, tableTop + 5.5);

            let currentY = tableTop + 15;
            let rowHeight = 10;

            if (order.items && order.items.length > 0) {
                order.items.forEach((item, index) => {
                    if (currentY > 250) {
                        doc.addPage();
                        currentY = 20;
                    }

                    if (index % 2 === 0) {
                        doc.setFillColor(245, 245, 245);
                        doc.rect(20, currentY - 5, 170, rowHeight, 'F');
                    }

                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont("helvetica", "normal");

                    doc.text((index + 1).toString(), 25, currentY);
                    doc.text(item.name || 'Sản phẩm', 40, currentY);
                    doc.text(formatCurrency(item.price), 110, currentY);
                    doc.text(item.quantity.toString(), 135, currentY);
                    doc.text(formatCurrency(item.price * item.quantity), 160, currentY);

                    if (item.size || item.color) {
                        doc.setFontSize(8);
                        doc.setTextColor(100, 100, 100);
                        let extraInfo = [];
                        if (item.size) extraInfo.push(`Size: ${item.size}`);
                        if (item.color) extraInfo.push(`Màu: ${item.color}`);
                        doc.text(extraInfo.join(' | '), 40, currentY + 4);
                    }

                    currentY += rowHeight;
                });
            }

            const summaryTop = Math.max(currentY + 10, 180);

            doc.setFontSize(11);
            doc.setTextColor(...secondaryColor);
            doc.setFont("helvetica", "bold");

            doc.text("Tổng tiền hàng:", 130, summaryTop);
            doc.text(formatCurrency(order.subtotal || order.total), 160, summaryTop);

            doc.text("Phí vận chuyển:", 130, summaryTop + 8);
            doc.text(formatCurrency(order.shippingFee || 0), 160, summaryTop + 8);

            if (order.discount > 0) {
                doc.setTextColor(231, 76, 60);
                doc.text(`Giảm giá (${order.discount}%):`, 130, summaryTop + 16);
                doc.text(`-${formatCurrency((order.subtotal * order.discount) / 100)}`, 160, summaryTop + 16);
            }

            const totalTop = summaryTop + (order.discount > 0 ? 24 : 16);
            doc.setDrawColor(...primaryColor);
            doc.line(130, totalTop - 2, 170, totalTop - 2);

            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.setFont("helvetica", "bold");
            doc.text("TỔNG CỘNG:", 130, totalTop + 8);
            doc.text(formatCurrency(order.total), 160, totalTop + 8);

            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);
            doc.setFont("helvetica", "normal");
            doc.text(`Phương thức: ${order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : "Chuyển khoản"}`, 20, totalTop + 20);

            const status = getStatusBadge(order.status);
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(...getStatusColor(status.class));
            const statusWidth = doc.getTextWidth(status.text) + 10;
            doc.rect(150, totalTop + 15, statusWidth, 8, 'F');
            doc.text(status.text, 155, totalTop + 20);

            const footerTop = totalTop + 40;

            doc.setFontSize(10);
            doc.setTextColor(...secondaryColor);

            doc.line(40, footerTop + 20, 80, footerTop + 20);
            doc.text("Người mua hàng", 50, footerTop + 25, { align: "center" });
            doc.text("(Ký và ghi rõ họ tên)", 50, footerTop + 30, { align: "center" });

            doc.line(110, footerTop + 20, 150, footerTop + 20);
            doc.text("Người bán hàng", 130, footerTop + 25, { align: "center" });
            doc.text("(Ký và ghi rõ họ tên)", 130, footerTop + 30, { align: "center" });

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text("Lưu ý:", 20, footerTop + 45);
            doc.text("- Hóa đơn có giá trị thanh toán và bảo hành sản phẩm", 20, footerTop + 50);
            doc.text("- Thời hạn bảo hành: 12 tháng kể từ ngày mua", 20, footerTop + 55);
            doc.text("- Đổi trả trong vòng 7 ngày nếu sản phẩm lỗi", 20, footerTop + 60);
            doc.text(`- Liên hệ hotline ${storeInfo.phone} để được hỗ trợ`, 20, footerTop + 65);

            doc.setFontSize(11);
            doc.setTextColor(...primaryColor);
            doc.setFont("helvetica", "italic");
            doc.text("Cảm ơn quý khách đã mua sắm tại TECHSTORE!", 105, footerTop + 80, { align: "center" });

            const fileName = `Hoa-don-${order._id?.slice(-8).toUpperCase()}-${new Date().getTime()}.pdf`;
            doc.save(fileName);

            setSuccess("Đã tải xuống hóa đơn thành công!");

        } catch (error) {
            console.error("Lỗi tạo PDF:", error);
            setError("Không thể tạo hóa đơn. Vui lòng thử lại.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const filteredOrders = getFilteredAndSortedOrders();

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="container py-5">
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted">Đang tải đơn hàng của bạn...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className="check-order-page container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-12">
                        <div className="text-center mb-5">
                            <h1 className="display-5 fw-bold text-primary mb-3">
                                <i className="fas fa-shopping-bag me-3"></i>
                                Đơn Hàng Của Tôi
                            </h1>
                            <p className="text-muted">
                                {user ? `Xin chào ${user.username || user.name || user.email}, đây là các đơn hàng của bạn` : "Đăng nhập để xem đơn hàng của bạn"}
                            </p>
                        </div>

                        {!user && (
                            <div className="alert alert-warning text-center">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Vui lòng đăng nhập để xem đơn hàng của bạn.
                                <Link to="/login" className="btn btn-primary ms-3">
                                    Đăng nhập ngay
                                </Link>
                            </div>
                        )}

                        {user && orders.length > 0 && (
                            <div className="filter-section card shadow-sm mb-4">
                                <div className="card-body">
                                    <div className="row g-3 align-items-center">
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                <i className="fas fa-filter me-2"></i>
                                                Lọc theo trạng thái
                                            </label>
                                            <select
                                                className="form-select"
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                            >
                                                <option value="all">Tất cả trạng thái</option>
                                                <option value="pending">Chờ xác nhận</option>
                                                <option value="confirmed">Đã xác nhận</option>
                                                <option value="packing">Đang đóng gói</option>
                                                <option value="shipping">Đang giao hàng</option>
                                                <option value="completed">Đã hoàn thành</option>
                                                <option value="cancelled">Đã hủy</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">
                                                <i className="fas fa-sort me-2"></i>
                                                Sắp xếp theo
                                            </label>
                                            <select
                                                className="form-select"
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                            >
                                                <option value="newest">Mới nhất</option>
                                                <option value="oldest">Cũ nhất</option>
                                                <option value="price_high">Giá cao nhất</option>
                                                <option value="price_low">Giá thấp nhất</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4 d-flex align-items-end">
                                            <button
                                                className="btn btn-outline-primary w-100"
                                                onClick={refreshOrders}
                                                disabled={loading}
                                            >
                                                <i className="fas fa-sync-alt me-2"></i>
                                                {loading ? "Đang tải..." : "Làm mới"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger d-flex align-items-center">
                                <i className="fas fa-exclamation-triangle me-3 fs-5"></i>
                                <div>{error}</div>
                                <button
                                    className="btn btn-sm btn-outline-danger ms-auto"
                                    onClick={refreshOrders}
                                >
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success d-flex align-items-center">
                                <i className="fas fa-check-circle me-3 fs-5"></i>
                                <div>{success}</div>
                            </div>
                        )}

                        {user && filteredOrders.length > 0 && (
                            <div className="orders-section">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="mb-0">
                                        <i className="fas fa-list me-2"></i>
                                        Đơn hàng của bạn ({filteredOrders.length})
                                    </h4>
                                    <div className="text-muted small">
                                        Hiển thị {filteredOrders.length} trên tổng số {orders.length} đơn hàng
                                    </div>
                                </div>

                                <div className="orders-list">
                                    {filteredOrders.map((order) => {
                                        const status = getStatusBadge(order.status);
                                        const totalItems = getTotalItems(order);
                                        const cancelTimeLeft = getCancelTimeLeft(order.createdAt);

                                        return (
                                            <div key={order._id} className="order-card card mb-4 shadow-sm border-0">
                                                <div className="card-header bg-light border-0 py-3">
                                                    <div className="row align-items-center">
                                                        <div className="col-md-6">
                                                            <div className="d-flex align-items-center flex-wrap gap-3">
                                                                <div className="d-flex align-items-center">
                                                                    <i className="fas fa-receipt text-primary me-2"></i>
                                                                    <div>
                                                                        <strong>Mã đơn: </strong>
                                                                        <span className="text-primary">#{order._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                                {cancelTimeLeft && canCancelOrder(order) && (
                                                                    <span className="badge bg-warning text-dark">
                                                                        <i className="fas fa-clock me-1"></i>
                                                                        Có thể hủy trong {cancelTimeLeft} phút
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 text-md-end">
                                                            <div className="d-flex flex-column flex-md-row justify-content-md-end align-items-md-center gap-2">
                                                                <small className="text-muted">
                                                                    {formatDate(order.createdAt)}
                                                                </small>
                                                                <span className={`badge bg-${status.class} px-3 py-2`}>
                                                                    {status.icon} {status.text}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="card-body py-4">
                                                    <h6 className="fw-semibold mb-3">
                                                        <i className="fas fa-box me-2"></i>
                                                        Sản phẩm đã đặt
                                                    </h6>
                                                    <div className="order-items mb-4">
                                                        {order.items && order.items.slice(0, 3).map((item, index) => (
                                                            <div key={index} className="order-item d-flex align-items-center border-bottom py-3">
                                                                <img
                                                                    src={item.image?.startsWith("http")
                                                                        ? item.image
                                                                        : `http://localhost:5000/${item.image}`
                                                                    }
                                                                    alt={item.name}
                                                                    className="item-image me-3 rounded"
                                                                    style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                                                    onError={(e) => {
                                                                        e.target.src = "/default-image.jpg";
                                                                    }}
                                                                />
                                                                <div className="flex-grow-1">
                                                                    <div className="fw-semibold">{item.name || 'Sản phẩm'}</div>
                                                                    <div className="text-muted small">
                                                                        {item.size && `Size: ${item.size} • `}
                                                                        {item.color && `Màu: ${item.color} • `}
                                                                        Số lượng: {item.quantity} × {formatCurrency(item.price)}
                                                                    </div>
                                                                </div>
                                                                <div className="text-end">
                                                                    <div className="text-success fw-bold">
                                                                        {formatCurrency((item.price || 0) * (item.quantity || 0))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {order.items && order.items.length > 3 && (
                                                            <div className="text-center text-muted small py-2">
                                                                +{order.items.length - 3} sản phẩm khác
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-center border-top pt-3">
                                                        <div className="d-flex align-items-center flex-wrap gap-3">
                                                            <small className="text-muted">
                                                                {totalItems} sản phẩm
                                                            </small>
                                                            <strong className="fs-5">Tổng tiền: </strong>
                                                            <span className="text-success fw-bold fs-5">
                                                                {formatCurrency(order.total)}
                                                            </span>
                                                            {order.paymentMethod && (
                                                                <small className="text-muted">
                                                                    • {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : "Chuyển khoản"}
                                                                </small>
                                                            )}
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-outline-primary"
                                                                onClick={() => setSelectedOrder(order)}
                                                            >
                                                                <i className="fas fa-eye me-1"></i>
                                                                Chi tiết
                                                            </button>
                                                            {canCancelOrder(order) && (
                                                                <button
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => cancelOrder(order._id)}
                                                                    disabled={!cancelTimeLeft}
                                                                    title={!cancelTimeLeft ? "Đã hết thời gian hủy đơn" : ""}
                                                                >
                                                                    <i className="fas fa-times me-1"></i>
                                                                    Hủy đơn
                                                                </button>
                                                            )}
                                                            {order.status === "completed" && (
                                                                <button className="btn btn-outline-success">
                                                                    <i className="fas fa-redo me-1"></i>
                                                                    Mua lại
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {user && orders.length === 0 && !loading && !error && (
                            <div className="text-center py-5">
                                <div className="empty-state-icon mb-4">
                                    <i className="fas fa-shopping-bag fa-4x text-muted"></i>
                                </div>
                                <h5 className="text-muted mb-3">Bạn chưa có đơn hàng nào</h5>
                                <p className="text-muted mb-4">
                                    Hãy bắt đầu mua sắm và khám phá các sản phẩm tuyệt vời của chúng tôi
                                </p>
                                <Link to="/products" className="btn btn-primary btn-lg">
                                    <i className="fas fa-shopping-bag me-2"></i>
                                    Mua sắm ngay
                                </Link>
                            </div>
                        )}

                        {user && filteredOrders.length === 0 && orders.length > 0 && (
                            <div className="text-center py-5">
                                <div className="empty-state-icon mb-4">
                                    <i className="fas fa-filter fa-4x text-muted"></i>
                                </div>
                                <h5 className="text-muted mb-3">Không tìm thấy đơn hàng phù hợp</h5>
                                <p className="text-muted mb-4">
                                    Không có đơn hàng nào với trạng thái đã chọn
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setFilterStatus("all")}
                                >
                                    <i className="fas fa-redo me-2"></i>
                                    Xem tất cả đơn hàng
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        onCancelOrder={cancelOrder}
                        getStatusBadge={getStatusBadge}
                        formatDate={formatDate}
                        formatCurrency={formatCurrency}
                        canCancelOrder={canCancelOrder}
                        generateInvoicePDF={generateInvoicePDF}
                        isGeneratingPDF={isGeneratingPDF}
                    />
                )}
            </div>

        </>
    );
};

const OrderDetailModal = ({ order, onClose, onCancelOrder, getStatusBadge, formatDate, formatCurrency, canCancelOrder, generateInvoicePDF, isGeneratingPDF }) => {
    const status = getStatusBadge(order.status);

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className="fas fa-receipt me-2"></i>
                            Chi tiết đơn hàng #{order._id?.slice(-8).toUpperCase() || 'N/A'}
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <h6 className="fw-semibold">
                                    <i className="fas fa-user me-2"></i>
                                    Thông tin khách hàng
                                </h6>
                                <p><strong>Họ tên:</strong> {order.customerName || 'N/A'}</p>
                                <p><strong>Email:</strong> {order.email || 'N/A'}</p>
                                <p><strong>Điện thoại:</strong> {order.phone || 'N/A'}</p>
                            </div>
                            <div className="col-md-6">
                                <h6 className="fw-semibold">
                                    <i className="fas fa-map-marker-alt me-2"></i>
                                    Địa chỉ giao hàng
                                </h6>
                                <p>
                                    {order.address ?
                                        `${order.address.specific || ''}${order.address.specific ? ', ' : ''}${order.address.ward || ''}${order.address.ward ? ', ' : ''}${order.address.district || ''}${order.address.district ? ', ' : ''}${order.address.city || ''}`
                                        : 'Chưa có địa chỉ'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="status-timeline mb-4">
                            <h6 className="fw-semibold mb-3">
                                <i className="fas fa-map-signs me-2"></i>
                                Trạng thái đơn hàng
                            </h6>
                            <div className="timeline">
                                <div className={`timeline-item ${['pending', 'confirmed', 'packing', 'shipping', 'completed'].includes(order.status) ? 'active' : ''}`}>
                                    <i className="fas fa-clock"></i>
                                    <span>Chờ xác nhận</span>
                                </div>
                                <div className={`timeline-item ${['confirmed', 'packing', 'shipping', 'completed'].includes(order.status) ? 'active' : ''}`}>
                                    <i className="fas fa-check"></i>
                                    <span>Đã xác nhận</span>
                                </div>
                                <div className={`timeline-item ${['packing', 'shipping', 'completed'].includes(order.status) ? 'active' : ''}`}>
                                    <i className="fas fa-box"></i>
                                    <span>Đóng gói</span>
                                </div>
                                <div className={`timeline-item ${['shipping', 'completed'].includes(order.status) ? 'active' : ''}`}>
                                    <i className="fas fa-shipping-fast"></i>
                                    <span>Đang giao</span>
                                </div>
                                <div className={`timeline-item ${order.status === 'completed' ? 'active' : ''}`}>
                                    <i className="fas fa-flag-checkered"></i>
                                    <span>Hoàn thành</span>
                                </div>
                            </div>
                        </div>

                        <div className="order-items-full mb-4">
                            <h6 className="fw-semibold mb-3">
                                <i className="fas fa-boxes me-2"></i>
                                Sản phẩm trong đơn hàng
                            </h6>
                            {order.items && order.items.map((item, index) => (
                                <div key={index} className="order-item d-flex align-items-center border-bottom py-3">
                                    <img
                                        src={item.image?.startsWith("http")
                                            ? item.image
                                            : `http://localhost:5000/${item.image}`
                                        }
                                        alt={item.name}
                                        className="item-image me-3 rounded"
                                        style={{ width: "80px", height: "80px", objectFit: "cover" }}
                                        onError={(e) => {
                                            e.target.src = "/default-image.jpg";
                                        }}
                                    />
                                    <div className="flex-grow-1">
                                        <div className="fw-semibold h6">{item.name || 'Sản phẩm'}</div>
                                        <div className="text-muted small mb-2">
                                            {item.size && `Size: ${item.size} • `}
                                            {item.color && `Màu: ${item.color} • `}
                                            Số lượng: {item.quantity}
                                        </div>
                                        <div className="text-success fw-bold h6">
                                            {formatCurrency((item.price || 0) * (item.quantity || 0))}
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <div className="text-muted small">
                                            {formatCurrency(item.price)} × {item.quantity}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="order-summary card border-0 bg-light">
                            <div className="card-body">
                                <h6 className="fw-semibold mb-3">Thông tin thanh toán</h6>
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Tổng tiền hàng:</strong> {formatCurrency(order.subtotal || order.total)}</p>
                                        <p><strong>Phí vận chuyển:</strong> {formatCurrency(order.shippingFee || 0)}</p>
                                        {order.discount > 0 && (
                                            <p className="text-success">
                                                <strong>Giảm giá:</strong> -{formatCurrency((order.subtotal * order.discount) / 100)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Phương thức thanh toán:</strong> {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : "Chuyển khoản"}</p>
                                        <p><strong>Tổng thanh toán:</strong> <span className="text-success fw-bold fs-5">{formatCurrency(order.total)}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        {canCancelOrder(order) && (
                            <button
                                className="btn btn-danger me-auto"
                                onClick={() => {
                                    onCancelOrder(order._id);
                                    onClose();
                                }}
                            >
                                <i className="fas fa-times me-1"></i>
                                Hủy đơn hàng
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => generateInvoicePDF(order)}
                            disabled={isGeneratingPDF}
                        >
                            <i className="fas fa-print me-1"></i>
                            {isGeneratingPDF ? 'Đang tạo...' : 'In hóa đơn '}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckOrder;