const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Email transporter setup (Replace with your Gmail credentials)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your-email@gmail.com",  // Replace with your email
        pass: "your-password"          // Replace with your email password
    }
});

// Cloud Function: Send Email on New Timetable Entry
exports.sendEmailNotification = functions.firestore
    .document("timetables/{timetableId}") // Watches for new timetable entries
    .onCreate(async (snap, context) => {
        const data = snap.data(); // Get timetable data

        const mailOptions = {
            from: "your-email@gmail.com",
            to: "user-email@gmail.com", // Replace with recipient email
            subject: "New Class Scheduled",
            text: `A new class (${data.title}) has been scheduled on ${data.day} at ${data.timeSlot}.`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully!");
        } catch (error) {
            console.error("Error sending email:", error);
        }
    });
