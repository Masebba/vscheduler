import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const db = getFirestore();
    const defaultPhotoURL = "https://via.placeholder.com/40";

    const [userData, setUserData] = useState({ lastName: "", email: "", photoURL: defaultPhotoURL });
    const [fstLecturerCount, setFstLecturerCount] = useState(0);
    const [fstStudentCounts, setFstStudentCounts] = useState({});

    useEffect(() => {
        // Fetch user profile
        const fetchUserData = async () => {
            if (!auth.currentUser) return;
            const userRef = doc(db, "users", auth.currentUser.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const data = snap.data();
                setUserData({
                    lastName: data.lastName || "Admin",
                    email: auth.currentUser.email,
                    photoURL: data.photoURL || defaultPhotoURL,
                });
            }
        };

        // Fetch FST lecturers count
        const fetchFstLecturers = async () => {
            const q = query(
                collection(db, "users"),
                where("role", "==", "lecturer"),
                where("faculty", "==", "FST")
            );
            const snap = await getDocs(q);
            setFstLecturerCount(snap.size);
        };

        // Fetch FST students per course code
        const fetchFstStudents = async () => {
            const q = query(
                collection(db, "users"),
                where("role", "==", "student"),
                where("faculty", "==", "FST")
            );
            const snap = await getDocs(q);
            const counts = {};
            snap.docs.forEach(d => {
                const reg = d.data().regNumber || "";
                const parts = reg.split("-");
                const code = parts[1] || "Unknown";
                counts[code] = (counts[code] || 0) + 1;
            });
            setFstStudentCounts(counts);
        };

        fetchUserData();
        fetchFstLecturers();
        fetchFstStudents();
    }, [db]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex h-screen bg-stone-100">
            <Sidebar onLogout={handleLogout} />
            <div className="flex-1 ml-64 p-6 relative">
                {/* Profile Image & User Info */}
                <div className="absolute top-5 right-10 flex items-center space-x-3">
                    <img
                        src={userData.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-gray-300 cursor-pointer hover:shadow-md"
                        onClick={() => navigate("/admin-settings")}
                    />
                </div>

                {/* Welcome Message */}
                <h1 className="text-2xl font-bold">Welcome, {userData.lastName}</h1>
                <p className="text-gray-600 mb-6">{userData.email}</p>

                {/* Quick Links */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-red-600 text-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold">Manage Timetables</h2>
                        <p>View and edit trimester-based timetables</p>
                    </div>
                    <div className="bg-sky-700 text-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold">Manage Courses</h2>
                        <p>Add, update, or remove courses</p>
                    </div>
                    <div className="bg-red-600 text-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold">Manage Faculty</h2>
                        <p>Assign lecturers to courses</p>
                    </div>
                </div>

                {/* FST Lecturers & Students Stats */}
                <div className="mt-8 flex flex-col space-y-6 text-gray-500">
                    <div className="bg-white p-4 rounded-lg shadow w-full max-w-sm text-center">
                        <h3 className="text-lg font-semibold">Lecturers in FST</h3>
                        <p className="text-3xl font-bold mt-2">{fstLecturerCount}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow w-full">
                        <h3 className="text-lg font-semibold mb-4">Students in FST by Course</h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-4 text-center">
                            {Object.entries(fstStudentCounts).map(([code, cnt]) => (
                                <div key={code} className="bg-gray-100 p-3 rounded">
                                    <h4 className="font-medium">{code}</h4>
                                    <p className="text-2xl font-bold mt-1">{cnt}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
