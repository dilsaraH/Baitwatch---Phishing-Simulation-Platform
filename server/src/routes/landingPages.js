const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(requireRole('PLATFORM_ADMIN'));

// GET /api/landing-pages
router.get('/', async (req, res) => {
  try {
    const pages = await prisma.landingPage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Translate database 'title' to frontend 'name'
    const formattedPages = pages.map(p => ({
      id: p.id,
      name: p.title, 
      htmlContent: p.htmlContent // No translation needed here!
    }));
    
    res.json(formattedPages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch landing pages' });
  }
});

// POST /api/landing-pages
router.post('/', async (req, res) => {
  const { name, htmlContent } = req.body;
  
  if (!name || !htmlContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newPage = await prisma.landingPage.create({
      data: { 
        title: name, // Map frontend name to database title
        htmlContent  // No translation needed here!
      }
    });
    res.status(201).json(newPage);
  } catch (err) {
    console.error("Prisma Error saving landing page:", err);
    res.status(500).json({ error: 'Failed to save landing page' });
  }
});

// DELETE /api/landing-pages/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.landingPage.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;