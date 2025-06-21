import React from "react";

const Modal = ({ show, onClose, children }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-4 rounded-lg shadow-lg w-96">
                <button onClick={onClose} className="float-right text-red-500">X</button>
                <div>{children}</div>
            </div>
        </div>
    );
};

export default Modal;
