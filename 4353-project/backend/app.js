const express = require('express');
const cors = require('cors');
const { services } = require('./mock/data');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/services', (req, res) => {
  res.json(services);
});

module.exports = app;