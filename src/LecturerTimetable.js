// src/LecturerTimetable.js
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import LecturerSidebar from "./LecturerSidebar";

export default function LecturerTimetable() {
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // If not logged in, kick back to login
        if (!auth.currentUser) return navigate("/");

        // Fetch admin‐created events
        (async () => {
            const snap = await getDocs(collection(db, "timetables"));
            setEvents(
                snap.docs.map(d => ({
                    id: d.id,
                    title: d.data().title || d.data().module || "Class",
                    start: d.data().start,
                    end: d.data().end || d.data().start,
                }))
            );
        })();
    }, [navigate]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex h-screen bg-stone-100">
            <LecturerSidebar onLogout={handleLogout} />
            <div className="ml-64 flex-1 p-6">
                <h1 className="text-2xl font-semibold text-sky-700 mb-4">My Timetable</h1>
                <div className="bg-white rounded shadow p-4">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay"
                        }}
                        events={events}
                        height="auto"
                        allDaySlot={false}
                    />
                </div>
            </div>
        </div>
    );
}
