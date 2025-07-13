import React from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaCalendarAlt, FaEnvelope, FaUser, FaSignOutAlt } from "react-icons/fa"; //FaQuestionCircle
import VULogo from "./vu-logo.png";


const StudentSidebar = ({ onLogout }) => {
    return (
        <div className="fixed h-screen w-64 bg-white text-black-600 p-0 flex flex-col justify-between z-50 shadow-lg">
            {/* VU Logo */}
            <div className="flex justify-center mb-1 p-10">
                <img src={VULogo} alt="Victoria University" className="h-14" />
            </div>

            {/* Navigation Links */}
            <div className="w-64 p-0">
                <ul className="space-y-2 mt-2">
                    {[
                        { to: "/student-dashboard", label: "Dashboard", icon: <FaHome /> },
                        { to: "/student-calendar", label: "Calendar/Events", icon: <FaCalendarAlt /> },
                        { to: "/student-messages", label: "Messages", icon: <FaEnvelope /> },
                        { to: "/student-profile", label: "Profile Settings", icon: <FaUser /> },
                        {/* to: "/student-help", label: "Help", icon: <FaQuestionCircle /> */ },
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

            {/* Logout Button */}
            <div className="mt-auto space-y-2">
                <button
                    onClick={onLogout}
                    className="relative z-[9999] w-full font-semibold text-sm px-8 flex items-center space-x-2 p-2 hover:bg-stone-100 text-red-600 transition-transform transform hover:translate-x-1 rounded-md"
                >
                    <FaSignOutAlt className="text-lg" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default StudentSidebar;

//This is my StudentSidebar. I want the Calendar/Events to display calender and Events as created by the admin