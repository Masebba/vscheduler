import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";

const AdminCourses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [newCourse, setNewCourse] = useState({ faculty: "", field: "", name: "", code: "" });

    // Filters
    const [facultyFilter, setFacultyFilter] = useState("");
    const [fieldFilter, setFieldFilter] = useState("");
    const [nameFilter, setNameFilter] = useState("");

    // Edit Course state
    const [editDialog, setEditDialog] = useState(false);
    const [courseToEdit, setCourseToEdit] = useState(null);

    // Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            const querySnapshot = await getDocs(collection(db, "courses"));
            setCourses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchCourses();
    }, []);

    const handleAddCourse = async () => {
        if (!newCourse.faculty || !newCourse.field || !newCourse.name || !newCourse.code) {
            return alert("Fill in all fields!");
        }
        const docRef = await addDoc(collection(db, "courses"), newCourse);
        setCourses([...courses, { id: docRef.id, ...newCourse }]);
        setNewCourse({ faculty: "", field: "", name: "", code: "" });
        setShowDialog(false);
    };

    const handleDeleteCourse = async (id) => {
        await deleteDoc(doc(db, "courses", id));
        setCourses(courses.filter(course => course.id !== id));
    };

    // Filtered Courses List
    const filteredCourses = courses.filter(course =>
        (facultyFilter ? course.faculty === facultyFilter : true) &&
        (fieldFilter ? course.field === fieldFilter : true) &&
        (nameFilter ? course.name.toLowerCase().includes(nameFilter.toLowerCase()) : true)
    );

    // Get unique faculties and fields for dropdowns
    const faculties = [...new Set(courses.map(course => course.faculty))];
    const fields = [...new Set(courses.filter(course => course.faculty === facultyFilter || !facultyFilter).map(course => course.field))];

    // Edit Dialog functions
    const openEditDialog = (course) => {
        setCourseToEdit(course);
        setEditDialog(true);
    };

    const handleUpdateCourse = async () => {
        if (!courseToEdit.faculty || !courseToEdit.field || !courseToEdit.name || !courseToEdit.code) {
            return alert("Fill in all fields!");
        }
        const courseDoc = doc(db, "courses", courseToEdit.id);
        await updateDoc(courseDoc, {
            faculty: courseToEdit.faculty,
            field: courseToEdit.field,
            name: courseToEdit.name,
            code: courseToEdit.code
        });
        setCourses(courses.map(c => (c.id === courseToEdit.id ? courseToEdit : c)));
        setEditDialog(false);
        setCourseToEdit(null);
    };
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex h-screen bg-stone-100">
            <Sidebar />
            <Sidebar onLogout={handleLogout} />
            <div className="flex-1 ml-64 p-4">
                <h1 className="text-xl font-semibold mb-2">Course Management</h1>

                <div className="flex justify-between mb-2">
                    <button
                        onClick={() => setShowDialog(true)}
                        className="bg-sky-700 text-white px-3 py-1 text-sm rounded hover:bg-sky-600"
                    >
                        Add Course
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-2 flex gap-2">
                    <select
                        value={facultyFilter}
                        onChange={(e) => setFacultyFilter(e.target.value)}
                        className="border p-1 text-sm rounded"
                    >
                        <option value="">All Faculties</option>
                        {faculties.map(faculty => (
                            <option key={faculty} value={faculty}>
                                {faculty}
                            </option>
                        ))}
                    </select>

                    <select
                        value={fieldFilter}
                        onChange={(e) => setFieldFilter(e.target.value)}
                        className="border p-1 text-sm rounded"
                    >
                        <option value="">All Fields</option>
                        {fields.map(field => (
                            <option key={field} value={field}>
                                {field}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Search Module Name"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="border p-1 text-sm rounded hover:border-sky-600"
                    />
                </div>

                {/* Courses Table */}
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-300 text-gray-700">
                        <tr>
                            <th className="border p-1">Faculty</th>
                            <th className="border p-1">Field of Study</th>
                            <th className="border p-1">Module Code</th>
                            <th className="border p-1">Module Name</th>
                            <th className="border p-1">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <tr key={course.id} className="text-center odd:bg-white even:bg-gray-100">
                                    <td className="border p-1">{course.faculty}</td>
                                    <td className="border p-1">{course.field}</td>
                                    <td className="border p-1">{course.code}</td>
                                    <td className="border p-1">{course.name}</td>
                                    <td className="border p-1 flex justify-center gap-1">
                                        <button
                                            onClick={() => openEditDialog(course)}
                                            className="bg-yellow-500 text-white px-2 py-1 text-xs rounded hover:bg-yellow-300"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(course.id)}
                                            className="bg-red-700 text-white px-2 py-1 text-xs rounded hover:bg-red-500"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-2 text-gray-500">
                                    No matching courses found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Add Course Dialog */}
                {showDialog && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-4 rounded shadow-lg w-80">
                            <h2 className="text-lg font-semibold mb-2">Add Course</h2>
                            <input
                                type="text"
                                placeholder="Faculty"
                                value={newCourse.faculty}
                                onChange={(e) => setNewCourse({ ...newCourse, faculty: e.target.value })}

                                className="border p-1 mb-1 w-full text-sm rounded"
                            />

                            <input
                                type="text"
                                placeholder="Field of Study"
                                value={newCourse.field}
                                onChange={(e) => setNewCourse({ ...newCourse, field: e.target.value })}
                                className="border p-1 mb-1 w-full text-sm rounded"
                            />
                            <input
                                type="text"
                                placeholder="Module Name"
                                value={newCourse.name}
                                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                className="border p-1 mb-1 w-full text-sm rounded"
                            />
                            <input
                                type="text"
                                placeholder="Module Code"
                                value={newCourse.code}
                                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                className="border p-1 mb-2 w-full text-sm rounded"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowDialog(false)}
                                    className="bg-gray-200 px-3 py-1 text-sm rounded mr-1 hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button onClick={handleAddCourse} className="bg-sky-700 text-white px-3 py-1 text-sm rounded hover:bg-sky-600">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Course Dialog */}
                {editDialog && courseToEdit && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-4 rounded shadow-lg w-80">
                            <h2 className="text-lg font-semibold mb-2">Edit Course</h2>
                            <input
                                type="text"
                                placeholder="Faculty"
                                value={courseToEdit.faculty}
                                onChange={(e) => setCourseToEdit({ ...courseToEdit, faculty: e.target.value })}
                                className="border p-1 mb-1 w-full text-sm rounded"
                            />
                            <input
                                type="text"
                                placeholder="Field of Study"
                                value={courseToEdit.field}
                                onChange={(e) => setCourseToEdit({ ...courseToEdit, field: e.target.value })}
                                className="border p-1 mb-1 w-full text-sm rounded"
                            />
                            <input
                                type="text"
                                placeholder="Module Name"
                                value={courseToEdit.name}
                                onChange={(e) => setCourseToEdit({ ...courseToEdit, name: e.target.value })}
                                className="border p-1 mb-1 w-full text-sm rounded"
                            />
                            <input
                                type="text"
                                placeholder="Module Code"
                                value={courseToEdit.code}
                                onChange={(e) => setCourseToEdit({ ...courseToEdit, code: e.target.value })}
                                className="border p-1 mb-2 w-full text-sm rounded"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setEditDialog(false);
                                        setCourseToEdit(null);
                                    }}
                                    className="mr-2 px-3 py-1 border rounded  text-black text-xs rounded hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button onClick={handleUpdateCourse}
                                    className="bg-sky-700 text-white px-3 py-1 text-sm rounded hover:bg-blue-500">
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminCourses;
