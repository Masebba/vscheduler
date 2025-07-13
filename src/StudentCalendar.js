import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import StudentSidebar from "./StudentSidebar";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const StudentCalendar = () => {
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        const fetchEvents = async () => {
            const snapshot = await getDocs(collection(db, "timetables"));
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                title: doc.data().title || doc.data().module || "Event",
                start: doc.data().start,
                end: doc.data().end || null,
                color: "#0ea5e9" // Sky-500 for student UI
            }));
            setEvents(data);
        };

        fetchEvents();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex bg-stone-100 h-screen">
            <StudentSidebar onLogout={handleLogout} />
            <div className="ml-64 flex-1 p-6">
                <h1 className="text-2xl font-semibold text-sky-700 mb-4">My Calendar & Events</h1>
                <div className="bg-white shadow rounded p-4">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay"
                        }}
                        height="auto"
                    />
                </div>
            </div>
        </div>
    );
};

export default StudentCalendar;
