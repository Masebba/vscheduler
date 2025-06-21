import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import StudentSidebar from "./StudentSidebar";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
    const navigate = useNavigate();
    const db = getFirestore();
    const auth = getAuth();

    // Local state for the student and loading flag.
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    // Local state for lecturer assignments fetched from Firestore.
    const [lecturerAssignments, setLecturerAssignments] = useState([]);

    useEffect(() => {
        const studentId = auth.currentUser ? auth.currentUser.uid : null;
        if (!studentId) {
            console.error("Student ID is missing or user is not logged in");
            setLoading(false);
            return;
        }

        const fetchStudent = async () => {
            try {
                const studentDocRef = doc(db, "students", studentId);
                const studentSnap = await getDoc(studentDocRef);
                if (studentSnap.exists()) {
                    setStudent(studentSnap.data());
                } else {
                    console.error("No student record found in Firestore");
                }
            } catch (error) {
                console.error("Error fetching student data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [db, auth]);

    // Fetch lecturer assignments from Firestore ("lecturers" collection)
    useEffect(() => {
        const fetchLecturerAssignments = async () => {
            try {
                const lecturersCollection = collection(db, "lecturers");
                const lecturersSnapshot = await getDocs(lecturersCollection);
                const lecturers = lecturersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setLecturerAssignments(lecturers);
            } catch (error) {
                console.error("Error fetching lecturer assignments:", error);
            }
        };

        fetchLecturerAssignments();
    }, [db]);

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

    // For each assigned module, find the matching lecturer assignment (if any).
    const renderModuleCard = (module, index) => {
        // Find a lecturer assignment where the faculty and the course (module name) match.
        const lecturerRecord = lecturerAssignments.find(
            (assignment) =>
                assignment.faculty === student.faculty && assignment.course === module
        );
        return (
            <div key={index} className="bg-sky-700 shadow-lg rounded-xl p-4 w-80 text-white pl-6">
                <p><strong>Module:</strong> {module}</p>
                <p><strong>Trimester:</strong> {student.trimester || "Not assigned"}</p>
                <p><strong>Block:</strong> {student.block || "Not assigned"}</p>
                <p><strong>Period:</strong> {student.period} </p>
                <p><strong>Lecturer:</strong>{" "} {lecturerRecord ? lecturerRecord.lecturerName : "Not assigned"} </p>
            </div>
        );
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };
    return (
        <div className="flex h-screen bg-stone-100">
            <StudentSidebar /><StudentSidebar onLogout={handleLogout} />
            <div className="flex-1 ml-64 p-6 relative">
                <h1 className="text-3xl text-sky-700 font-bold mb-4 pl-6">Welcome, {student.fullName}</h1>
                <div className="mb-6 text-gray-600 pl-6">
                    <p> <strong>Faculty:</strong> {student.faculty} </p>
                    <p> <strong>Course:</strong> {student.course} </p>
                    <p> <strong>Period:</strong> {student.period}</p>
                </div>

                {/* Assigned details: For each module, show a separate card */}
                <h2 className="text-xl text-gray-600 font-semibold mb-2 pl-6">My Modules</h2>
                <div className="flex flex-wrap gap-4 pl-6">
                    {student.modules && student.modules.length > 0 ? (
                        student.modules.map((module, index) => renderModuleCard(module, index))
                    ) : (
                        <p className="text-sm text-gray-600">No modules assigned</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
