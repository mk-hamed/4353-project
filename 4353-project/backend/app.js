const express = require("express");
const cors = require("cors");
const { services } = require("./mock/data");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/services", (req, res) => {
  res.json(services);
});

// team members add routes above this line

app.use(notFound);
app.use(errorHandler);

module.exports = app;
