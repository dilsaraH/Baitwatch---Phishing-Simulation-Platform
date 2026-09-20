const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Protect these routes - Tenant Users only
router.use(authenticateToken);
router.use(requireRole('TENANT_USER'));

// GET /api/tenant-portal/campaigns
router.get('/campaigns', async (req, res) => {
  try {
    // req.user is populated by your authenticateToken middleware
    const { tenantId } = req.user;

    if (!tenantId) {
      return res.status(403).json({ error: "No tenant associated with this user." });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { tenantId },
      include: {
        template: true,
        emailsSent: {
          include: {
            employee: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(campaigns);
  } catch (err) {
    console.error("Tenant Portal Error:", err);
    res.status(500).json({ error: 'Failed to fetch organization campaigns' });
  }
});

module.exports = router;