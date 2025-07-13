import React, { useState, useEffect } from "react";
import { getAuth, updateProfile, updatePassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import StudentSidebar from "./StudentSidebar";
import { useNavigate } from "react-router-dom";

export default function StudentSettings() {
    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();
    const navigate = useNavigate();
    const user = auth.currentUser;

    const [profile, setProfile] = useState({ fullName: "", email: "", phone: "", photoURL: "" });
    const [newPhoto, setNewPhoto] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/");
            return;
        }
        const fetchProfile = async () => {
            const docRef = doc(db, "students", user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setProfile({ ...snap.data(), email: user.email });
            }
        };
        fetchProfile();
    }, [user, navigate, db]);

    const handlePhotoUpload = async () => {
        if (!newPhoto) return;
        setLoading(true);
        const storageRef = ref(storage, `studentPhotos/${user.uid}`);
        await uploadBytes(storageRef, newPhoto);
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "students", user.uid), { photoURL: url, updatedAt: serverTimestamp() });
        await updateProfile(user, { photoURL: url });
        setProfile(prev => ({ ...prev, photoURL: url }));
        setNewPhoto(null);
        setLoading(false);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        await updateDoc(doc(db, "students", user.uid), { fullName: profile.fullName, phone: profile.phone, updatedAt: serverTimestamp() });
        await updateProfile(user, { displayName: profile.fullName });
        setLoading(false);
        alert("Profile updated successfully!");
    };

    const handleChangePassword = async () => {
        if (!newPassword) return alert("Please enter a new password.");
        setLoading(true);
        try {
            await updatePassword(user, newPassword);
            alert("Password changed successfully!");
            setNewPassword("");
        } catch (e) {
            alert("Error changing password: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex h-screen bg-stone-100">
            <StudentSidebar onLogout={handleLogout} />
            <div className="flex-1 ml-72 p-6">
                <h1 className="text-2xl font-semibold mb-4">My Profile & Settings</h1>
                <div className="max-w-md bg-white p-6 rounded shadow">
                    <div className="flex flex-col items-center mb-4">
                        <img
                            src={profile.photoURL || "https://via.placeholder.com/100"}
                            alt="Profile"
                            className="w-24 h-24 rounded-full mb-2"
                        />
                        <input type="file" accept="image/*" onChange={e => setNewPhoto(e.target.files[0])} />
                        <button
                            onClick={handlePhotoUpload}
                            disabled={!newPhoto || loading}
                            className="mt-2 bg-sky-700 text-white px-3 py-1 rounded"
                        >
                            {loading ? "Uploading..." : "Upload Photo"}
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700">Full Name</label>
                            <input
                                type="text"
                                value={profile.fullName}
                                onChange={e => setProfile({ ...profile, fullName: e.target.value })}
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
                            <label className="block text-gray-700">Phone Number</label>
                            <input
                                type="tel"
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
