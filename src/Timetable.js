import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db, collection, addDoc, getDocs, query, where } from "../firebaseConfig";
import { toast } from "react-toastify";

const Timetable = () => {
    const [events, setEvents] = useState([]);

    // Fetch timetable from Firestore
    useEffect(() => {
        const fetchTimetable = async () => {
            const timetableRef = collection(db, "timetables");
            const snapshot = await getDocs(timetableRef);
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setEvents(data);
        };

        fetchTimetable();
    }, []);

    // Function to add new schedule (with conflict prevention)
    const handleAddSchedule = async (eventInfo) => {
        try {
            // Check for conflicts
            const q = query(
                collection(db, "timetables"),
                where("day", "==", eventInfo.extendedProps.day),
                where("timeSlot", "==", eventInfo.extendedProps.timeSlot)
            );

            const existingSchedules = await getDocs(q);
            if (!existingSchedules.empty) {
                toast.error("Time slot already booked!");
                return;
            }

            // Add new schedule
            const newEvent = {
                title: eventInfo.title,
                day: eventInfo.extendedProps.day,
                timeSlot: eventInfo.extendedProps.timeSlot,
            };

            await addDoc(collection(db, "timetables"), newEvent);
            setEvents([...events, newEvent]);
            toast.success("Schedule added successfully!");
        } catch (error) {
            console.error("Error adding schedule:", error);
        }
    };

    return (
        <div className="container mx-auto p-5">
            <h2 className="text-xl font-bold mb-4">Timetable Management</h2>

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                editable={true}
                droppable={true}
                selectable={true}
                events={events}
                eventClick={(info) => console.log(info.event)}
                dateClick={(info) => {
                    const title = prompt("Enter course name:");
                    if (title) {
                        handleAddSchedule({ title, extendedProps: { day: info.dateStr, timeSlot: info.dateStr } });
                    }
                }}
            />
        </div>
    );
};

export default Timetable;
