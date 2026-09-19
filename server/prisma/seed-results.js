const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Create a dummy tenant and employees
  const tenant = await prisma.tenant.create({
    data: { name: 'CyberTest Corp', domain: 'cybertest.local' }
  });

  const employee1 = await prisma.employee.create({
    data: { firstName: 'Alice', lastName: 'Smith', email: 'alice@cybertest.local', tenantId: tenant.id }
  });
  
  const employee2 = await prisma.employee.create({
    data: { firstName: 'Bob', lastName: 'Jones', email: 'bob@cybertest.local', tenantId: tenant.id }
  });

  // 2. Create required template and landing page
  const template = await prisma.emailTemplate.create({
    data: { name: 'Urgent IT Notice', subject: 'Password Expiry', htmlBody: '<p>Test</p>' }
  });
  
  const landingPage = await prisma.landingPage.create({
    data: { title: 'Failed Phishing Test', htmlContent: '<p>Debrief</p>' }
  });

  // 3. Create a campaign that is already marked as 'LAUNCHED'
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Dashboard UI Test Campaign',
      status: 'LAUNCHED',
      tenantId: tenant.id,
      templateId: template.id,
      landingPageId: landingPage.id,
      senderName: 'IT Support',
      senderEmail: 'it@cybertest.local',
      launchedAt: new Date(),
    }
  });

  // 4. Inject fake tracking data (Alice clicked, Bob only opened)
  await prisma.campaignEmail.create({
    data: {
      campaignId: campaign.id,
      employeeId: employee1.id,
      sentAt: new Date(Date.now() - 3600000),     // 1 hour ago
      openedAt: new Date(Date.now() - 3000000),   // 50 mins ago
      clickedAt: new Date(Date.now() - 2900000),  // 48 mins ago
    }
  });

  await prisma.campaignEmail.create({
    data: {
      campaignId: campaign.id,
      employeeId: employee2.id,
      sentAt: new Date(Date.now() - 3600000),     // 1 hour ago
      openedAt: new Date(Date.now() - 2000000),   // 33 mins ago
    }
  });

  console.log(`\n--- Synthetic Data Inserted Successfully ---`);
  console.log(`View your dashboard at:`);
  console.log(`http://localhost:3000/admin/campaigns/${campaign.id}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());