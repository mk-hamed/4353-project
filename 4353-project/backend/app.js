const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

// Member 1: mount verified-token middleware before this router to set req.user.
// GET is public; POST/PUT enforce admin access inside the services router.
app.use("/api/services", require("./routes/services"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/history", require("./routes/history"));

// team members add routes above this line

app.use(notFound);
app.use(errorHandler);

module.exports = app;
