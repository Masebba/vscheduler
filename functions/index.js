// Firebase function to send email notifications to lecturers and students when a class is scheduled
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Email credentials (USING ENV VARIABLES IN REAL DEPLOYMENTS)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "syndicatearchives@gmail.com",
    pass: "Syndicate@374", // Gmail App Password
  },
});

// Cloud Function to send emails when a new timetable entry is created
exports.sendClassNotification = functions.firestore
  .document("timetables/{eventId}")
  .onCreate(async (snap, context) => {
    const event = snap.data();
    const { module, cohort, start, end, lecturer } = event;

    if (!cohort || !module || !lecturer) return;

    const timeString = new Date(start).toLocaleString();
    const endTime = end ? new Date(end).toLocaleTimeString() : null;

    try {
      // Sending to lecturer
      const lecturerSnapshot = await db
        .collection("lecturers")
        .where("lecturerName", "==", lecturer)
        .limit(1)
        .get();

      if (!lecturerSnapshot.empty) {
        const lecturerData = lecturerSnapshot.docs[0].data();
        if (lecturerData.email) {
          await transporter.sendMail({
            from: "YOUR_EMAIL@gmail.com",
            to: lecturerData.email,
            subject: `New Class Scheduled: ${module}`,
            text: `Hello ${lecturer},\n\nA new class has been scheduled.\n\nModule: ${module}\nCohort: ${cohort}\nDate/Time: ${timeString}${endTime ? ` - ${endTime}` : ""}\n\nBest regards,\nAdmin`,
          });
        }
      }

      // Sending to students
      const [intakeYear, intakeMonth, period] = cohort.split(" ");
      const studentSnapshot = await db
        .collection("students")
        .where("intakeYear", "==", intakeYear)
        .where("intakeMonth", "==", intakeMonth)
        .where("period", "==", period)
        .get();

      for (const doc of studentSnapshot.docs) {
        const student = doc.data();
        if (student.email && student.fullName) {
          await transporter.sendMail({
            from: "syndicatearchives@gmail.com",
            to: student.email,
            subject: `New Class Scheduled: ${module}`,
            text: `Hello ${student.fullName},\n\nYou have a new class scheduled.\n\nModule: ${module}\nCohort: ${cohort}\nDate/Time: ${timeString}${endTime ? ` - ${endTime}` : ""}\nLecturer: ${lecturer}\n\nBest regards,\nAdmin`,
          });
        }
      }

      console.log("✅ Emails sent to lecturer and students");
    } catch (err) {
      console.error("❌ Email sending failed:", err);
    }
  });
