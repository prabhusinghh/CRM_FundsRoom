const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', require('./routes/customerRoutes'));

// Phase 3-4: mount as each module is built
// app.use('/api/products', require('./routes/productRoutes'));
// app.use('/api/challans', require('./routes/challanRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
