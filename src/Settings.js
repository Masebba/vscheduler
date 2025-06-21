import React, { useState, useEffect } from "react";
import { getAuth, updateProfile, updatePassword } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Sidebar from "./Sidebar";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        photoURL: "",
    });

    const [newPhoto, setNewPhoto] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch user data from Firestore
    useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) return;
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUserData({ ...userSnap.data(), email: auth.currentUser.email });
            }
        };

        fetchUserData();
    }, [auth, db]);

    // Handle profile picture upload
    const handlePhotoUpload = async () => {
        if (!newPhoto) return;

        const fileRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        await uploadBytes(fileRef, newPhoto);
        const downloadURL = await getDownloadURL(fileRef);

        // Update in Firestore
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { photoURL: downloadURL });

        // Update Firebase Auth Profile
        await updateProfile(auth.currentUser, { photoURL: downloadURL });

        setUserData((prev) => ({ ...prev, photoURL: downloadURL }));
        setNewPhoto(null);
    };

    // Handle updating profile data
    const handleUpdateProfile = async () => {
        setLoading(true);
        const userRef = doc(db, "users", auth.currentUser.uid);

        try {
            await updateDoc(userRef, {
                firstName: userData.firstName,
                lastName: userData.lastName,
                phoneNumber: userData.phoneNumber,
            });

            await updateProfile(auth.currentUser, {
                displayName: `${userData.firstName} ${userData.lastName}`,
            });

            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile: ", error);
            alert("Failed to update profile.");
        }

        setLoading(false);
    };

    // Handle password update
    const handleChangePassword = async () => {
        if (!newPassword) {
            alert("Please enter a new password.");
            return;
        }

        try {
            await updatePassword(auth.currentUser, newPassword);
            alert("Password updated successfully!");
            setNewPassword("");
        } catch (error) {
            console.error("Error updating password:", error);
            alert("Failed to update password. Please try again.");
        }
    };
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <Sidebar /><Sidebar onLogout={handleLogout} />

            {/* Main Content */}
            <div className="flex-1 p-4 bg-stone-100 flex items-center justify-center">
                <div className="max-w-md w-full bg-white p-16 rounded-lg shadow-md ">

                    {/* Profile Picture */}
                    <div className="flex flex-col items-center">
                        <img
                            src={userData.photoURL || "https://via.placeholder.com/100"}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            className="mt-2 text-sm"
                            onChange={(e) => setNewPhoto(e.target.files[0])}
                        />
                        <button
                            onClick={handlePhotoUpload}
                            className="mt-2 bg-sky-700 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                        >
                            Upload Photo
                        </button>
                    </div>

                    {/* User Info Form */}
                    <div className="mt-4 space-y-1">
                        <div>
                            <label className="block text-gray-700 text-sm">First Name:</label>
                            <input
                                type="text"
                                value={userData.firstName}
                                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                                className="w-full px-3 py-1 border rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm">Last Name:</label>
                            <input
                                type="text"
                                value={userData.lastName}
                                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                                className="w-full px-3 py-1 border rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm">Email (Read-only)</label>
                            <input
                                type="email"
                                value={userData.email}
                                disabled
                                className="w-full px-3 py-1 border bg-gray-100 rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm">Phone Number</label>
                            <input
                                type="text"
                                value={userData.phoneNumber}
                                onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                                className="w-full px-3 py-1 border rounded-lg text-sm"
                            />
                        </div>

                        <button
                            onClick={handleUpdateProfile}
                            className="w-full bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition text-sm"
                            disabled={loading}
                        >
                            {loading ? "Updating..." : "Save Changes"}
                        </button>
                    </div>

                    {/* Change Password */}
                    <div className="mt-4">
                        <h3 className="text-md font-semibold">Change Password</h3>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-1 mt-2 border rounded-lg text-sm"
                        />
                        <button
                            onClick={handleChangePassword}
                            className="mt-2 w-full bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-700 transition text-sm"
                        >
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
