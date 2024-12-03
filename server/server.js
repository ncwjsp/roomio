import express from "express";

const app = express();
const port = 8080;

app.get("/api/home", (req, res) => {
  res.json({ message: "Hello World!" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
