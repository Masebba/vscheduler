import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import StudentSidebar from "./StudentSidebar";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaBook, FaPen, FaDollarSign, FaUniversity } from "react-icons/fa";

// Map notification 'type' to an icon
const notificationIcons = {
    timetable: <FaCalendarAlt className="text-blue-500" />,  // Timetable changes
    module: <FaBook className="text-green-500" />,        // New modules
    exam: <FaPen className="text-red-500" />,         // Exam schedules
    fee: <FaDollarSign className="text-yellow-500" />,// Fee reminders
    campus: <FaUniversity className="text-purple-500" /> // Campus announcements
};

export default function StudentMessages() {
    const navigate = useNavigate();
    const user = auth.currentUser;

    // Local state
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState("");

    // Fetch notifications for this student
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) { navigate("/"); return; }
            const q = query(
                collection(db, "notifications"),
                where("recipients", "array-contains", user.uid)
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setNotifications(data);
            setLoading(false);
        };
        fetchNotifications();
    }, [navigate, user]);

    // Mark as read
    const markAsRead = async (id) => {
        const ref = doc(db, "notifications", id);
        await updateDoc(ref, { read: true, readAt: serverTimestamp() });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    // Filtered by type
    const filtered = notifications.filter(n => filterType ? n.type === filterType : true);

    const handleLogout = async () => { await signOut(auth); navigate("/"); };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex h-screen bg-stone-100">
            <StudentSidebar onLogout={handleLogout} />
            <div className="flex-1 ml-64 p-6">
                <h1 className="text-2xl font-semibold mb-4">Notifications</h1>

                {/* Filter by type */}
                <div className="mb-4">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="">All Types</option>
                        <option value="timetable">Timetable Changes</option>
                        <option value="module">New Modules</option>
                        <option value="exam">Exam Schedules</option>
                        <option value="fee">Fee Reminders</option>
                        <option value="campus">Campus Announcements</option>
                    </select>
                </div>

                {filtered.length === 0 ? (
                    <p className="text-gray-600">No notifications.</p>
                ) : (
                    <ul className="space-y-4">
                        {filtered.map(n => (
                            <li
                                key={n.id}
                                className={`p-4 rounded shadow-sm ${n.read ? 'bg-white' : 'bg-blue-50'}`}
                            >
                                <div className="flex items-start">
                                    <div className="mr-4 text-xl">
                                        {notificationIcons[n.type] || <FaCalendarAlt />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{n.title}</p>
                                        <p className="text-sm text-gray-700 mt-1">{n.body}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {n.createdAt
                                                ? new Date(n.createdAt.seconds * 1000).toLocaleString()
                                                : 'Just now'}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="ml-4 text-blue-600 text-sm hover:underline"
                                        >
                                            Mark as read
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
