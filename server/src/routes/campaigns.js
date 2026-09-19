const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendPhishingEmail } = require('../utils/mailgun');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/campaigns - List all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: { template: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// POST /api/campaigns - CREATE THE CAMPAIGN DRAFT
router.post('/', async (req, res) => {
  const { name, tenantId, templateId, landingPageId, senderName, senderEmail, employeeIds, status } = req.body;

  try {
    const campaign = await prisma.campaign.create({
      data: {
        name, 
        senderName, 
        senderEmail, 
        status: status || 'DRAFT',
        // Use strict "connect" syntax for all relationships
        tenant: { connect: { id: tenantId } },
        template: { connect: { id: templateId } },
        landingPage: { connect: { id: landingPageId } },
        emailsSent: {
          create: employeeIds.map(empId => ({
            employee: { connect: { id: empId } } // Explicitly connect the employees
          }))
        }
      }
    });
    res.status(201).json(campaign);
  } catch (err) {
    // This will print the exact reason to your terminal if it ever fails again
    console.error("Prisma Error saving campaign:", err); 
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET a single campaign and its tracking results
router.get('/:id', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        template: true,
        emailsSent: {
          include: {
            employee: true,
            trackingLogs: { orderBy: { timestamp: 'desc' } }
          }
        }
      }
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.status(200).json(campaign);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaign data" });
  }
});

// POST /api/campaigns/:id/launch - Launch the draft
router.post('/:id/launch', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        template: true,
        emailsSent: { include: { employee: true } } // ONLY the selected targets
      }
    });

    if (!campaign || campaign.status !== 'DRAFT') {
      return res.status(400).json({ error: "Campaign not found or already launched" });
    }

    // Loop through the specifically targeted employees
    for (const ce of campaign.emailsSent) {
      const employee = ce.employee;
      const trackingId = ce.trackingId;

      // 1. Mark as sent
      await prisma.campaignEmail.update({
        where: { id: ce.id },
        data: { sentAt: new Date() }
      });

      // 2. Generate Tracking Links
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
      const trackingLink = `${baseUrl}/api/track/click/${trackingId}`;
      const trackingPixel = `<img src="${process.env.APP_BASE_URL}/api/track/open/${trackingId}.gif" width="1" height="1" alt="" style="display:none;" />`;
      // 3. Substitute placeholders
      let personalizedHtml = campaign.template.htmlBody
        .replace(/{{FIRST_NAME}}/g, employee.firstName)
        .replace(/{{LAST_NAME}}/g, employee.lastName)
        .replace(/{{USER_EMAIL}}/g, employee.email)
        .replace(/{{LANDING_URL}}/g, trackingLink);

      // SAFE PIXEL INJECTION:
      if (personalizedHtml.includes('</body>')) {
        personalizedHtml = personalizedHtml.replace('</body>', `${trackingPixel}</body>`);
      } else {
        personalizedHtml += trackingPixel; // Append to the very end if no body tag exists
      }

      // 4. Send via Mailgun
      await sendPhishingEmail(
        employee.email, 
        campaign.senderName, 
        campaign.senderEmail, 
        campaign.template.subject, 
        personalizedHtml
      );
    }

    // Lock the campaign
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'LAUNCHED', launchedAt: new Date() }
    });

    res.status(200).json({ message: "Campaign launched successfully" });
  } catch (error) {
    console.error("Launch error:", error);
    res.status(500).json({ error: "Failed to launch campaign" });
  }
});

module.exports = router;