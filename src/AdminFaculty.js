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
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // State declarations
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [facultyFilter, setFacultyFilter] = useState("");
  const [lecturerFilter, setLecturerFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [codeSelections, setCodeSelections] = useState([]);
  const [showCodeDialog, setShowCodeDialog] = useState(false);

  const [block, setBlock] = useState("");
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

  const blockOptions = ["Block 1", "Block 2", "Block 3", "Block 4"];

  // Load data once
  useEffect(() => {
    (async () => {
      const uSnap = await getDocs(collection(db, "users"));
      setLecturers(
        uSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.role === "lecturer")
      );

      const cSnap = await getDocs(collection(db, "courses"));
      setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const aSnap = await getDocs(collection(db, "lecturers"));
      setAssignments(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  // Derived lists
  const faculties = [...new Set(lecturers.map(l => l.faculty))];
  const modules = [...new Set(courses.map(c => c.name))];
  const codesForModule = courses.filter(c => c.name === moduleFilter);

  // Toggle code selection
  const toggleCode = id =>
    setCodeSelections(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  // Conflict checks
  const hasRoomTimeConflict = async (r, t) => {
    const q = query(
      collection(db, "lecturers"),
      where("room", "==", r),
      where("timeSlot", "==", t)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const hasTimeConflict = async (lectId, t) => {
    const q = query(
      collection(db, "lecturers"),
      where("lecturerId", "==", lectId),
      where("timeSlot", "==", t)
    );
    const snap = await getDocs(q);
    return snap.docs.filter(d => d.id !== editingId).length > 0;
  };

  const hasBlockConflict = async (lectId, blk) => {
    const q = query(
      collection(db, "lecturers"),
      where("lecturerId", "==", lectId),
      where("block", "==", blk)
    );
    const snap = await getDocs(q);
    const count = editingId
      ? snap.docs.filter(d => d.id !== editingId).length
      : snap.size;
    return count >= 3;
  };

  // Save or update assignment
  const handleSave = async () => {
    if (
      !facultyFilter ||
      !lecturerFilter ||
      !moduleFilter ||
      codeSelections.length === 0 ||
      !block ||
      !room ||
      !timeSlot
    ) {
      return alert("Please complete all fields.");
    }

    if (await hasRoomTimeConflict(room, timeSlot) && !editingId) {
      return alert("Room/Time is already booked.");
    }

    if (await hasTimeConflict(lecturerFilter, timeSlot)) {
      return alert("This lecturer already has a class at that time.");
    }

    if (await hasBlockConflict(lecturerFilter, block)) {
      return alert("Lecturer is overloaded.");
    }

    const lect = lecturers.find(l => l.id === lecturerFilter);
    const batch = [];

    for (let cid of codeSelections) {
      const m = courses.find(c => c.id === cid);
      const data = {
        lecturerId: lect.id,
        lecturerName: `${lect.firstName} ${lect.lastName}`,
        faculty: lect.faculty,
        course: m.name,
        courseCode: m.code,
        block,
        room,
        timeSlot
      };

      if (editingId) {
        await updateDoc(doc(db, "lecturers", editingId), data);
        setAssignments(a => a.map(x => (x.id === editingId ? { ...x, ...data } : x)));
      } else {
        const ref = await addDoc(collection(db, "lecturers"), data);
        batch.push({ id: ref.id, ...data });
      }
    }

    if (batch.length) setAssignments(a => [...a, ...batch]);

    // Reset form
    setFacultyFilter("");
    setLecturerFilter("");
    setModuleFilter("");
    setCodeSelections([]);
    setBlock("");
    setRoom("");
    setTimeSlot("");
    setShowCodeDialog(false);
    setEditingId(null);
  };

  // Begin editing an existing assignment
  const startEdit = a => {
    setEditingId(a.id);
    setFacultyFilter(a.faculty);
    setLecturerFilter(a.lecturerId);
    setModuleFilter(a.course);
    setCodeSelections(courses.filter(c => c.name === a.course).map(c => c.id));
    setBlock(a.block);
    setRoom(a.room);
    setTimeSlot(a.timeSlot);
    setShowCodeDialog(true);
  };

  // Delete assignment
  const handleDelete = async id => {
    await deleteDoc(doc(db, "lecturers", id));
    setAssignments(a => a.filter(x => x.id !== id));
  };

  const logout = () => signOut(auth).then(() => navigate("/"));

  return (
    <div className="flex h-screen bg-stone-100">
      <Sidebar onLogout={logout} />
      <div className="flex-1 ml-64 p-4">
        <h1 className="text-xl font-bold mb-4">Faculty Management</h1>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <select className="border p-1" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}>
            <option value="">Filter Faculty</option>
            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <select className="border p-1" disabled={!facultyFilter} value={lecturerFilter} onChange={e => setLecturerFilter(e.target.value)}>
            <option value="">Select Lecturer</option>
            {lecturers.filter(l => l.faculty === facultyFilter).map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
          </select>

          <select className="border p-1" disabled={!facultyFilter} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
            <option value="">Select Module</option>
            {modules.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select className="border p-1" value={block} onChange={e => setBlock(e.target.value)}>
            <option value="">Select Block</option>
            {blockOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select className="border p-1" value={room} onChange={e => setRoom(e.target.value)}>
            <option value="">Select Room</option>
            {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select className="border p-1" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
            <option value="">Select Time</option>
            {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {moduleFilter && <button onClick={() => setShowCodeDialog(true)} className="bg-gray-300 px-2 py-1 rounded">Module Codes</button>}
        </div>

        {/* Code Dialog */}
        {showCodeDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
            <div className="bg-white p-4 rounded shadow-lg w-80 max-h-96 overflow-auto">
              <h3 className="font-semibold mb-2">Select Codes for {moduleFilter}</h3>
              {codesForModule.map(c => (
                <label key={c.id} className="flex items-center mb-1">
                  <input type="checkbox" checked={codeSelections.includes(c.id)} onChange={() => toggleCode(c.id)} className="mr-2" />{c.code}
                </label>
              ))}
              <div className="mt-4 text-right">
                <button onClick={() => setShowCodeDialog(false)} className="mr-2 px-3 py-1 border rounded">Cancel</button>
                <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded">OK</button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-1">Lecturer</th><th className="border p-1">Faculty</th><th className="border p-1">Code</th><th className="border p-1">Module</th><th className="border p-1">Block</th><th className="border p-1">Room</th><th className="border p-1">Time</th><th className="border p-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="even:bg-gray-100 text-center">
                <td className="border p-1">{a.lecturerName}</td>
                <td className="border p-1">{a.faculty}</td>
                <td className="border p-1">{a.courseCode}</td>
                <td className="border p-1">{a.course}</td>
                <td className="border p-1">{a.block}</td>
                <td className="border p-1">{a.room}</td>
                <td className="border p-1">{timeOptions.find(t => t.value === a.timeSlot)?.label}</td>
                <td className="border p-1 space-x-1"><button onClick={() => startEdit(a)} className="bg-yellow-500 text-white px-2 py-1 text-xs rounded">Edit</button><button onClick={() => handleDelete(a.id)} className="bg-red-500 text-white px-2 py-1 text-xs rounded">Del</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
