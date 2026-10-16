// import express and cors
const express = require("express");
const cors = require("cors");

// import mock data
const { services } = require("./mock/data");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/services", (req, res) => {
  res.json(services);
});

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});
