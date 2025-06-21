import React from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaCalendarAlt, FaBook, FaUser, FaUsers, FaCog, FaSignOutAlt } from "react-icons/fa";
import VULogo from "./vu-logo.png";

const Sidebar = ({ onLogout }) => {
    return (
        <div className="fixed h-screen w-64 bg-white text-black-600 p-0 flex flex-col justify-between z-50 shadow-lg">
            {/* VU Logo */}
            <div className="flex justify-center mb-1 p-10 "> {/* Pushed items down */}
                <img src={VULogo} alt="Victoria University" className="h-14" /> {/* Slightly larger logo */}
            </div>

            {/* Navigation Links */}
            <div className="w-64 p-0  ">
                <ul className="space-y-2 mt-2"> {/* Increased space between links and top */}
                    {[
                        { to: "/admin-dashboard", label: "Home", icon: <FaHome /> },
                        { to: "/admin-courses", label: "Courses", icon: <FaBook /> },
                        { to: "/admin-faculty", label: "Faculty", icon: <FaUser /> },
                        { to: "/admin-students", label: "Students", icon: <FaUsers /> },
                        { to: "/admin-timetable", label: "Timetable", icon: <FaCalendarAlt /> },

                    ].map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `font-medium text-sm flex items-center px-8 space-x-2 p-2 transition-transform transform hover:translate-x-1
                                ${isActive ? "text-sky-700 bg-white-900 rounded-md px-3 py-2" : "hover:bg-stone-100 hover:text-sky-700"}`
                                }
                            >
                                <span className="text-sm">{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Settings & Logout */}
            <div className="mt-auto space-y-2"> {/* Pushed to bottom with more spacing */}
                <NavLink
                    to="/admin-settings"
                    className={({ isActive }) =>
                        `font-semibold text-sm flex items-center px-8 space-x-2 p-2 transition-transform transform hover:translate-x-1
                        ${isActive ? "text-sky-700 bg-white-900 rounded-md px-3 py-2" : "hover:bg-stone-100 hover:text-sky-700"}`
                    }
                >
                    <FaCog className="text-lg" />
                    <span>Settings</span>
                </NavLink>

                <button
                    onClick={onLogout}
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

export default Sidebar;
