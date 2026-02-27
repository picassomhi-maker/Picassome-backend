import express from "express";

const app = express();

// Health check
app.get("/", (req, res) => {
  res.status(200).send("PicassoMe backend is running ✅");
});

// Cloud Run provides PORT. Default 8080.
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
