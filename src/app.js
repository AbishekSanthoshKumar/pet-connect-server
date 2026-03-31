const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('API Running...');
});

module.exports = app;

const PORT = process.env.PORT || 5000;

app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/user.routes'));
app.use('/providers', require('./routes/provider.routes'));
app.use('/vet', require('./routes/provider.routes'));
app.use('/bookings', require('./routes/booking.routes'));
app.use('/pets', require('./routes/pet.routes'));
app.use('/visits', require('./routes/visit.routes'));
app.use('/assignments', require('./routes/assignment.routes.js'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});