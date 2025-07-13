import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";

// Map your timeSlot codes back to human‑readable labels:
const timeLabels = {
    "Day-Morning": "Day 08:00 – 12:00",
    "Day-Afternoon": "Day 14:00 – 16:30",
    Eve: "Evening 17:30 – 20:30",
    "Wknd-Morn": "Weekend 08:00 – 12:00",
    "Wknd-Afternoon": "Weekend 14:00 – 16:00",
    "Wknd-Evening": "Weekend 18:00 – 20:00",
};

export default function StudentDashboard() {
    const navigate = useNavigate();
    const db = getFirestore();
    const auth = getAuth();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);

    // Fetch student profile
    useEffect(() => {
        const fetchStudent = async () => {
            const user = auth.currentUser;
            if (!user) {
                navigate("/");
                return;
            }
            try {
                const snap = await getDocs(
                    query(collection(db, "students"), where("__name__", "==", user.uid))
                );
                if (!snap.empty) {
                    setStudent(snap.docs[0].data());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [db, auth.currentUser, navigate]);

    // Fetch assignments that match any of this student’s modules
    useEffect(() => {
        if (!student) return;
        const fetchAssignments = async () => {
            const allAsg = await getDocs(collection(db, "lecturers"));
            const myAsg = allAsg.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(a => student.modules?.includes(a.course));
            setAssignments(myAsg);
        };
        fetchAssignments();
    }, [db, student]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-100">
                <p>Loading...</p>
            </div>
        );
    }
    if (!student) {
        return (
            <div className="flex h-screen items-center justify-center bg-stone-100">
                <p className="text-red-500">No student data found. Contact admin.</p>
            </div>
        );
    }

    const { fullName, faculty, course: studCourse, period, trimester, block, modules = [] } = student;

    return (
        <div className="flex h-screen bg-stone-100">
            <StudentSidebar onLogout={handleLogout} />

            <div className="flex-1 ml-64 p-6">
                <h1 className="text-3xl text-sky-700 font-bold mb-4">Welcome, {fullName}</h1>
                <div className="mb-6 text-gray-600">
                    <p><strong>Faculty:</strong> {faculty}</p>
                    <p><strong>Course:</strong> {studCourse}</p>
                    <p><strong>Period:</strong> {period}</p>
                </div>

                <h2 className="text-xl text-gray-700 font-semibold mb-4">My Modules</h2>
                {modules.length === 0 ? (
                    <p className="text-sm text-gray-600">No modules assigned.</p>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        {modules.map((mod, idx) => {
                            const asg = assignments.find(a => a.course === mod);
                            return (
                                <div
                                    key={idx}
                                    className="bg-sky-700 text-white rounded-xl shadow-lg p-4 w-72"
                                >
                                    <p className="text-sm">
                                        <strong>Module:</strong> {mod}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Trimester:</strong> {trimester || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Block:</strong> {block || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Course Code:</strong> {asg?.courseCode || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Room:</strong> {asg?.room || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Time:</strong> {timeLabels[asg?.timeSlot] || "N/A"}
                                    </p>
                                    <p className="text-sm">
                                        <strong>Lecturer:</strong> {asg?.lecturerName || "TBA"}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
