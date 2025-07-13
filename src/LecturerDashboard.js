import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import LecturerSidebar from "./LecturerSidebar";

// Re‑use your timeOptions to translate codes into labels:
const timeOptions = {
    "Day-Morning": "Day 08:00–12:00",
    "Day-Afternoon": "Day 14:00–16:30",
    Eve: "Evening 17:30–20:30",
    "Wknd-Morn": "Weekend 08:00–12:00",
    "Wknd-Afternoon": "Weekend 14:00–16:00",
    "Wknd-Evening": "Weekend 18:00–20:00",
};

function LecturerDashboard() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch assignments filtered by the current lecturer
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    setError("Not authenticated");
                    setLoading(false);
                    return;
                }

                const q = query(
                    collection(db, "lecturers"),
                    where("lecturerId", "==", user.uid)
                );
                const snapshot = await getDocs(q);
                setAssignments(
                    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                );
            } catch (err) {
                console.error(err);
                setError("Failed to load assignments.");
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    // Derive name & faculty from first assignment or fallback
    const lecturerName =
        assignments[0]?.lecturerName || auth.currentUser?.displayName || "Lecturer";
    const faculty = assignments[0]?.faculty || "N/A";

    return (
        <div className="flex min-h-screen bg-stone-100">
            <LecturerSidebar />

            <div className="flex-1 p-6 relative ml-64">
                <header className="mb-6 p-4">
                    <h1 className="text-2xl text-sky-700">
                        <span className="font-medium">Welcome,</span> {lecturerName}
                    </h1>
                    <p className="text-lg text-gray-700">
                        <span className="font-medium">Faculty:</span> {faculty}
                    </p>
                </header>

                <main>
                    <h2 className="text-xl font-semibold text-gray-700 mb-6 pl-6">
                        My Assigned Modules
                    </h2>

                    {loading ? (
                        <p className="text-sky-600 pl-6">Loading assignments...</p>
                    ) : error ? (
                        <p className="text-red-500 pl-6">{error}</p>
                    ) : assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-4 mb-6 pl-6">
                            {assignments.map((a) => (
                                <div
                                    key={a.id}
                                    className="bg-sky-700 text-white shadow-lg rounded-2xl p-4 w-full sm:w-1/3 md:w-1/4"
                                >
                                    <p className="text-sm">
                                        <span className="font-medium">Module:</span> {a.course}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Course Code:</span>{" "}
                                        {a.courseCode}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Room:</span> {a.room}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Time:</span>{" "}
                                        {timeOptions[a.timeSlot] || a.timeSlot}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-red-600 pl-6">No modules assigned.</p>
                    )}
                </main>
            </div>
        </div>
    );
}

export default LecturerDashboard;
