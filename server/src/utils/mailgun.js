const formData = require('form-data');
const Mailgun = require('mailgun.js');

// Instantiate the Mailgun client using your .env variables
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY
});

const sendPhishingEmail = async (to, senderName, senderEmail, subject, htmlBody) => {
  try {
    const messageData = {
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject: subject,
      html: htmlBody
    };

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
    return response;
  } catch (error) {
    console.error('Mailgun Send Error:', error);
    throw error;
  }
};

module.exports = { sendPhishingEmail };