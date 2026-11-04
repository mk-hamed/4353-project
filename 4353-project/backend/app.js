const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

// Service listing is public; writes verify JWT identity and admin role in the router.
app.use("/api/services", require("./routes/services"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/history", require("./routes/history"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/queues", require("./routes/queues"));
// team members add routes above this line

app.use(notFound);
app.use(errorHandler);

module.exports = app;
