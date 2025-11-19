import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../scssa/inventory.scss";

const ITEMS_PER_PAGE = 10;

const ManageInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/products");
                const data = res.data.products;

                const formatted = data.map((item) => ({
                    id: item._id,
                    product: item.name,
                    quantity: item.stock,
                    sizes: item.sizes,
                    category: item.category || "Other",
                    status:
                        item.stock === 0
                            ? "Sold Out"
                            : item.stock <= 10
                                ? "Running Low"
                                : "In Stock",
                    image: item.images?.[0] || "",
                }));

                setInventory(formatted);
            } catch (error) {
                console.error("Lỗi load inventory:", error);
            }
        };
        fetchInventory();
    }, []);

    // Filter + search
    const filteredInventory = inventory.filter((item) => {
        const matchesSearch =
            item.product.toLowerCase().includes(search.toLowerCase()) ||
            item.id.includes(search);

        const matchesStatus =
            statusFilter === "All" || item.status === statusFilter;

        const matchesCategory =
            categoryFilter === "All" || item.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    // Pagination
    const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
    const paginatedData = filteredInventory.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleExport = () => {
        const dataToExport = filteredInventory.map((item) => ({
            ID: item.id,
            Product: item.product,
            Category: item.category,
            TotalStock: item.quantity,
            Sizes: item.sizes.map((s) => `${s.size}:${s.quantity}`).join(", "),
            Status: item.status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "Inventory.xlsx");
    };

    return (
        <div className="admin-container">
            <div className="admin-main">
                <div className="admin-content">
                    <h2>Manage Inventory</h2>

                    {/* Search + Filters + Export */}
                    <div className="inventory-tools">
                        <input
                            type="text"
                            placeholder="Search by name or ID"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">All Status</option>
                            <option value="In Stock">In Stock</option>
                            <option value="Running Low">Running Low</option>
                            <option value="Sold Out">Sold Out</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">All Categories</option>
                            {Array.from(new Set(inventory.map((i) => i.category))).map(
                                (cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                )
                            )}
                        </select>

                        <button onClick={handleExport}>Export Excel</button>
                    </div>

                    {/* Table */}
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>ID</th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Total Stock</th>
                                <th>Sizes</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        {item.image ? (
                                            <img
                                                src={`http://localhost:5000${item.image}`}
                                                alt={item.product}
                                                style={{ width: 50, height: 50, objectFit: "cover" }}
                                            />
                                        ) : (
                                            "No Image"
                                        )}
                                    </td>
                                    <td>{item.id}</td>
                                    <td>{item.product}</td>
                                    <td>{item.category}</td>
                                    <td>{item.quantity}</td>
                                    <td>
                                        {item.sizes.map((s) => (
                                            <div key={s._id}>
                                                {s.size}: {s.quantity}
                                            </div>
                                        ))}
                                    </td>
                                    <td
                                        style={{
                                            color:
                                                item.status === "Sold Out"
                                                    ? "red"
                                                    : item.status === "Running Low"
                                                        ? "orange"
                                                        : "green",
                                        }}
                                    >
                                        {item.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="pagination">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>
                        <span>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="inventory-summary">
                        <p>
                            <strong>Total Products:</strong> {filteredInventory.length}
                        </p>
                        <p>
                            <strong>Sold Out:</strong>{" "}
                            {filteredInventory.filter((i) => i.status === "Sold Out").length}
                        </p>
                        <p>
                            <strong>Running Low:</strong>{" "}
                            {filteredInventory.filter((i) => i.status === "Running Low").length}
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <button className="back-home" onClick={() => window.history.back()}>
                    Back
                </button>
            </div>
        </div>
    );
};

export default ManageInventory;
