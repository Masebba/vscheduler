import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";

const Students = () => {
    const navigate = useNavigate();
    const db = getFirestore();

    // Students state
    const [students, setStudents] = useState([]);
    const [newStudent, setNewStudent] = useState({
        fullName: "",
        faculty: "",
        regNumber: "",
        email: "",
        phone: "",
        // auto-populated fields from the registration number:
        course: "",
        intakeYear: "",
        intakeMonth: "",
        period: "",
        // Additional fields:
        trimester: "",
        block: "",
        modules: [] // Assigned course modules
    });
    const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Filters for student list
    const [selectedFilters, setSelectedFilters] = useState({
        faculty: "",
        course: "",
        intakeYear: "",
        intakeMonth: "",
        period: "",
        trimester: "",
        block: ""
    });

    // Assign Course Module modal state.
    // We use "field" to refer to the course/field of study as used in Course Management.
    const [assignCourseData, setAssignCourseData] = useState({
        faculty: "",
        field: "",
        intakeYear: "",
        intakeMonth: "",
        period: "",
        trimester: "",
        block: "",
        modules: [] // List of selected module names.
    });
    const [showAssignCourseDialog, setShowAssignCourseDialog] = useState(false);

    // --- NEW: Courses List fetched from Firestore ("courses" collection) ---
    const [coursesList, setCoursesList] = useState([]);

    useEffect(() => {
        // Fetch student records.
        const fetchStudents = async () => {
            const studentsCollection = collection(db, "students");
            const studentSnapshot = await getDocs(studentsCollection);
            const studentList = studentSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(studentList);
        };
        fetchStudents();
    }, [db]);

    useEffect(() => {
        // Fetch courses (modules) from Firestore.
        const fetchCourses = async () => {
            const coursesCollection = collection(db, "courses");
            const querySnapshot = await getDocs(coursesCollection);
            const courses = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setCoursesList(courses);
        };
        fetchCourses();
    }, [db]);

    // Helper: Parse registration number format: "VU-BCS-2309-0412-DAY"
    // Extracts: course = parts[1], intakeYear = "20" + first 2 digits of parts[2],
    // intakeMonth = mapped month name (from last 2 digits of parts[2]), period = parts[4]
    const parseRegNumber = (regNumber) => {
        const parts = regNumber.split("-");
        if (parts.length < 5) return {};
        const course = parts[1];
        const yearMonth = parts[2]; // e.g. "2309"
        const period = parts[4];
        const year = "20" + yearMonth.slice(0, 2);
        const monthNum = yearMonth.slice(2, 4);
        const monthNames = {
            "01": "January",
            "02": "February",
            "03": "March",
            "04": "April",
            "05": "May",
            "06": "June",
            "07": "July",
            "08": "August",
            "09": "September",
            "10": "October",
            "11": "November",
            "12": "December"
        };
        const intakeMonth = monthNames[monthNum] || "";
        return { course, intakeYear: year, intakeMonth, period };
    };

    // --- Helper for student list filtering ---
    const filterOptions = (key) => {
        const options = new Set();
        students.forEach((student) => {
            if (student[key]) options.add(student[key]);
        });
        return Array.from(options);
    };

    // Compute filtered students based on selectedFilters.
    const filteredStudents = students.filter((student) =>
        Object.keys(selectedFilters).every((key) => {
            if (!selectedFilters[key]) return true;
            return student[key] === selectedFilters[key];
        })
    );

    // --- Handlers for new student ---
    const handleNewStudentRegNumberChange = (e) => {
        const reg = e.target.value;
        setNewStudent((prev) => ({ ...prev, regNumber: reg }));
        const parsed = parseRegNumber(reg);
        if (parsed.course) {
            setNewStudent((prev) => ({
                ...prev,
                course: parsed.course,
                intakeYear: parsed.intakeYear,
                intakeMonth: parsed.intakeMonth,
                period: parsed.period
            }));
        }
    };

    const handleAddStudent = async () => {
        if (
            !newStudent.fullName ||
            !newStudent.faculty ||
            !newStudent.regNumber ||
            !newStudent.email ||
            !newStudent.phone
        ) {
            alert("Please fill in all required fields");
            return;
        }
        const parsed = parseRegNumber(newStudent.regNumber);
        if (!parsed.course || !parsed.intakeYear || !parsed.intakeMonth || !parsed.period) {
            alert("Invalid registration number format");
            return;
        }
        const studentToAdd = { ...newStudent, ...parsed };

        try {
            const studentsCollection = collection(db, "students");
            const docRef = await addDoc(studentsCollection, studentToAdd);
            setStudents([...students, { id: docRef.id, ...studentToAdd }]);
            // Reset new student form.
            setNewStudent({
                fullName: "",
                faculty: "",
                regNumber: "",
                email: "",
                phone: "",
                course: "",
                intakeYear: "",
                intakeMonth: "",
                period: "",
                trimester: "",
                block: "",
                modules: []
            });
            setShowAddStudentDialog(false);
        } catch (error) {
            console.error("Error adding student: ", error);
        }
    };

    // --- Handlers for editing a student ---
    const handleEditingStudentChange = (e) => {
        const { name, value } = e.target;
        setEditingStudent((prev) => ({ ...prev, [name]: value }));
        if (name === "regNumber") {
            const parsed = parseRegNumber(value);
            if (parsed.course) {
                setEditingStudent((prev) => ({ ...prev, ...parsed }));
            }
        }
    };

    const handleSaveEditStudent = async () => {
        if (
            !editingStudent.fullName ||
            !editingStudent.faculty ||
            !editingStudent.regNumber ||
            !editingStudent.email ||
            !editingStudent.phone
        ) {
            alert("Please fill in all required fields");
            return;
        }
        const parsed = parseRegNumber(editingStudent.regNumber);
        if (!parsed.course || !parsed.intakeYear || !parsed.intakeMonth || !parsed.period) {
            alert("Invalid registration number format");
            return;
        }
        const updatedStudent = { ...editingStudent, ...parsed };

        try {
            await updateDoc(doc(db, "students", editingStudent.id), updatedStudent);
            setStudents(
                students.map((student) =>
                    student.id === editingStudent.id ? updatedStudent : student
                )
            );
            setEditingStudent(null);
        } catch (error) {
            console.error("Error updating student: ", error);
        }
    };

    // --- Handler for deleting a student ---
    const handleDeleteStudent = async (id) => {
        try {
            await deleteDoc(doc(db, "students", id));
            setStudents(students.filter((student) => student.id !== id));
        } catch (error) {
            console.error("Error deleting student: ", error);
        }
    };

    // --- Handlers for Assign Course Module modal ---
    // Update assignCourseData for all changes.
    const handleAssignCourseDataChange = (e) => {
        const { name, value } = e.target;
        setAssignCourseData((prev) => ({ ...prev, [name]: value }));
    };

    // Handler for multi-select modules.
    const handleAssignModulesChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
        setAssignCourseData((prev) => ({ ...prev, modules: selected }));
    };

    // When the user clicks "Assign", update all matching student documents.
    const handleAssignCourseModule = async () => {
        // Ensure all required fields are filled.
        if (
            !assignCourseData.faculty ||
            !assignCourseData.field ||
            !assignCourseData.intakeYear ||
            !assignCourseData.intakeMonth ||
            !assignCourseData.period ||
            !assignCourseData.trimester ||
            !assignCourseData.block ||
            assignCourseData.modules.length === 0
        ) {
            alert("Please fill in all cohort fields and select at least one module");
            return;
        }

        try {
            // Fetch the latest list of students.
            const studentsCollection = collection(db, "students");
            const studentSnapshot = await getDocs(studentsCollection);
            const studentList = studentSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            // Find students matching the cohort criteria.
            // ...compare assignCourseData.field with student.course.
            const studentsToUpdate = studentList.filter((student) => {
                return (
                    student.faculty === assignCourseData.faculty &&
                    student.course === assignCourseData.field &&
                    student.intakeYear === assignCourseData.intakeYear &&
                    student.intakeMonth === assignCourseData.intakeMonth &&
                    student.period === assignCourseData.period
                );
            });

            console.log("Matching students:", studentsToUpdate);
            if (studentsToUpdate.length === 0) {
                alert("No matching students found for the selected cohort criteria.");
                return;
            }

            // Update each matching student with the selected modules, trimester, and block.
            for (const student of studentsToUpdate) {
                const studentRef = doc(db, "students", student.id);
                await updateDoc(studentRef, {
                    modules: assignCourseData.modules,
                    trimester: assignCourseData.trimester,
                    block: assignCourseData.block
                });
            }

            // Update the UI.
            setStudents((prev) =>
                prev.map((student) =>
                    studentsToUpdate.some((s) => s.id === student.id)
                        ? {
                            ...student,
                            modules: assignCourseData.modules,
                            trimester: assignCourseData.trimester,
                            block: assignCourseData.block
                        }
                        : student
                )
            );

            // Reset assign modal state and close modal.
            setAssignCourseData({
                faculty: "",
                field: "",
                intakeYear: "",
                intakeMonth: "",
                period: "",
                trimester: "",
                block: "",
                modules: []
            });
            setShowAssignCourseDialog(false);
        } catch (error) {
            console.error("Error assigning course modules:", error);
        }
    };

    // --- Helpers for the Assign modal options ---
    const uniqueFaculties = [...new Set(coursesList.map((course) => course.faculty))];
    const uniqueFields =
        assignCourseData.faculty !== ""
            ? [
                ...new Set(
                    coursesList
                        .filter((course) => course.faculty === assignCourseData.faculty)
                        .map((course) => course.field)
                )
            ]
            : [];

    // For the multi-select of modules, filter coursesList by selected faculty and field.
    const availableModules =
        assignCourseData.faculty && assignCourseData.field
            ? coursesList.filter(
                (course) =>
                    course.faculty === assignCourseData.faculty &&
                    course.field === assignCourseData.field
            )
            : [];

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <div className="flex">
            <Sidebar />
            <Sidebar onLogout={handleLogout} />
            <div className="flex-1 ml-64 p-4 bg-stone-100">
                <h2 className="text-xl font-bold">Manage Students</h2>
                <div className="flex justify-between mt-2">
                    <button
                        onClick={() => setShowAssignCourseDialog(true)}
                        className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                        Assign Course Module
                    </button>
                    <button
                        onClick={() => setShowAddStudentDialog(true)}
                        className="bg-sky-700 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                        Add New Student
                    </button>
                </div>

                {/* Student Filters */}
                <div className="grid grid-cols-7 gap-2 mt-2">
                    {Object.keys(selectedFilters).map((filter) => (
                        <select
                            key={filter}
                            className="p-1 border rounded text-sm"
                            value={selectedFilters[filter]}
                            onChange={(e) =>
                                setSelectedFilters({ ...selectedFilters, [filter]: e.target.value })
                            }
                        >
                            <option value="">{filter.replace(/([A-Z])/g, " $1").trim()}</option>
                            {filterOptions(filter).map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    ))}
                </div>

                {/* Student List Table */}
                <div className="mt-4 bg-white p-2 rounded-lg shadow-md">
                    <h3 className="text-md font-semibold">Student List</h3>
                    <table className="w-full mt-2 text-sm border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-1">Name</th>
                                <th className="border p-1">Faculty</th>
                                <th className="border p-1">Course</th>
                                <th className="border p-1">Intake Year</th>
                                <th className="border p-1">Intake Month</th>
                                <th className="border p-1">Period</th>
                                <th className="border p-1">Trimester</th>
                                <th className="border p-1">Block</th>
                                <th className="border p-1">Course Module</th>
                                <th className="border p-1">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="text-center">
                                    <td className="border p-1">{student.fullName}</td>
                                    <td className="border p-1">{student.faculty}</td>
                                    <td className="border p-1">{student.course}</td>
                                    <td className="border p-1">{student.intakeYear}</td>
                                    <td className="border p-1">{student.intakeMonth}</td>
                                    <td className="border p-1">{student.period}</td>
                                    <td className="border p-1">{student.trimester || "N/A"}</td>
                                    <td className="border p-1">{student.block || "N/A"}</td>
                                    <td className="border p-0 text-[9px]">
                                        {student.modules && student.modules.length
                                            ? student.modules.join(", ")
                                            : "No module assigned"}
                                    </td>
                                    <td className="border p-1 space-x-1">
                                        <button
                                            onClick={() => setEditingStudent(student)}
                                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-300"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStudent(student.id)}
                                            className="bg-red-700 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Add New Student */}
            {showAddStudentDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h3 className="text-lg font-bold mb-4">Add New Student</h3>
                        <input
                            type="text"
                            className="border p-1 w-full mb-2"
                            placeholder="Full Name"
                            value={newStudent.fullName}
                            onChange={(e) =>
                                setNewStudent({ ...newStudent, fullName: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            className="border p-1 w-full mb-2"
                            placeholder="Faculty"
                            value={newStudent.faculty}
                            onChange={(e) =>
                                setNewStudent({ ...newStudent, faculty: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            className="border p-1 w-full mb-2"
                            placeholder="Registration Number (e.g. VU-BCS-2309-0412-DAY)"
                            value={newStudent.regNumber}
                            onChange={handleNewStudentRegNumberChange}
                        />
                        <input
                            type="email"
                            className="border p-1 w-full mb-2"
                            placeholder="Email"
                            value={newStudent.email}
                            onChange={(e) =>
                                setNewStudent({ ...newStudent, email: e.target.value })
                            }
                        />
                        <input
                            type="text"
                            className="border p-1 w-full mb-2"
                            placeholder="Phone"
                            value={newStudent.phone}
                            onChange={(e) =>
                                setNewStudent({ ...newStudent, phone: e.target.value })
                            }
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setShowAddStudentDialog(false)}
                                className="mr-2 px-3 py-1 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddStudent}
                                className="bg-sky-700 text-white px-3 py-1 rounded hover:bg-blue-600"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Edit Student */}
            {editingStudent && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h3 className="text-lg font-bold mb-4">Edit Student</h3>
                        <input
                            type="text"
                            className="border p-1 w-full mb-2"
                            placeholder="Full Name"
                            name="fullName"
                            value={editingStudent.fullName}
                            onChange={handleEditingStudentChange}
                        />
                        <input
                            type="text"
                            className="border p-1 w-full mb-2"
                            placeholder="Faculty"
                            name="faculty"
                            value={editingStudent.faculty}
                            onChange={handleEditingStudentChange}
                        />
                        <input
                            type="text"
                            className="border p-1 w-full mb-2"
                            placeholder="Registration Number (e.g. VU-BCS-2309-0412-DAY)"
                            name="regNumber"
                            value={editingStudent.regNumber}
                            onChange={handleEditingStudentChange}
                        />
                        <input
                            type="email"
                            className="border p-1 w-full mb-2"
                            placeholder="Email"
                            name="email"
                            value={editingStudent.email}
                            onChange={handleEditingStudentChange}
                        />
                        <input
                            type="text"
                            className="border p-1 w-full mb-2"
                            placeholder="Phone"
                            name="phone"
                            value={editingStudent.phone}
                            onChange={handleEditingStudentChange}
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setEditingStudent(null)}
                                className="mr-2 px-3 py-1 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEditStudent}
                                className="bg-sky-700 text-white px-3 py-1 rounded hover:bg-blue-600"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Assign Course Module */}
            {showAssignCourseDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h3 className="text-lg font-bold mb-4">Assign Course Module</h3>
                        {/* Faculty selection from coursesList */}
                        <select
                            name="faculty"
                            className="border p-1 w-full mb-2"
                            value={assignCourseData.faculty}
                            onChange={handleAssignCourseDataChange}
                        >
                            <option value="">Faculty</option>
                            {uniqueFaculties.map((fac) => (
                                <option key={fac} value={fac}>
                                    {fac}
                                </option>
                            ))}
                        </select>
                        {/* Field (Course) selection based on selected faculty */}
                        <select
                            name="field"
                            className="border p-1 w-full mb-2"
                            value={assignCourseData.field}
                            onChange={handleAssignCourseDataChange}
                        >
                            <option value="">Field of Study</option>
                            {assignCourseData.faculty &&
                                uniqueFields.map((fld) => (
                                    <option key={fld} value={fld}>
                                        {fld}
                                    </option>
                                ))}
                        </select>
                        {/* The following selects remain as before for intake details */}
                        <select
                            name="intakeYear"
                            className="border p-1 w-full mb-2"
                            value={assignCourseData.intakeYear}
                            onChange={handleAssignCourseDataChange}
                        >
                            <option value="">Intake Year</option>
                            {filterOptions("intakeYear").map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <select
                            name="intakeMonth"
                            className="border p-1 w-full mb-2"
                            value={assignCourseData.intakeMonth}
                            onChange={handleAssignCourseDataChange}
                        >
                            <option value="">Intake Month</option>
                            {filterOptions("intakeMonth").map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <select
                            name="period"
                            className="border p-1 w-full mb-2"
                            value={assignCourseData.period}
                            onChange={handleAssignCourseDataChange}
                        >
                            <option value="">Period</option>
                            {filterOptions("period").map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        {/* Trimester and Block selections */}
                        <select
                            name="trimester"
                            className="border p-1 w-full mb-2"
                            value={assignCourseData.trimester}
                            onChange={handleAssignCourseDataChange}
                        >
                            <option value="">Trimester</option>
                            <option value="Trimester 1">Trimester 1 (Sep-Jan)</option>
                            <option value="Trimester 2">Trimester 2 (Feb-May)</option>
                            <option value="Trimester 3">Trimester 3 (Jun-Aug)</option>
                        </select>
                        <select
                            name="block"
                            className="border p-1 w-full mb-2"
                            value={assignCourseData.block}
                            onChange={handleAssignCourseDataChange}
                        >
                            <option value="">Block</option>
                            <option value="Block 1">Block 1</option>
                            <option value="Block 2">Block 2</option>
                            <option value="Block 3">Block 3</option>
                        </select>
                        {/* Multi-select: List of available modules (from coursesList) filtered by selected faculty and field */}
                        <label className="block mb-1">Select Course Module(s):</label>
                        <select
                            multiple
                            className="border p-1 w-full mb-2"
                            value={assignCourseData.modules}
                            onChange={handleAssignModulesChange}
                        >
                            {assignCourseData.faculty &&
                                assignCourseData.field &&
                                availableModules.map((course) => (
                                    <option key={course.id} value={course.name}>
                                        {course.name}
                                    </option>
                                ))}
                        </select>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setShowAssignCourseDialog(false)}
                                className="mr-2 px-3 py-1 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignCourseModule}
                                className="bg-sky-700 text-white px-3 py-1 rounded hover:bg-sky-600"
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;
