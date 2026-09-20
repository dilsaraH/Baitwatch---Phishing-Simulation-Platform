# BaitWatch 🎣

**BaitWatch** is a comprehensive, multi-tenant phishing simulation and security awareness platform. It enables security teams to deploy safe, simulated phishing campaigns to evaluate organizational risk, track employee engagement (opens/clicks), and provide point-of-failure educational debriefs.

## 🚀 Features

### Platform Admin Capabilities
* **Multi-Tenant Management:** Create and manage distinct client organizations (Tenants) and generate secure portal access for their administrators.
* **Campaign Engine:** Design, launch, and monitor simulated phishing attacks.
* **Template & Landing Page Builder:** Craft deceptive email lures and point-of-failure educational HTML landing pages.
* **Target Management:** Bulk import and manage employee target lists per tenant.
* **Advanced Tracking:** Custom tracking engine utilizing 1x1 transparent GIFs for open tracking and server-side redirects for click tracking (built to bypass standard email security proxies).

### Tenant Portal (Client-Facing)
* **Isolated Environment:** Role-based access control (`TENANT_USER`) ensures clients only see their specific organization's data.
* **Live Dashboards:** Real-time metrics on campaign targets, open rates, and compromise rates.
* **Reporting:** One-click CSV export for offline auditing and compliance reporting.

## 🛠 Tech Stack

**Frontend:**
* React.js (Vite)
* React Router v6
* Tailwind CSS
* Lucide React (Icons)

**Backend:**
* Node.js & Express.js
* Prisma ORM
* PostgreSQL / SQLite
* Mailgun API (Email Delivery)
* Bcrypt (Password Hashing)
* JSON Web Tokens (JWT) for Authentication

## ⚙️ Local Development Setup

### 1. Prerequisites
* Node.js (v18+)
* A [Mailgun](https://www.mailgun.com/) account for sending emails.
* An [Ngrok](https://ngrok.com/) account for tunneling local traffic to the public internet (required for email tracking pixels to work locally).

### 2. Environment Variables
Create a `.env` file in the **server** directory:
