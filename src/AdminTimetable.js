import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";

const AdminTimetable = () => {
    const navigate = useNavigate();
    const [timetableEvents, setTimetableEvents] = useState([]);
    const [combinedAssignments, setCombinedAssignments] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [filterFaculty, setFilterFaculty] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [filterLecturer, setFilterLecturer] = useState("");

    // 1. Fetch timetable events from "timetables"
    useEffect(() => {
        const fetchTimetable = async () => {
            const querySnapshot = await getDocs(collection(db, "timetables"));
            const fetchedEvents = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                type: "timetable",
                ...doc.data()
            }));
            setTimetableEvents(fetchedEvents);
        };
        fetchTimetable();
    }, []);

    // 2. Fetch student assignments (with assigned modules) and lecturer assignments
    useEffect(() => {
        const fetchStudentAssignments = async () => {
            const querySnapshot = await getDocs(collection(db, "students"));
            const studentData = querySnapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    type: "student",
                    ...doc.data()
                }))
                .filter((student) => student.modules && student.modules.length > 0);
            return studentData;
        };

        const fetchLecturerAssignments = async () => {
            const querySnapshot = await getDocs(collection(db, "lecturers"));
            const lecturerData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                type: "lecturer",
                ...doc.data()
            }));
            return lecturerData;
        };

        const fetchCombined = async () => {
            const studentAssignments = await fetchStudentAssignments();
            const lecturerAssignments = await fetchLecturerAssignments();
            // Combine timetable events with student and lecturer assignments
            setCombinedAssignments([
                ...timetableEvents,
                ...studentAssignments,
                ...lecturerAssignments
            ]);
        };

        fetchCombined();
    }, [timetableEvents]);

    // 3. Filtering combined assignments for the list view
    const filteredAssignments = combinedAssignments.filter((item) => {
        const facultyMatch = filterFaculty ? item.faculty === filterFaculty : true;
        let courseMatch = true;
        if (filterCourse) {
            if (item.type === "timetable") {
                courseMatch = (item.module || item.title) === filterCourse;
            } else if (item.type === "student") {
                courseMatch = item.modules ? item.modules.join(", ") === filterCourse : false;
            } else if (item.type === "lecturer") {
                courseMatch = item.course === filterCourse;
            }
        }
        const lecturerMatch = filterLecturer
            ? item.type === "lecturer"
                ? item.lecturerName === filterLecturer
                : (item.lecturer || "N/A") === filterLecturer
            : true;
        return facultyMatch && courseMatch && lecturerMatch;
    });

    // 4. Build unique filter options from combined assignments
    const uniqueFaculties = [
        ...new Set(combinedAssignments.map((item) => item.faculty).filter(Boolean))
    ];
    const uniqueLecturers = [
        ...new Set(
            combinedAssignments
                .map((item) =>
                    item.type === "lecturer" ? item.lecturerName : item.lecturer || "N/A"
                )
                .filter((val) => val !== "N/A")
        )
    ];
    const uniqueCourses = [
        ...new Set(
            combinedAssignments
                .map((item) => {
                    if (item.type === "timetable") return item.module || item.title || "";
                    else if (item.type === "student")
                        return item.modules ? item.modules.join(", ") : "";
                    else if (item.type === "lecturer") return item.course || "";
                    return "";
                })
                .filter(Boolean)
        )
    ];

    // 5. Download CSV & PDF functions for filtered assignments
    const handleDownloadCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Type,Faculty,Lecturer,Courses Assigned,Trimester,Block,Time,Cohort\r\n";
        filteredAssignments.forEach((item) => {
            const type = item.type;
            const faculty = item.faculty || "N/A";
            const lecturer =
                item.type === "lecturer" ? item.lecturerName : item.lecturer || "N/A";
            let course = "";
            if (item.type === "timetable") course = item.module || item.title || "N/A";
            else if (item.type === "student")
                course = item.modules ? item.modules.join(", ") : "N/A";
            else if (item.type === "lecturer") course = item.course || "N/A";
            const trimester = item.trimester || "N/A";
            const block = item.block || "N/A";
            let time = "";
            if (item.type === "timetable" && item.start) {
                const startTime = new Date(item.start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });
                const endTime = item.end
                    ? new Date(item.end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    })
                    : "";
                time = startTime + (endTime ? " - " + endTime : "");
            }
            let cohort = "";
            if (item.type === "timetable") cohort = item.cohort || "N/A";
            else if (item.type === "student")
                cohort = `${item.intakeYear} ${item.intakeMonth} ${item.period}` || "N/A";
            csvContent += `${type}, ${faculty}, ${lecturer}, ${course}, ${trimester}, ${block}, ${time}, ${cohort}\r\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "timetable_assignments.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text("Timetable Assignments", 14, 15);
        const tableColumn = [
            // "Type",
            "Faculty",
            "Lecturer",
            "Courses Assigned",
            "Trimester",
            "Block",
            "Time",
            "Cohort"
        ];
        const tableRows = [];
        filteredAssignments.forEach((item) => {
            const faculty = item.faculty || "N/A";
            const lecturer =
                item.type === "lecturer" ? item.lecturerName : item.lecturer || "N/A";
            let course = "";
            if (item.type === "timetable") course = item.module || item.title || "N/A";
            else if (item.type === "student")
                course = item.modules ? item.modules.join(", ") : "N/A";
            else if (item.type === "lecturer") course = item.course || "N/A";
            const trimester = item.trimester || "N/A";
            const block = item.block || "N/A";
            let time = "";
            if (item.type === "timetable" && item.start) {
                const startTime = new Date(item.start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });
                const endTime = item.end
                    ? new Date(item.end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    })
                    : "";
                time = startTime + (endTime ? " - " + endTime : "");
            }
            let cohort = "";
            if (item.type === "timetable") cohort = item.cohort || "N/A";
            else if (item.type === "student")
                cohort = `${item.intakeYear} ${item.intakeMonth} ${item.period}` || "N/A";
            tableRows.push([
                faculty,
                lecturer,
                course,
                trimester,
                block,
                time,
                cohort
            ]);
        });

        // Use autoTable as a function instead of doc.autoTable
        autoTable(doc, {
            startY: 25,
            head: [tableColumn],
            body: tableRows,
            headStyles: { fillColor: [200, 200, 200], fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 2 },
            margin: { left: 14, right: 14 }
        });
        doc.save("timetable_assignments.pdf");
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };
    // 6. Rendering
    return (
        <div className="flex h-screen bg-stone-100">
            <Sidebar /><Sidebar onLogout={handleLogout} />
            <div className="flex-1 ml-64 p-2">
                <h1 className="text-sm font-bold mb-2">Manage Timetable</h1>
                <button onClick={() => setShowCalendar(!showCalendar)}
                    className="mb-2 px-2 py-1 bg-sky-700 text-white rounded text-xs hover:bg-blue-500 hover:shadow-md">
                    {showCalendar ? "Show Combined Assignments" : "Show Calendar"}
                </button>

                {showCalendar ? (
                    // Calendar view: shows only timetable events
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        editable={true}
                        selectable={true}
                        events={timetableEvents}
                        eventClick={async (clickInfo) => {
                            if (window.confirm("Are you sure you want to delete this event?")) {
                                await deleteDoc(doc(db, "timetables", clickInfo.event.id));
                                setTimetableEvents(
                                    timetableEvents.filter(
                                        (event) => event.id !== clickInfo.event.id
                                    )
                                );
                            }
                        }}
                        dateClick={(info) => {
                            const title = prompt(
                                "Enter event title (e.g., Module - Lecturer):"
                            );
                            if (title) {
                                const newEvent = {
                                    title,
                                    start: info.date.toISOString(),
                                    end: null
                                };
                                addDoc(collection(db, "timetables"), newEvent).then((docRef) => {
                                    setTimetableEvents([
                                        ...timetableEvents,
                                        { id: docRef.id, ...newEvent, type: "timetable" }
                                    ]);
                                });
                            }
                        }}
                    />
                ) : (
                    // List view: Combined assignments from timetable events, student assignments, and lecturer assignments.
                    <div>
                        <h2 className="text-sm font-semibold mb-2">
                            Lecturer and Student Cohort Assignments
                        </h2>
                        <div className="flex flex-wrap gap-1 mb-2">
                            <select value={filterFaculty}
                                onChange={(e) => setFilterFaculty(e.target.value)}
                                className="border p-1 rounded text-xs"
                            >
                                <option value="">All Faculties</option>
                                {uniqueFaculties.map((faculty, index) => (
                                    <option key={index} value={faculty}>
                                        {faculty}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterLecturer}
                                onChange={(e) => setFilterLecturer(e.target.value)}
                                className="border p-1 rounded text-xs"
                            >
                                <option value="">All Lecturers</option>
                                {uniqueLecturers.map((lecturer, index) => (
                                    <option key={index} value={lecturer}>
                                        {lecturer}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                className="border p-1 rounded text-xs"
                            >
                                <option value="">All Courses</option>
                                {uniqueCourses.map((course, index) => (
                                    <option key={index} value={course}>
                                        {course}
                                    </option>
                                ))}
                            </select>
                            <button onClick={handleDownloadCSV}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500">
                                Download CSV
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-400"
                            >
                                Download PDF
                            </button>
                        </div>

                        <table className="min-w-full divide-y divide-gray-500 text-xs">
                            <thead className="bg-gray-300 text-center ">
                                <tr >
                                    <th className="px-2 py-1 text-left uppercase">Faculty</th>
                                    <th className="px-2 py-1 text-left uppercase">Lecturer</th>
                                    <th className="px-2 py-1 text-left uppercase">Courses Assigned</th>
                                    <th className="px-2 py-1 text-left uppercase">Trimester</th>
                                    <th className="px-2 py-1 text-left uppercase">Block</th>
                                    <th className="px-2 py-1 text-left uppercase">Time</th>
                                    <th className="px-2 py-1 text-left uppercase">Cohort</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y ">
                                {filteredAssignments.map((item, index) => (
                                    <tr key={item.id}
                                        className={` ${index % 2 === 0 ? "bg-white" : "bg-gray-100"}`}
                                    >
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {item.faculty || "N/A"}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {item.type === "lecturer"
                                                ? item.lecturerName
                                                : item.lecturer || "N/A"}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {item.type === "timetable"
                                                ? item.module || item.title || "N/A"
                                                : item.type === "student"
                                                    ? item.modules && item.modules.join(", ")
                                                    : item.type === "lecturer"
                                                        ? item.course || "N/A"
                                                        : "N/A"}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {item.trimester || "N/A"}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {item.block || "N/A"}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {item.type === "timetable" && item.start
                                                ? new Date(item.start).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }) +
                                                (item.end
                                                    ? " - " +
                                                    new Date(item.end).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })
                                                    : "")
                                                : "N/A"}
                                        </td>
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {item.type === "timetable"
                                                ? item.cohort || "N/A"
                                                : item.type === "student"
                                                    ? `${item.intakeYear} ${item.intakeMonth} ${item.period}` ||
                                                    "N/A"
                                                    : "N/A"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTimetable;
