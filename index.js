import express from "express";
import path from "path";
import fs from "fs";
import Stripe from "stripe";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("PicassoMe backend is running ✅");
});
// Verify Stripe Checkout payment
// Usage: GET /verify-payment?session_id=cs_test_...
app.get("/verify-payment", async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.status(400).json({ error: "session_id query parameter is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    return res.json({
      paid,
      session_id: sessionId,
      payment_status: session.payment_status,
      status: session.status,
    });
  } catch (err) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
});

// File download endpoint
// Usage: GET /download?filePath=/path/to/file.txt
app.get("/download", (req, res) => {
  try {
    const filePath = req.query.filePath;

    // Validate that filePath is provided
    if (!filePath) {
      return res.status(400).json({ error: "filePath query parameter is required" });
    }

    // Resolve the file path and ensure it's within a safe directory
    // Adjust the base directory as needed (e.g., './uploads', './files')
    const baseDir = path.resolve("./files"); // Safe base directory
    const resolvedPath = path.resolve(baseDir, filePath);

    // Security check: ensure the resolved path is within the base directory
    if (!resolvedPath.startsWith(baseDir)) {
      return res.status(403).json({ error: "Access denied: path traversal not allowed" });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if it's actually a file (not a directory)
    if (!fs.statSync(resolvedPath).isFile()) {
      return res.status(400).json({ error: "Path must point to a file, not a directory" });
    }

    // Get file extension for proper mime type
    const fileName = path.basename(resolvedPath);

    // Set response headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Stream the file to the response
    const fileStream = fs.createReadStream(resolvedPath);

    fileStream.on("error", (error) => {
      console.error("File stream error:", error);
      res.status(500).json({ error: "Error reading file" });
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// redeploy trigger

// Cloud Run provides PORT. Default 8080.
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
