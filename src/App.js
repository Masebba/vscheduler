import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import VULogo from "./vu-logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // 🔹 Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Retrieve user role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userRole = userDoc.data().role;

          // Redirect to the correct dashboard
          if (userRole === "admin") navigate("/admin-dashboard");
          else if (userRole === "lecturer") navigate("/lecturer-dashboard");
          else navigate("/student-dashboard");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔹 Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;

        // 🔹 Store login session if 'Remember Me' is checked
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify({ uid: user.uid, role: userRole }));
        }

        // 🔹 Redirect based on role
        if (userRole === "admin") navigate("/admin-dashboard");
        else if (userRole === "lecturer") navigate("/lecturer-dashboard");
        else navigate("/student-dashboard");
      } else {
        setError("User role not found.");
      }
    } catch (error) {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat md:bg-[url('/public/background.jpg')] flex justify-end items-center pr-0">
      {/* Login Container */}
      <div className="min-h-screen bg-white shadow-xl rounded-0 p-20 w-full max-w-md">
        {/* VU Logo */}
        <div className="flex justify-center mb-4">
          <img src={VULogo} alt="Victoria University" className="h-16" />
        </div>

        {/* Titles */}
        <h1 className="text-xl font-bold text-center text-gray-900">VICTORIA UNIVERSITY</h1>
        <h2 className="text-s font-semibold text-center text-gray-400">Vscheduler Portal</h2>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-10">
          <p className="text-md font-semibold text-center text-gray-600">Enter your details to login</p>

          {/* Email Input */}
          <div className="flex justify-center mt-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-2/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input with Eye Icon */}
          <div className="mt-4 flex justify-center mt-4 relative w-2/3 mx-auto">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye size={18} /> : <FaEyeSlash size={18} />}
            </button>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex justify-center mt-2 items-center">
            <input
              type="checkbox"
              id="rememberMe"
              className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-400"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            <label htmlFor="rememberMe" className="text-xs font-semibold ml-2 text-gray-500">Remember me</label>
          </div>

          {/* Sign In Button */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="w-2/3 bg-sky-700 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Sign In
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-xs text-center mt-3">
            <a href="/forgot-password" className="text-sky-700 hover:underline">Forgot password?</a>
          </div>

          {/* Sign-Up Prompt */}
          <div className="text-xs text-center mt-3 text-gray-600">
            Don't have an account?{" "}
            <a href="/signup" className="text-sky-700 hover:underline">Sign up</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
