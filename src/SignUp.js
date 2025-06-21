import React, { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import VULogo from "./vu-logo.png";

// Helper: Parse registration number of the format "VU-BCS-2309-0412-DAY"
const parseRegNumber = (regNumber) => {
    const parts = regNumber.split("-");
    if (parts.length < 5) return {};
    const course = parts[1]; // e.g., "BCS"
    const yearMonth = parts[2]; // e.g., "2309"
    const period = parts[4]; // e.g., "DAY"
    const year = "20" + yearMonth.slice(0, 2);
    const monthNum = yearMonth.slice(2, 4);
    const monthNames = {
        "01": "January",
        "02": "February",
        "03": "March",
        "04": "April",
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November",
        "12": "December"
    };
    const intakeMonth = monthNames[monthNum] || "";
    return { course, intakeYear: year, intakeMonth, period };
};

function SignUp() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [faculty, setFaculty] = useState("");
    const [role, setRole] = useState("");
    const [regNumber, setRegNumber] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");

        try {
            // Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create a record in the "users" collection
            await setDoc(doc(db, "users", user.uid), {
                firstName,
                lastName,
                email,
                faculty,
                role,
                regNumber: role === "student" ? regNumber : ""
            });

            // If the user is a student, create a document in the "students" collection.
            if (role === "student") {
                // Parse the regNumber to extract additional info.
                const parsedData = parseRegNumber(regNumber);
                await setDoc(doc(db, "students", user.uid), {
                    fullName: firstName + " " + lastName,
                    faculty,
                    email,
                    regNumber,
                    ...parsedData,
                    // You can add more fields (e.g., phone, trimester, block) if needed.
                });
                // Redirect to Student Dashboard
                navigate("/student-dashboard");
            } else {
                // For non-students, redirect to the regular dashboard.
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Signup Error:", error.message);
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen flex justify-end items-center bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/background.jpg')" }}>
            <div className="py-10 min-h-screen bg-white p-12 w-full max-w-md shadow-lg">
                <div className="flex justify-center mb-2">
                    <img src={VULogo} alt="Victoria University" className="h-12" />
                </div>
                <h1 className="text-lg font-bold text-center text-gray-900">VICTORIA UNIVERSITY</h1>
                <h2 className="text-xs font-semibold text-center text-gray-400">Vscheduler Portal</h2>
                <h1 className="py-3 text-lg font-bold text-center text-gray-900">Create Account</h1>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <form onSubmit={handleSignUp} className="mt-4 space-y-3">
                    <div className="flex space-x-2">
                        <input type="text" placeholder="First Name"
                            className="w-1/2 px-3 py-1 border rounded"
                            value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                        <input type="text" placeholder="Last Name"
                            className="w-1/2 px-3 py-1 border rounded"
                            value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                    <input type="email" placeholder="Email"
                        className="w-full px-3 py-1 border rounded"
                        value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Password"
                            className="w-full px-3 py-1 border rounded"
                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                        </button>
                    </div>

                    <select
                        className="w-full px-3 py-1 border rounded"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select Faculty</option>
                        <option value="FST">Faculty of Science and Technology (FST)</option>
                        <option value="FBM">Faculty of Business and Management (FBM)</option>
                        <option value="FHSS">Faculty of Humanities and Social Sciences (FHSS)</option>
                        <option value="SL">School of Law (SL)</option>
                        <option value="FHS">Faculty of Health Sciences (FHS)</option>
                        <option value="IELL">Institute of Education and Life-Long Learning (IELL)</option>
                    </select>

                    <select className="w-full px-3 py-1 border rounded" value={role} onChange={(e) => setRole(e.target.value)} required>
                        <option value="" disabled>Select role</option>
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="admin">Admin</option>
                    </select>
                    {role === "student" && (
                        <input type="text" placeholder="Registration Number (e.g., VU-BCS-2209-0875-EVE)" className="w-full px-3 py-1 border rounded" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} required />
                    )}
                    <button type="submit" className="w-full bg-sky-700 text-white py-2 rounded hover:bg-blue-700 transition">Sign Up</button>
                    <p className="text-center text-gray-600 text-sm">
                        Already have an account?{" "}
                        <button type="button" className="text-sky-700 hover:underline" onClick={() => navigate("/")}>
                            Sign In
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default SignUp;
