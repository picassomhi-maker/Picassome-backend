import express from "express";
import path from "path";
import fs from "fs";

const app = express();

// Health check
app.get("/", (req, res) => {
  res.status(200).send("PicassoMe backend is running ✅");
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

// Cloud Run provides PORT. Default 8080.
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
