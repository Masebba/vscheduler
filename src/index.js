import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import SignUp from "./SignUp";
import AdminDashboard from "./AdminDashboard";
import LecturerDashboard from "./LecturerDashboard";
import StudentDashboard from "./StudentDashboard";
import AdminTimetable from "./AdminTimetable";
import AdminFaculty from "./AdminFaculty";
import AdminCourses from "./AdminCourses";
import Settings from "./Settings";
import Students from "./AdminStudents";
import ProtectedRoute from "./ProtectedRoute";
import "./index.css";
import ForgotPassword from "./ForgotPassword";
import StudentCalendar from "./StudentCalendar";
import StudentMessages from "./StudentMessages";
import StudentSettings from "./StudentSettings";

import LecturerTimetable from "./LecturerTimetable";
import LecturerReports from "./LecturerReports";
import LecturerSettings from "./LecturerSettings";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/admin-courses" element={<AdminCourses />} />
      <Route path="/admin-faculty" element={<AdminFaculty />} />
      <Route path="/admin-settings" element={<Settings />} />
      <Route path="/admin-students" element={<Students />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/student-calendar" element={<StudentCalendar />} />
      <Route path="/student-messages" element={<StudentMessages />} />
      <Route path="/student-profile" element={<StudentSettings />} />

      <Route path="/lecturer-timetable" element={<LecturerTimetable />} />
      <Route path="/lecturer-reports" element={<LecturerReports />} />
      <Route path="/settings" element={<LecturerSettings />} />


      {/* Protecting dashboard routes */}
      <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"> <AdminDashboard /></ProtectedRoute>} />
      <Route
        path="/lecturer-dashboard"
        element={
          <ProtectedRoute role="lecturer">
            <LecturerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-timetable"
        element={
          <ProtectedRoute role="admin">
            <AdminTimetable />
          </ProtectedRoute>
        }
      />


      <Route
        path="/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminTimetable />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Router>

);
