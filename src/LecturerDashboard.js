import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import LecturerSidebar from "./LecturerSidebar";

function LecturerDashboard() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch lecturer assignments from the "lecturers" collection
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                if (auth.currentUser) {
                    const lecturerId = auth.currentUser.uid;
                    // Query assignments where lecturerId equals the current user's uid
                    const q = query(
                        collection(db, "lecturers"),
                        where("lecturerId", "==", lecturerId)
                    );
                    const querySnapshot = await getDocs(q);
                    const data = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setAssignments(data);
                }
            } catch (err) {
                console.error("Error fetching assignments:", err);
                setError("Failed to fetch assignments. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    // Retrieve lecturer name and faculty from the first assignment (if available)
    const lecturerName =
        assignments.length > 0
            ? assignments[0].lecturerName
            : auth.currentUser
                ? auth.currentUser.displayName
                : "Lecturer";
    const faculty =
        assignments.length > 0 ? assignments[0].faculty : "N/A";

    return (
        <div className="flex min-h-screen bg-stone-100">
            {/* Sidebar Navigation */}
            <LecturerSidebar />

            {/* Main Content */}
            <div className="flex-1 p-6 relative ml-64">
                <header className="flex justify items-center mb-6 p-4 ">
                    <div>
                        {/*<h1 className="text-2xl font-bold">Lecturer Dashboard</h1>*/}
                        <h1 className="text-2xl text-sky-700">
                            <span className="font-medium">Welcome,</span> {lecturerName}{" "}</h1>
                        <p className="text-l text-gray-700">
                            <span className="font-medium">Faculty:</span> {faculty}
                        </p>
                    </div>
                </header>

                {/* Assigned Modules */}
                <main>
                    <h2 className="text-xl text-gray-700 font-semibold mb-6 pl-6">My Assigned Modules</h2>
                    {loading ? (
                        <p className="text-sky-600">Loading assignments...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-4 mb-6 pl-6">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="bg-sky-700 text-white shadow-lg rounded-2xl p-4 w-full sm:w-1/3 md:w-1/4"
                                >
                                    <h2 className="text-sm font-bold mb-2">
                                        {/* Module Code:{" "} */}
                                        {assignment.moduleCode || assignment.course || "N/A"}
                                    </h2>
                                    <p className="text-sm">
                                        <span className="font-medium">Trimester:</span>{" "}
                                        {assignment.trimester || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Block:</span>{" "}
                                        {assignment.block || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Time:</span>{" "}
                                        {assignment.time || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Cohort(s):</span>{" "}
                                        {assignment.cohorts || assignment.cohort || "N/A"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-red-600">No modules assigned.</p>
                    )}
                </main>
            </div>
        </div>
    );
}

export default LecturerDashboard;
