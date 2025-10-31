import React, { useState } from "react";
import "../scssa/admin.scss";

const ManageInventory = () => {
    const [inventory, setInventory] = useState([
        { id: 1, product: "Áo thun Lonely Stonie", quantity: 50, status: "In Stock" },
        { id: 2, product: "Giày sneaker basic", quantity: 5, status: "Running Low" },
        { id: 3, product: "Nón lưỡi trai đen", quantity: 0, status: "Sold Out" },
    ]);

    return (
        <div className="admin-container">
            <div className="admin-main">
                <div className="admin-content">
                    <h2>Manage Inventory</h2>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.product}</td>
                                    <td>{item.quantity}</td>
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

                    <div className="inventory-summary">
                        <p>
                            <strong>Total Products:</strong> {inventory.length}
                        </p>
                        <p>
                            <strong>Sold Out:</strong>{" "}
                            {inventory.filter((i) => i.status === "Sold Out").length}
                        </p>
                        <p>
                            <strong>Running Low:</strong>{" "}
                            {inventory.filter((i) => i.status === "Running Low").length}
                        </p>
                    </div>
                </div>
            </div>
            <div>
                <button className="back-home" onClick={() => window.history.back()}>Back</button>
            </div>
        </div>
    );
};

export default ManageInventory;
