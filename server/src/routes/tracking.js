const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// 1. Open Tracking Pixel
router.get('/open/:trackingId.gif', async (req, res) => {
  const { trackingId } = req.params;
  
  try {
    const campaignEmail = await prisma.campaignEmail.findUnique({ where: { trackingId } });
    if (campaignEmail && !campaignEmail.openedAt) {
      await prisma.campaignEmail.update({
        where: { trackingId },
        data: { openedAt: new Date() }
      });
      
      await prisma.trackingEvent.create({
        data: {
          campaignEmailId: campaignEmail.id,
          eventType: 'OPEN',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    }
  } catch (err) {
    console.error("Tracking open error:", err);
  }

  // Return a 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate' // Prevent caching
  });
  res.end(pixel);
});

// 2. Click Tracking & Landing Page Render
router.get('/click/:trackingId', async (req, res) => {
  const { trackingId } = req.params;

  try {
    const campaignEmail = await prisma.campaignEmail.findUnique({
      where: { trackingId },
      // Include the landing page data!
      include: { campaign: { include: { landingPage: true } } } 
    });

    if (campaignEmail) {
      const now = new Date();

      // FALLBACK: If webmail blocked the open pixel, clicking MUST count as an open
      if (!campaignEmail.openedAt) {
        await prisma.campaignEmail.update({
          where: { trackingId },
          data: { openedAt: now }
        });
        await prisma.trackingEvent.create({
          data: {
            campaignEmailId: campaignEmail.id,
            eventType: 'OPEN',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      }

      // Record the click event
      if (!campaignEmail.clickedAt) {
         await prisma.campaignEmail.update({
           where: { trackingId },
           data: { clickedAt: now }
         });
         
         await prisma.trackingEvent.create({
            data: {
              campaignEmailId: campaignEmail.id,
              eventType: 'CLICK',
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            }
         });
      }

      // FIX: Serve the HTML directly from the backend, bypassing React completely!
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(campaignEmail.campaign.landingPage.htmlContent);
    }
  } catch (err) {
    console.error("Tracking click error:", err);
  }
  res.status(404).send("Link expired or invalid.");
});

module.exports = router;