import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LecturerLayout from "./LecturerLayout";
import LecturerDashboard from "./LecturerDashboard";

// Placeholder for "Coming Soon" pages
const ComingSoon = ({ page }) => (
    <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">{page}</h1>
        <p className="text-gray-600">Coming Soon...</p>
    </div>
);

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={<LecturerLayout onLogout={() => console.log("Logout clicked")} />}
                >
                    {/* Index route renders LecturerDashboard by default when at "/" */}
                    <Route index element={<LecturerDashboard />} />
                    <Route path="lecturer-dashboard" element={<LecturerDashboard />} />
                    <Route path="coming-soon" element={<ComingSoon page="Coming Soon" />} />
                    {/* Catch-all: if route doesn't match, fallback to LecturerDashboard */}
                    <Route path="*" element={<LecturerDashboard />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default AppRouter;
