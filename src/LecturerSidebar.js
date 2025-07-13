// src/LecturerSidebar.js
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import VULogo from "./vu-logo.png";
import { auth } from "./firebase";

const LecturerSidebar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  const lecturerLinks = [
    { to: "/lecturer-dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    // Now points to the real timetable page:
    { to: "/lecturer-timetable", label: "Timetable", icon: <FaCalendarAlt /> },
    { to: "/lecturer-reports", label: "Reports", icon: <FaChartBar /> },
  ];

  return (
    <div className="fixed h-screen w-64 bg-white text-black p-0 flex flex-col justify-between shadow-lg z-50">
      <div className="flex justify-center p-10">
        <img src={VULogo} alt="Victoria University" className="h-14" />
      </div>
      <ul className="space-y-2 mt-2">
        {lecturerLinks.map((item, i) => (
          <li key={i}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-8 py-2 text-sm font-medium transition 
                 ${isActive ? "text-sky-700 bg-gray-100 rounded" : "hover:text-sky-700 hover:bg-gray-50"}`
              }
            >
              <span className="mr-2">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-auto space-y-2 mb-6">
        <NavLink
          to="/settings"
          className="flex items-center px-8 py-2 text-sm font-medium hover:text-sky-700 hover:bg-gray-50"
        >
          <FaCog className="mr-2" />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center px-8 py-2 text-sm font-medium text-red-600 hover:bg-gray-50"
        >
          <FaSignOutAlt className="mr-2" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default LecturerSidebar;
