import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import LecturerSidebar from "./LecturerSidebar";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

// Duration mapping for each timeSlot
const timeDurations = {
    "Day-Morning": 4,
    "Day-Afternoon": 2.5,
    Eve: 3,
    "Wknd-Morn": 4,
    "Wknd-Afternoon": 2,
    "Wknd-Evening": 2,
};

export default function LecturerReports() {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch assignments and students on mount
    useEffect(() => {
        if (!user) return navigate("/");
        const fetchData = async () => {
            // assignments for this lecturer
            const aSnap = await getDocs(
                query(collection(db, "lecturers"), where("lecturerId", "==", user.uid))
            );
            const asg = aSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // all students
            const sSnap = await getDocs(collection(db, "students"));
            const studs = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            setAssignments(asg);
            setStudents(studs);
            setLoading(false);
        };
        fetchData();
    }, [user, navigate, db]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    // 1. Weekly/Monthly summary
    const totalHours = assignments.reduce(
        (sum, a) => sum + (timeDurations[a.timeSlot] || 0),
        0
    );
    const moduleCount = assignments.length;

    // 2. Module enrolment
    const moduleEnrolment = assignments.map(a => {
        const count = students.filter(s => s.modules?.includes(a.course)).length;
        return { name: a.courseCode, count };
    });

    // 3. Room utilization (assumes 40 available hours/week)
    const roomUsage = assignments.reduce((map, a) => {
        map[a.room] = (map[a.room] || 0) + (timeDurations[a.timeSlot] || 0);
        return map;
    }, {});
    const roomData = Object.entries(roomUsage).map(([room, hrs]) => ({ name: room, value: hrs }));

    // 4. Conflict & Gap: simple list of any two assignments same timeSlot
    const conflicts = [];
    assignments.forEach((a, i) => {
        assignments.slice(i + 1).forEach(b => {
            if (a.timeSlot === b.timeSlot) {
                conflicts.push(`${a.courseCode} conflicts with ${b.courseCode} at ${a.timeSlot}`);
            }
        });
    });

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex h-screen bg-stone-100">
            <LecturerSidebar onLogout={handleLogout} />
            <div className="flex-1 ml-64 p-6 overflow-auto">
                <h1 className="text-2xl font-bold mb-6">Reports</h1>

                {/* Weekly Summary */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-4 rounded shadow">
                        <h2 className="font-semibold">Total Teaching Hours (week)</h2>
                        <p className="text-3xl text-sky-700">{totalHours}h</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        <h2 className="font-semibold">Modules This Trimester</h2>
                        <p className="text-3xl text-sky-700">{moduleCount}</p>
                    </div>
                </div>

                {/* Module Enrolment Bar Chart */}
                <div className="bg-white p-4 rounded shadow mb-8">
                    <h2 className="font-semibold mb-2">Module Enrolment</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={moduleEnrolment} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0ea5e9" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Room Utilization Pie Chart */}
                <div className="bg-white p-4 rounded shadow mb-8">
                    <h2 className="font-semibold mb-2">Room Utilization (hrs)</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={roomData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {roomData.map((entry, index) => (
                                    <Cell key={index} fill={["#0ea5e9", "#22d3ee", "#a3e635", "#facc15"][index % 4]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Conflict List */}
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-semibold mb-2">Scheduling Conflicts</h2>
                    {conflicts.length === 0 ? (
                        <p className="text-gray-600">No conflicts detected.</p>
                    ) : (
                        <ul className="list-disc list-inside">
                            {conflicts.map((c, i) => (
                                <li key={i} className="text-red-600">{c}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
