const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

// Replace these with your actual Mailgun sandbox or live domain credentials
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '9374723f95e7dadd62c0d45769f5c7db-55613b82-4478b618'
});
const DOMAIN = process.env.MAILGUN_DOMAIN || 'sandbox5afe9c97658f42a495358338e364ee2e.mailgun.org';

/**
 * Sends a simulated phishing email with unique tracking links
 */
async function sendPhishingEmail({ to, firstName, lastName, senderName, senderEmail, subject, htmlBody, trackingId }) {
  // 1. Generate the unique tracking URL and Landing Page URL
  const trackingUrl = `http://localhost:5000/api/track/open/${trackingId}`;
  const landingUrl = `http://localhost:5000/api/track/click/${trackingId}`;

  // 2. Personalize the template by replacing the placeholders
  let personalizedHtml = htmlBody
    .replace(/{{FIRST_NAME}}/g, firstName)
    .replace(/{{LAST_NAME}}/g, lastName)
    .replace(/{{USER_EMAIL}}/g, to)
    .replace(/{{LANDING_URL}}/g, landingUrl)
    .replace(/{{TRACKING_URL}}/g, trackingUrl);

  // 3. Dispatch via Mailgun
  try {
    const result = await mg.messages.create(DOMAIN, {
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject: subject,
      html: personalizedHtml
    });
    return result;
  } catch (error) {
    console.error("Mailgun Dispatch Error:", error);
    throw error;
  }
}

module.exports = { sendPhishingEmail };