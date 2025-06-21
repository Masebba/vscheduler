import React, { useState } from "react";
import { auth } from "./firebase";
import { sendPasswordResetEmail } from "firebase/auth";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent! Check your inbox.");
        } catch (err) {
            setError("Failed to send password reset email. Check your email address.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-center text-2xl font-bold text-gray-800">Reset Password</h2>
                <p className="text-center text-gray-500 text-sm">Enter your email to receive a reset link.</p>

                {message && <p className="text-green-600 text-sm text-center">{message}</p>}
                {error && <p className="text-red-600 text-sm text-center">{error}</p>}

                <form onSubmit={handleResetPassword} className="mt-4">
                    <input
                        type="email"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        className="w-full bg-sky-700 text-white py-2 rounded-lg mt-3 hover:bg-blue-600 transition duration-300"
                    >
                        Send Reset Link
                    </button>
                </form>

                <div className="text-xs text-center mt-3">
                    <a href="/" className="text-sky-700 hover:underline">Back to Login</a>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
