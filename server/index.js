const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'BaitWatch API is operational' });
});

// Member 1: Campaign & Tracking Routes
const trackingRoutes = require('./src/routes/tracking');
const campaignRoutes = require('./src/routes/campaigns');
const templateRoutes = require('./src/routes/templates');

//Member 2: Authentication Routes
const authRoutes = require('./src/routes/auth');
const tenantRoutes = require('./src/routes/tenants');

//Member3: Landing page Routes
const landingPageRoutes = require('./src/routes/landingPages');

app.use('/api/auth', authRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/landing-pages', landingPageRoutes);
app.use('/api/tenants', tenantRoutes);

// Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});