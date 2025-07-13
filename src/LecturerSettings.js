import React, { useState, useEffect } from "react";
import { getAuth, updateProfile, updatePassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import LecturerSidebar from "./LecturerSidebar";
import { useNavigate } from "react-router-dom";

export default function LecturerSettings() {
    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();
    const navigate = useNavigate();
    const user = auth.currentUser;

    // State
    const [profile, setProfile] = useState({ displayName: "", email: "", phone: "", photoURL: "" });
    const [newPhoto, setNewPhoto] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch lecturer profile from Firestore 'users' collection
    useEffect(() => {
        if (!user) { navigate("/"); return; }
        const fetchProfile = async () => {
            const docRef = doc(db, "users", user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setProfile({ ...snap.data(), email: user.email });
            }
        };
        fetchProfile();
    }, [user, navigate, db]);

    // Upload new photo
    const handlePhotoUpload = async () => {
        if (!newPhoto) return;
        setLoading(true);
        const storageRef = ref(storage, `lecturerPhotos/${user.uid}`);
        await uploadBytes(storageRef, newPhoto);
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "users", user.uid), { photoURL: url, updatedAt: serverTimestamp() });
        await updateProfile(user, { photoURL: url });
        setProfile(p => ({ ...p, photoURL: url }));
        setNewPhoto(null);
        setLoading(false);
    };

    // Save profile changes
    const handleSaveProfile = async () => {
        setLoading(true);
        await updateDoc(doc(db, "users", user.uid), {
            displayName: profile.displayName,
            phone: profile.phone,
            updatedAt: serverTimestamp()
        });
        await updateProfile(user, { displayName: profile.displayName });
        setLoading(false);
        alert("Profile updated successfully!");
    };

    // Change password
    const handleChangePassword = async () => {
        if (!newPassword) return alert("Please enter a new password.");
        setLoading(true);
        try {
            await updatePassword(user, newPassword);
            alert("Password changed successfully!");
            setNewPassword("");
        } catch (e) {
            alert(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex h-screen bg-stone-100 items-center">
            <LecturerSidebar onLogout={handleLogout} />
            <div className="flex-1 ml-72 p-6">
                <h1 className="text-2xl font-semibold mb-4">Profile & Settings</h1>
                <div className="max-w-md bg-white p-6 rounded shadow">
                    {/* Profile Photo */}
                    <div className="flex flex-col items-center mb-6">
                        <img
                            src={profile.photoURL || "https://via.placeholder.com/100"}
                            alt="Profile"
                            className="w-24 h-24 rounded-full mb-2"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => setNewPhoto(e.target.files[0])}
                        />
                        <button
                            onClick={handlePhotoUpload}
                            disabled={!newPhoto || loading}
                            className="mt-2 bg-sky-700 text-white px-3 py-1 rounded"
                        >
                            {loading ? "Uploading..." : "Upload Photo"}
                        </button>
                    </div>

                    {/* Profile Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700">Name</label>
                            <input
                                type="text"
                                value={profile.displayName}
                                onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                                className="w-full border px-3 py-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Email (read-only)</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full border bg-gray-100 px-3 py-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700">Phone</label>
                            <input
                                type="text"
                                value={profile.phone}
                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                className="w-full border px-3 py-2 rounded"
                            />
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="w-full bg-sky-700 text-white px-3 py-2 rounded"
                        >
                            {loading ? "Saving..." : "Save Profile"}
                        </button>
                    </div>

                    {/* Change Password */}
                    <div className="mt-6 space-y-2">
                        <label className="block text-gray-700">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                        />
                        <button
                            onClick={handleChangePassword}
                            disabled={loading}
                            className="w-full bg-red-600 text-white px-3 py-2 rounded"
                        >
                            {loading ? "Updating..." : "Change Password"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
