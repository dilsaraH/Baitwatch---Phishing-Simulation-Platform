const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);
router.use(requireRole('PLATFORM_ADMIN'));

// GET /api/templates
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Translate database 'htmlBody' to frontend 'htmlContent'
    const formattedTemplates = templates.map(t => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      htmlContent: t.htmlBody 
    }));
    
    res.json(formattedTemplates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/templates
router.post('/', async (req, res) => {
  const { name, subject, htmlContent } = req.body;
  
  if (!name || !subject || !htmlContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newTemplate = await prisma.emailTemplate.create({
      data: { 
        name, 
        subject, 
        htmlBody: htmlContent // Map frontend htmlContent to database htmlBody
      }
    });
    res.status(201).json(newTemplate);
  } catch (err) {
    console.error("Prisma Error saving template:", err);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.emailTemplate.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;