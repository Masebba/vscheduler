import React from "react";
import { Outlet } from "react-router-dom";
import LecturerSidebar from "./LecturerSidebar";

const LecturerLayout = ({ onLogout }) => {
    return (
        <div className="flex">
            <LecturerSidebar onLogout={onLogout} />
            <div className="flex-1 p-6">
                <Outlet />
            </div>
        </div>
    );
};

export default LecturerLayout;
