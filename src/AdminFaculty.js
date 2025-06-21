import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore"; //updateDoc } 
import Sidebar from "./Sidebar";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AdminFaculty = () => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lecturers, setLecturers] = useState([]);

    const [facultyFilter, setFacultyFilter] = useState("");
    const [lecturerFilter, setLecturerFilter] = useState("");
    const [courseNameFilter, setCourseNameFilter] = useState("");
    const [codeSelections, setCodeSelections] = useState([]);
    const [showCodeDialog, setShowCodeDialog] = useState(false);

    // const [editingId, setEditingId] = useState(null);
    const [editCodes, setEditCodes] = useState([]);
    const [showEditDialog, setShowEditDialog] = useState(false);

    // Load data
    useEffect(() => {
        const load = async () => {
            const usersSnap = await getDocs(collection(db, "users"));
            setLecturers(
                usersSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(u => u.role === "lecturer")
            );
            const coursesSnap = await getDocs(collection(db, "courses"));
            setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            const asgSnap = await getDocs(collection(db, "lecturers"));
            setAssignments(asgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        load();
    }, []);

    // Derived lists
    const faculties = [...new Set(lecturers.map(l => l.faculty))];
    const courseNames = [...new Set(courses.map(c => c.name))];
    const codesForName = courses
        .filter(c => c.name === courseNameFilter)
        .map(c => ({ id: c.id, code: c.code }));

    const toggleCode = (id, editing = false) => {
        if (editing) {
            setEditCodes(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else {
            setCodeSelections(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
    };

    const handleAssign = async () => {
        if (!facultyFilter || !lecturerFilter || !courseNameFilter || codeSelections.length === 0) {
            return alert("Fill in all fields and select codes!");
        }
        const lec = lecturers.find(l => l.id === lecturerFilter);
        if (!lec) return;

        const newAsg = [];
        for (let cid of codeSelections) {
            const course = courses.find(c => c.id === cid);
            if (!course) continue;
            const data = {
                lecturerId: lec.id,
                lecturerName: `${lec.firstName} ${lec.lastName}`,
                faculty: lec.faculty,
                course: course.name,
                courseCode: course.code,
            };
            const ref = await addDoc(collection(db, "lecturers"), data);
            newAsg.push({ id: ref.id, ...data });
        }
        setAssignments(a => [...a, ...newAsg]);
        // reset
        setFacultyFilter(""); setLecturerFilter("");
        setCourseNameFilter(""); setCodeSelections([]); setShowCodeDialog(false);
    };

    {/*
    const startEdit = (asg) => {
        setEditingId(asg.id);
        const matching = courses
            .filter(c => c.name === asg.course)
            .map(c => c.id);
        setEditCodes(matching);
        setShowEditDialog(true);
    };

    const saveEdit = async (id) => {
        for (let cid of editCodes) {
            const course = courses.find(c => c.id === cid);
            if (!course) continue;
            await updateDoc(doc(db, "lecturers", id), {
                course: course.name,
                courseCode: course.code,
            });
            setAssignments(a =>
                a.map(x => x.id === id ? { ...x, course: course.name, courseCode: course.code } : x)
            );
        }
        setEditingId(null);
        setEditCodes([]);
        setShowEditDialog(false);
    };
*/}

    const handleDelete = async (id) => {
        await deleteDoc(doc(db, "lecturers", id));
        setAssignments(a => a.filter(x => x.id !== id));
    };

    const auth = getAuth(); if (!auth.currentUser) return null;
    const logout = async () => { await signOut(auth); navigate("/"); };

    return (
        <div className="flex h-screen bg-stone-100">
            <Sidebar onLogout={logout} />
            <div className="flex-1 ml-64 p-4">
                <h1 className="text-xl font-bold mb-4">Faculty Management</h1>

                {/* Filters + Assign Button */}
                <div className="mb-4 flex flex-wrap gap-2 items-start">
                    <select value={facultyFilter} onChange={e => { setFacultyFilter(e.target.value); setShowCodeDialog(false); }} className="border p-1 text-sm">
                        <option value="">Select Faculty</option>
                        {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select value={lecturerFilter} onChange={e => setLecturerFilter(e.target.value)} disabled={!facultyFilter} className="border p-1 text-sm">
                        <option value="">Select Lecturer</option>
                        {lecturers.filter(l => l.faculty === facultyFilter).map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
                    </select>
                    <select value={courseNameFilter} onChange={e => { setCourseNameFilter(e.target.value); setShowCodeDialog(false); }} disabled={!facultyFilter} className="border p-1 text-sm">
                        <option value="">Select Module</option>
                        {courseNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {/* Open Dialog Button */}
                    {courseNameFilter && (
                        <button onClick={() => setShowCodeDialog(true)} className="bg-gray-300 px-2 py-1 text-sm rounded">Select Codes</button>
                    )}
                    <button onClick={handleAssign} className="bg-sky-700 text-white px-2 py-1 text-sm rounded">Assign Modules</button>
                </div>

                {/* Code Selection Dialog */}
                {showCodeDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
                        <div className="bg-white p-4 rounded shadow-lg max-h-96 overflow-auto">
                            <h3 className="font-semibold mb-2">Select Course Codes</h3>
                            {codesForName.map(c => (
                                <label key={c.id} className="flex items-center mb-1">
                                    <input type="checkbox" checked={codeSelections.includes(c.id)} onChange={() => toggleCode(c.id)} className="mr-2" />
                                    {c.code}
                                </label>
                            ))}
                            <div className="mt-4 text-right">
                                <button onClick={() => setShowCodeDialog(false)} className="mr-2 px-3 py-1 border rounded">Cancel</button>
                                <button onClick={handleAssign} className="bg-sky-700 text-white px-3 py-1 rounded">OK</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Dialog 
                {showEditDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
                        <div className="bg-white p-4 rounded shadow-lg max-h-96 overflow-auto">
                            <h3 className="font-semibold mb-2">Edit Course Codes</h3>
                            {codesForName.map(c => (
                                <label key={c.id} className="flex items-center mb-1">
                                    <input type="checkbox" checked={editCodes.includes(c.id)} onChange={() => toggleCode(c.id, true)} className="mr-2" />
                                    {c.code}
                                </label>
                            ))}
                           
                            <div className="mt-4 text-right">
                                <button onClick={() => setShowEditDialog(false)} className="mr-2 px-3 py-1 border rounded">Cancel</button>

                                <button onClick={() => saveEdit(editingId)} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                            
                            </div>
                        </div>
                    </div>
                )}
                */}

                {/* Assignment Table */}
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-1">Lecturer</th>
                            <th className="border p-1">Faculty</th>
                            <th className="border p-1">Course Code</th>
                            <th className="border p-1">Course</th>
                            <th className="border p-1">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(x => (
                            <tr key={x.id} className="even:bg-gray-100 text-center">
                                <td className="border p-1">{x.lecturerName}</td>
                                <td className="border p-1">{x.faculty}</td>
                                <td className="border p-1">{x.courseCode}</td>
                                <td className="border p-1">{x.course}</td>
                                <td className="border p-1 space-x-1">
                                    {/*
                                    <button onClick={() => startEdit(x)} className="bg-yellow-500 text-white px-2 py-1 text-xs rounded">Edit</button>
                                    */}
                                    <button onClick={() => handleDelete(x.id)} className="bg-red-500 text-white px-2 py-1 text-xs rounded">Relieve</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminFaculty;
