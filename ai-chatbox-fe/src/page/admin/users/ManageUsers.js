// src/page/admin/users/ManageUsers.js
import React, { useEffect, useState } from "react";
import '../scssa/user.scss';
import { getUserStats } from "../../../api/userService";

const ManageUsers = () => {
    const [stats, setStats] = useState({ today: [], month: [], year: [] });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const data = await getUserStats();
        setStats(data);
    };

    return (
        <div className="admin-container">
            <h2>User Purchase Statistics</h2>

            <section>
                <h3>Today</h3>
                <ul>
                    {stats.today.map((u, i) => (
                        <li key={i}>{u.name} - {u.orders} orders</li>
                    ))}
                </ul>
            </section>

            <section>
                <h3>This Month</h3>
                <ul>
                    {stats.month.map((u, i) => (
                        <li key={i}>{u.name} - {u.orders} orders</li>
                    ))}
                </ul>
            </section>

            <section>
                <h3>This Year</h3>
                <ul>
                    {stats.year.map((u, i) => (
                        <li key={i}>{u.name} - {u.orders} orders</li>
                    ))}
                </ul>
            </section>
            <div>
                <button className="back-home" onClick={() => window.history.back()}>Back</button>
            </div>
        </div>
    );
};

export default ManageUsers;
