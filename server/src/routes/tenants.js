const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Protect these routes - Platform Admins only
router.use(authenticateToken);
router.use(requireRole('PLATFORM_ADMIN'));

// GET /api/tenants - List all tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { employees: true, campaigns: true } }
      }
    });
    res.json(tenants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// POST /api/tenants - Create a new tenant
router.post('/', async (req, res) => {
  const { name, domain } = req.body;
  if (!name || !domain) return res.status(400).json({ error: 'Name and domain are required' });

  try {
    const tenant = await prisma.tenant.create({
      data: { name, domain }
    });
    res.status(201).json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create tenant (Domain might already exist)' });
  }
});

// GET /api/tenants/:id/employees - List employees for a specific tenant
router.get('/:id/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { tenantId: req.params.id },
      orderBy: { lastName: 'asc' }
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /api/tenants/:id/employees - Add an employee to a tenant
router.post('/:id/employees', async (req, res) => {
  const { firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  try {
    const employee = await prisma.employee.create({
      data: { 
        firstName, 
        lastName, 
        email, 
        tenantId: req.params.id 
      }
    });
    res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add employee (Email might already be in use)' });
  }
});

// POST /api/tenants/:id/employees/bulk - Bulk add employees via JSON array
router.post('/:id/employees/bulk', async (req, res) => {
  const { employees } = req.body;
  
  if (!employees || !Array.isArray(employees)) {
    return res.status(400).json({ error: 'Invalid payload format. Expected an array.' });
  }

  try {
    // Map the tenantId into each employee record
    const dataToInsert = employees.map(emp => ({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      tenantId: req.params.id
    }));

    // Insert them all at once. skipDuplicates prevents the entire batch from crashing if an email already exists.
    const result = await prisma.employee.createMany({
      data: dataToInsert,
      skipDuplicates: true 
    });

    res.status(201).json({ message: `Successfully added ${result.count} employees.` });
  } catch (err) {
    console.error("Bulk insert error:", err);
    res.status(500).json({ error: 'Failed to bulk insert employees' });
  }
});

// DELETE /api/tenants/:tenantId/employees/:empId - Remove an employee
router.delete('/:tenantId/employees/:empId', async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: req.params.empId }
    });
    res.json({ message: 'Employee removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// DELETE /api/tenants/:id - Delete a tenant
router.delete('/:id', async (req, res) => {
  try {
    await prisma.tenant.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Tenant deleted successfully' });
  } catch (err) {
    console.error("Delete Tenant Error:", err);
    res.status(500).json({ 
      error: 'Failed to delete tenant. Please ensure all related employees and campaigns are deleted first.' 
    });
  }
});

module.exports = router;