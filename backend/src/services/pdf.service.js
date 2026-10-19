/**
 * OneService – PDF Receipt Generator (PDFKit)
 */
const PDFDocument = require("pdfkit");

exports.generateReceipt = (booking, payment) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const PRIMARY = "#3b82f6";
    const GRAY = "#64748b";

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(28).fillColor(PRIMARY).text("OneService", 50, 50);
    doc.fontSize(10).fillColor(GRAY).text("Your trusted home services platform", 50, 85);

    doc.moveTo(50, 110).lineTo(545, 110).strokeColor("#e2e8f0").lineWidth(1).stroke();

    // ── Title ────────────────────────────────────────────────────────────────
    doc.fontSize(20).fillColor("#1e293b").text("Payment Receipt", 50, 130);
    doc.fontSize(10).fillColor(GRAY).text(`Generated: ${new Date().toLocaleString("en-IN")}`, 50, 158);

    // ── Booking Info ─────────────────────────────────────────────────────────
    doc.roundedRect(50, 185, 495, 160, 8).fillColor("#f8fafc").fill();
    doc.fontSize(12).fillColor("#1e293b");

    const infoY = 200;
    const addRow = (label, value, y) => {
      doc.fillColor(GRAY).text(label, 70, y);
      doc.fillColor("#1e293b").text(value, 250, y);
    };

    addRow("Booking ID:", booking.bookingId, infoY);
    addRow("Service:", booking.service?.title || "—", infoY + 22);
    addRow("Customer:", booking.user?.name || "—", infoY + 44);
    addRow("Vendor:", booking.vendor?.businessName || "—", infoY + 66);
    addRow("Scheduled:", new Date(booking.scheduledAt).toLocaleString("en-IN"), infoY + 88);
    addRow("Status:", booking.status.toUpperCase(), infoY + 110);

    // ── Payment Summary ──────────────────────────────────────────────────────
    doc.fontSize(14).fillColor("#1e293b").text("Payment Summary", 50, 370);
    doc.moveTo(50, 390).lineTo(545, 390).strokeColor("#e2e8f0").lineWidth(1).stroke();

    const payY = 400;
    const baseAmt = booking.amount?.base ?? 0;
    const urgentFee = booking.amount?.urgentFee ?? 0;
    const platformFee = booking.amount?.platformFee ?? 0;
    const totalAmt = booking.amount?.total ?? (baseAmt + urgentFee + platformFee);

    addRow("Base Amount:", `₹${baseAmt}`, payY);
    if (urgentFee > 0) addRow("Urgent Fee:", `₹${urgentFee}`, payY + 22);
    addRow("Platform Fee:", `₹${platformFee}`, payY + 44);

    doc.moveTo(50, payY + 68).lineTo(545, payY + 68).strokeColor("#e2e8f0").stroke();
    doc.fontSize(14).fillColor(PRIMARY).text("Total Paid:", 70, payY + 78);
    doc.fontSize(16).fillColor(PRIMARY).text(`₹${totalAmt}`, 250, payY + 76);

    if (payment) {
      addRow("Payment ID:", payment.stripePaymentIntentId?.slice(-16) || "—", payY + 108);
      addRow("Payment Status:", payment.status.toUpperCase(), payY + 130);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(GRAY)
      .text("Thank you for using OneService. For support: support@oneservice.com", 50, 700, { align: "center" });

    doc.end();
  });
};
