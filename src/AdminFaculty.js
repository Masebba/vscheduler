import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from "firebase/firestore";
import Sidebar from "./Sidebar";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AdminFaculty() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  // State
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [facultyFilter, setFacultyFilter] = useState("");
  const [lecturerFilter, setLecturerFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [codeSelections, setCodeSelections] = useState([]);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [room, setRoom] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Options
  const roomOptions = [];
  [50, 60, 70, 80].forEach(level => {
    for (let r = 1; r <= 8; r++) roomOptions.push(`${level}${r}`);
  });
  const timeOptions = [
    { value: "Day-Morning", label: "Day 08:00–12:00" },
    { value: "Day-Afternoon", label: "Day 14:00–16:30" },
    { value: "Eve", label: "Evening 17:30–20:30" },
    { value: "Wknd-Morn", label: "Weekend 08:00–12:00" },
    { value: "Wknd-Afternoon", label: "Weekend 14:00–16:00" },
    { value: "Wknd-Evening", label: "Weekend 18:00–20:00" }
  ];

  // Load data
  useEffect(() => {
    (async () => {
      const userSnap = await getDocs(collection(db, "users"));
      setLecturers(
        userSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.role === "lecturer")
      );
      const courseSnap = await getDocs(collection(db, "courses"));
      setCourses(courseSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const assignSnap = await getDocs(collection(db, "lecturers"));
      setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  // Derived lists
  const faculties = [...new Set(lecturers.map(l => l.faculty))];
  const modules = [...new Set(courses.map(c => c.name))];
  // match modules case-insensitive
  const codesForModule = courses
    // case-insensitive match: include any course whose name includes the filter
    .filter(c => c.name.toLowerCase().includes(moduleFilter.trim().toLowerCase()))
    .map(c => ({ id: c.id, code: c.code }));

  // Toggle code selection
  const toggleCode = id =>
    setCodeSelections(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  // Conflict check for room/time and lecturer
  const hasConflict = async () => {
    if (!room || !timeSlot) return false;
    // room/time
    const roomQ = query(
      collection(db, "lecturers"),
      where("room", "==", room),
      where("timeSlot", "==", timeSlot)
    );
    const roomSnap = await getDocs(roomQ);
    if (!roomSnap.empty && !editingId) return true;
    // lecturer time clash
    const timeQ = query(
      collection(db, "lecturers"),
      where("lecturerId", "==", lecturerFilter),
      where("timeSlot", "==", timeSlot)
    );
    const timeSnap = await getDocs(timeQ);
    if (timeSnap.docs.some(d => d.id !== editingId)) return true;
    return false;
  };

  // Save (OK)
  const handleSave = async () => {
    if (
      !facultyFilter || !lecturerFilter || !moduleFilter ||
      codeSelections.length === 0 || !room || !timeSlot
    ) {
      return alert("Please complete all fields & select codes.");
    }
    if (await hasConflict()) {
      return alert("Conflict detected for room or lecturer time.");
    }
    // perform add or update
    const lect = lecturers.find(l => l.id === lecturerFilter);
    const batch = [];
    for (let cid of codeSelections) {
      const mod = courses.find(c => c.id === cid);
      const data = {
        lecturerId: lect.id,
        lecturerName: `${lect.firstName} ${lect.lastName}`,
        faculty: lect.faculty,
        course: mod.name,
        courseCode: mod.code,
        room,
        timeSlot
      };
      if (editingId) {
        await updateDoc(doc(db, "lecturers", editingId), data);
        setAssignments(a => a.map(x => x.id === editingId ? { ...x, ...data } : x));
      } else {
        const ref = await addDoc(collection(db, "lecturers"), data);
        batch.push({ id: ref.id, ...data });
      }
    }
    if (batch.length) setAssignments(a => [...a, ...batch]);
    // reset
    setFacultyFilter("");
    setLecturerFilter("");
    setModuleFilter("");
    setCodeSelections([]);
    setRoom("");
    setTimeSlot("");
    setShowCodeDialog(false);
    setEditingId(null);
  };

  // Start edit
  const startEdit = item => {
    setEditingId(item.id);
    setFacultyFilter(item.faculty);
    setLecturerFilter(item.lecturerId);
    setModuleFilter(item.course);
    setCodeSelections(
      courses.filter(c => c.name === item.course).map(c => c.id)
    );
    setRoom(item.room);
    setTimeSlot(item.timeSlot);
    setShowCodeDialog(true);
  };

  // Delete
  const handleDelete = async id => {
    await deleteDoc(doc(db, "lecturers", id));
    setAssignments(a => a.filter(x => x.id !== id));
  };

  // Logout
  const logout = () => signOut(auth).then(() => navigate("/"));

  return (
    <div className="flex h-screen bg-stone-100">
      <Sidebar onLogout={logout} />
      <div className="flex-1 ml-64 p-4">
        <h1 className="text-xl font-bold mb-4">Faculty Management</h1>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <select
            className="border p-1"
            value={facultyFilter}
            onChange={e => setFacultyFilter(e.target.value)}
          >
            <option value="">Filter Faculty</option>
            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <select
            className="border p-1"
            disabled={!facultyFilter}
            value={lecturerFilter}
            onChange={e => setLecturerFilter(e.target.value)}
          >
            <option value="">Select Lecturer</option>
            {lecturers
              .filter(l => l.faculty === facultyFilter)
              .map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
          </select>

          <select
            className="border p-1"
            disabled={!facultyFilter}
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
          >
            <option value="">Select Module</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            className="border p-1"
            value={room}
            onChange={e => setRoom(e.target.value)}
          >
            <option value="">Select Room</option>
            {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            className="border p-1"
            value={timeSlot}
            onChange={e => setTimeSlot(e.target.value)}
          >
            <option value="">Select Time</option>
            {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {moduleFilter && (
            <button
              onClick={() => setShowCodeDialog(true)}
              className="bg-gray-300 px-2 py-1 text-sm rounded"
            >Module Codes</button>
          )}
        </div>

        {/* Code Dialog */}
        {showCodeDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
            <div className="bg-white p-4 rounded shadow-lg w-80 max-h-96 overflow-auto">
              <h3 className="font-semibold mb-2">Codes for {moduleFilter}</h3>
              {codesForModule.map(c => (
                <label key={c.id} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={codeSelections.includes(c.id)}
                    onChange={() => toggleCode(c.id)}
                    className="mr-2"
                  />{c.code}
                </label>
              ))}
              <div className="mt-4 text-right">
                <button
                  onClick={() => setShowCodeDialog(false)}
                  className="mr-2 px-3 py-1 border rounded"
                >Cancel</button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >OK</button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-1">Lecturer</th>
              <th className="border p-1">Faculty</th>
              <th className="border p-1">Code</th>
              <th className="border p-1">Module</th>
              <th className="border p-1">Room</th>
              <th className="border p-1">Time</th>
              <th className="border p-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="even:bg-gray-100 text-center">
                <td className="border p-1">{a.lecturerName}</td>
                <td className="border p-1">{a.faculty}</td>
                <td className="border p-1">{a.courseCode}</td>
                <td className="border p-1">{a.course}</td>
                <td className="border p-1">{a.room}</td>
                <td className="border p-1">{timeOptions.find(t => t.value === a.timeSlot)?.label}</td>
                <td className="border p-1 space-x-1">
                  <button onClick={() => startEdit(a)} className="bg-yellow-500 text-white px-2 py-1 text-xs rounded mr-1">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="bg-red-500 text-white px-2 py-1 text-xs rounded">Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
