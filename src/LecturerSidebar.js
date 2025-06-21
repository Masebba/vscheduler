import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaUserGraduate, FaCalendarAlt, FaChartBar, FaCog, FaSignOutAlt } from "react-icons/fa";
import VULogo from "./vu-logo.png";
import { auth } from "./firebase";

const LecturerSidebar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  const lecturerLinks = [
    { to: "/lecturer-dashboard", label: "Dashboard", icon: <FaTachometerAlt className="text-lg" /> },
    { to: "/coming-soon", label: "Student Management", icon: <FaUserGraduate className="text-lg" /> },
    { to: "/coming-soon", label: "Timetable", icon: <FaCalendarAlt className="text-lg" /> },
    { to: "/coming-soon", label: "Reports", icon: <FaChartBar className="text-lg" /> },
  ];

  return (
    <div className="fixed h-screen w-64 bg-white text-black-600 p-0 flex flex-col justify-between z-50 shadow-lg">
      {/* VU Logo */}
      <div className="flex justify-center mb-1 p-10">
        <img src={VULogo} alt="Victoria University" className="h-14" />
      </div>

      {/* Navigation Links */}
      <div className="w-64">
        <ul className="space-y-2 mt-2">
          {lecturerLinks.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `font-medium text-sm flex items-center px-8 space-x-2 p-2 transition-transform transform hover:translate-x-1 ${isActive ? "text-sky-700 bg-white-900 rounded-md px-3 py-2" : "hover:bg-stone-100 hover:text-sky-700"
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Settings & Logout */}
      <div className="mt-auto space-y-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `font-semibold text-sm flex items-center px-8 space-x-2 p-2 transition-transform transform hover:translate-x-1 ${isActive ? "text-sky-700 bg-white-900 rounded-md px-3 py-2" : "hover:bg-stone-100 hover:text-sky-700"
            }`
          }
        >
          <FaCog className="text-lg" />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          style={{ pointerEvents: "auto" }}
          className="relative z-[9999] w-full font-semibold text-sm px-8 flex items-center space-x-2 p-2 hover:bg-stone-100 text-red-600 transition-transform transform hover:translate-x-1 rounded-md"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default LecturerSidebar;
