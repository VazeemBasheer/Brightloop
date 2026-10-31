// src/db.js - In-Memory Database for Brightloop Subscription Management System

const db = {
  products: [
    {
      id: "prod-brightcrm",
      name: "Brightloop CRM Core",
      type: "software",
      category: "CRM & Sales",
      basePrice: 49.00,
      costPrice: 15.00,
      description: "Core subscription management and CRM software.",
      variants: [
        { name: "Standard Edition", priceAdjustment: 0 },
        { name: "Odoo Brand Edition", priceAdjustment: 560.00 } // PDF: "choosing the Odoo brand adds 560 to the price"
      ]
    },
    {
      id: "prod-slack",
      name: "Slack Enterprise",
      type: "software",
      category: "Team Chat & Collaboration",
      basePrice: 15.00,
      costPrice: 8.00,
      description: "Real-time communication and channel collaboration.",
      variants: [{ name: "Standard", priceAdjustment: 0 }]
    },
    {
      id: "prod-teams",
      name: "Microsoft Teams Business",
      type: "software",
      category: "Team Chat & Collaboration", // Duplicate overlap with Slack for Dev 3 AI analysis!
      basePrice: 12.00,
      costPrice: 6.00,
      description: "Chat, video meetings, and workspace channels.",
      variants: [{ name: "Standard", priceAdjustment: 0 }]
    },
    {
      id: "prod-asana",
      name: "Asana Business",
      type: "software",
      category: "Project Management",
      basePrice: 24.00,
      costPrice: 12.00,
      description: "Work and task management platform.",
      variants: [{ name: "Standard", priceAdjustment: 0 }]
    },
    {
      id: "prod-jira",
      name: "Jira Cloud Premium",
      type: "software",
      category: "Project Management", // Duplicate overlap with Asana for Dev 3 AI analysis!
      basePrice: 15.00,
      costPrice: 7.50,
      description: "Agile issue tracking and sprint management.",
      variants: [{ name: "Standard", priceAdjustment: 0 }]
    },
    {
      id: "prod-gsuite",
      name: "Google Workspace Enterprise",
      type: "software",
      category: "Productivity & Cloud",
      basePrice: 18.00,
      costPrice: 9.00,
      description: "Gmail, Google Drive, Docs, and cloud suite.",
      variants: [{ name: "Standard", priceAdjustment: 0 }]
    },
    {
      id: "prod-m365",
      name: "Microsoft 365 Business",
      type: "software",
      category: "Productivity & Cloud", // Duplicate overlap with Google Workspace!
      basePrice: 22.00,
      costPrice: 11.00,
      description: "Office 365 apps, Outlook, and OneDrive cloud.",
      variants: [{ name: "Standard", priceAdjustment: 0 }]
    },
    {
      id: "prod-zoom",
      name: "Zoom Video Pro",
      type: "software",
      category: "Video Conferencing",
      basePrice: 15.00,
      costPrice: 5.00,
      description: "HD video meetings and cloud recording.",
      variants: [{ name: "Standard", priceAdjustment: 0 }]
    },
    {
      id: "prod-aws-addon",
      name: "Dedicated Cloud Server Addon",
      type: "addon",
      category: "Infrastructure",
      basePrice: 250.00,
      costPrice: 120.00,
      description: "High-performance dedicated cloud instance.",
      variants: [{ name: "Standard", priceAdjustment: 0 }]
    }
  ],

  plans: [
    {
      id: "plan-monthly",
      name: "Monthly Billing",
      frequency: "monthly",
      intervalMonths: 1,
      minQuantity: 1,
      autoCloseAtEnd: false
    },
    {
      id: "plan-quarterly",
      name: "Quarterly Billing",
      frequency: "quarterly",
      intervalMonths: 3,
      minQuantity: 1,
      autoCloseAtEnd: false
    },
    {
      id: "plan-yearly",
      name: "Annual Contract",
      frequency: "yearly",
      intervalMonths: 12,
      minQuantity: 1,
      autoCloseAtEnd: false
    }
  ],

  customers: [
    {
      id: "cust-101",
      name: "Acme Technologies Ltd",
      email: "finance@acmetech.io",
      role: "customer",
      company: "Acme Tech",
      address: "100 Silicon Way, Tech Park"
    },
    {
      id: "cust-102",
      name: "Vertex Logistics",
      email: "billing@vertexlogistics.com",
      role: "customer",
      company: "Vertex Logistics",
      address: "42 Harbor Freight Blvd"
    },
    {
      id: "cust-103",
      name: "CloudScale Systems",
      email: "ops@cloudscale.net",
      role: "customer",
      company: "CloudScale Systems",
      address: "742 Evergreen Terr"
    },
    {
      id: "cust-104",
      name: "NexGen Design Studio",
      email: "hello@nexgendesign.com",
      role: "customer",
      company: "NexGen Design",
      address: "12 Creative Row"
    },
    {
      id: "cust-105",
      name: "Bright Retail Mart",
      email: "admin@brightretail.store",
      role: "customer",
      company: "Bright Retail",
      address: "500 Market Plaza"
    }
  ],

  taxes: [
    {
      id: "tax-std-10",
      name: "Standard Sales Tax (10%)",
      rate: 0.10,
      isDefault: true
    },
    {
      id: "tax-zero",
      name: "Tax Exempt (0%)",
      rate: 0.00,
      isDefault: false
    }
  ],

  discounts: [
    {
      id: "disc-volume-10",
      code: "VOLUME10",
      description: "10% off for teams with 10+ seats",
      type: "percentage",
      value: 0.10,
      minQuantity: 10,
      appliesTo: "whole_subscription"
    },
    {
      id: "disc-fixed-50",
      code: "WELCOME50",
      description: "$50 off total invoice",
      type: "fixed",
      value: 50.00,
      minQuantity: 1,
      appliesTo: "whole_subscription"
    }
  ],

  // 15 realistic subscriptions across diverse customers and lifecycle statuses
  subscriptions: [
    {
      id: "SUB-1001",
      customerId: "cust-101",
      customerName: "Acme Technologies Ltd",
      planId: "plan-monthly",
      status: "Active",
      startDate: "2026-01-01",
      expiryDate: "2027-01-01",
      nextBillingDate: "2026-10-31", // Due today! Ready for /api/run-billing
      lastBilledDate: "2026-09-30",
      paymentTerms: "Net 15",
      discountId: "disc-volume-10",
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-slack",
          productName: "Slack Enterprise",
          variant: "Standard",
          quantity: 50, // 50 seats purchased
          activeUsers30Days: 25, // Only 25 active users -> 25 wasted seats for Dev 3 AI!
          unitPrice: 15.00
        },
        {
          productId: "prod-teams", // Duplicate tool! Paying for both Slack & Teams!
          productName: "Microsoft Teams Business",
          variant: "Standard",
          quantity: 45,
          activeUsers30Days: 10, // 35 wasted seats!
          unitPrice: 12.00
        }
      ]
    },
    {
      id: "SUB-1002",
      customerId: "cust-101",
      customerName: "Acme Technologies Ltd",
      planId: "plan-monthly",
      status: "Active",
      startDate: "2026-03-01",
      expiryDate: "2027-03-01",
      nextBillingDate: "2026-10-31", // Due today! Ready for /api/run-billing
      lastBilledDate: "2026-09-30",
      paymentTerms: "Net 30",
      discountId: null,
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-asana",
          productName: "Asana Business",
          variant: "Standard",
          quantity: 30,
          activeUsers30Days: 28,
          unitPrice: 24.00
        },
        {
          productId: "prod-jira", // Duplicate tool with Asana!
          productName: "Jira Cloud Premium",
          variant: "Standard",
          quantity: 30,
          activeUsers30Days: 8, // 22 wasted seats!
          unitPrice: 15.00
        }
      ]
    },
    {
      id: "SUB-1003",
      customerId: "cust-102",
      customerName: "Vertex Logistics",
      planId: "plan-monthly",
      status: "Active",
      startDate: "2026-02-15",
      expiryDate: "2027-02-15",
      nextBillingDate: "2026-10-31", // Due today!
      lastBilledDate: "2026-09-30",
      paymentTerms: "Immediate",
      discountId: null,
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-brightcrm",
          productName: "Brightloop CRM Core (Odoo Brand Edition)",
          variant: "Odoo Brand Edition", // PDF variant +560
          quantity: 1,
          activeUsers30Days: 1,
          unitPrice: 609.00 // 49 base + 560 variant
        },
        {
          productId: "prod-aws-addon",
          productName: "Dedicated Cloud Server Addon",
          variant: "Standard",
          quantity: 2,
          activeUsers30Days: 2,
          unitPrice: 250.00
        }
      ]
    },
    {
      id: "SUB-1004",
      customerId: "cust-102",
      customerName: "Vertex Logistics",
      planId: "plan-monthly",
      status: "Active",
      startDate: "2026-05-01",
      expiryDate: "2027-05-01",
      nextBillingDate: "2026-10-31", // Due today!
      lastBilledDate: "2026-09-30",
      paymentTerms: "Net 15",
      discountId: "disc-volume-10",
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-gsuite",
          productName: "Google Workspace Enterprise",
          variant: "Standard",
          quantity: 40,
          activeUsers30Days: 38,
          unitPrice: 18.00
        },
        {
          productId: "prod-m365", // Redundant overlap with Google Workspace!
          productName: "Microsoft 365 Business",
          variant: "Standard",
          quantity: 35,
          activeUsers30Days: 5, // 30 unused licenses!
          unitPrice: 22.00
        }
      ]
    },
    {
      id: "SUB-1005",
      customerId: "cust-103",
      customerName: "CloudScale Systems",
      planId: "plan-yearly",
      status: "Active",
      startDate: "2026-01-01",
      expiryDate: "2027-01-01",
      nextBillingDate: "2026-10-31", // Due today!
      lastBilledDate: "2025-12-31",
      paymentTerms: "Net 30",
      discountId: "disc-volume-10",
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-brightcrm",
          productName: "Brightloop CRM Core",
          variant: "Standard Edition",
          quantity: 20,
          activeUsers30Days: 19,
          unitPrice: 49.00
        },
        {
          productId: "prod-zoom",
          productName: "Zoom Video Pro",
          variant: "Standard",
          quantity: 15,
          activeUsers30Days: 4, // 11 wasted seats!
          unitPrice: 15.00
        }
      ]
    },
    {
      id: "SUB-1006",
      customerId: "cust-103",
      customerName: "CloudScale Systems",
      planId: "plan-monthly",
      status: "Active",
      startDate: "2026-08-01",
      expiryDate: "2027-08-01",
      nextBillingDate: "2026-11-30", // Already billed for October! Tests double-billing protection
      lastBilledDate: "2026-10-31",
      paymentTerms: "Net 15",
      discountId: null,
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-aws-addon",
          productName: "Dedicated Cloud Server Addon",
          variant: "Standard",
          quantity: 1,
          activeUsers30Days: 1,
          unitPrice: 250.00
        }
      ]
    },
    {
      id: "SUB-1007",
      customerId: "cust-104",
      customerName: "NexGen Design Studio",
      planId: "plan-monthly",
      status: "Active",
      startDate: "2026-04-10",
      expiryDate: "2027-04-10",
      nextBillingDate: "2026-10-31", // Due today!
      lastBilledDate: "2026-09-30",
      paymentTerms: "Net 15",
      discountId: "disc-fixed-50",
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-slack",
          productName: "Slack Enterprise",
          variant: "Standard",
          quantity: 12,
          activeUsers30Days: 11,
          unitPrice: 15.00
        },
        {
          productId: "prod-asana",
          productName: "Asana Business",
          variant: "Standard",
          quantity: 10,
          activeUsers30Days: 9,
          unitPrice: 24.00
        }
      ]
    },
    {
      id: "SUB-1008",
      customerId: "cust-105",
      customerName: "Bright Retail Mart",
      planId: "plan-monthly",
      status: "Active",
      startDate: "2026-07-01",
      expiryDate: "2027-07-01",
      nextBillingDate: "2026-10-31", // Due today!
      lastBilledDate: "2026-09-30",
      paymentTerms: "Immediate",
      discountId: null,
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-brightcrm",
          productName: "Brightloop CRM Core",
          variant: "Standard Edition",
          quantity: 5,
          activeUsers30Days: 5,
          unitPrice: 49.00
        }
      ]
    },
    {
      id: "SUB-1009",
      customerId: "cust-105",
      customerName: "Bright Retail Mart",
      planId: "plan-monthly",
      status: "Quotation", // PDF: Draft -> Quotation -> Confirmed -> Active -> Closed
      startDate: "2026-11-01",
      expiryDate: "2027-11-01",
      nextBillingDate: "2026-11-01",
      lastBilledDate: null,
      paymentTerms: "Net 15",
      discountId: null,
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-zoom",
          productName: "Zoom Video Pro",
          variant: "Standard",
          quantity: 8,
          activeUsers30Days: 0,
          unitPrice: 15.00
        }
      ]
    },
    {
      id: "SUB-1010",
      customerId: "cust-104",
      customerName: "NexGen Design Studio",
      planId: "plan-monthly",
      status: "Draft", // PDF: Draft stage
      startDate: "2026-11-15",
      expiryDate: "2027-11-15",
      nextBillingDate: "2026-11-15",
      lastBilledDate: null,
      paymentTerms: "Immediate",
      discountId: null,
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-aws-addon",
          productName: "Dedicated Cloud Server Addon",
          variant: "Standard",
          quantity: 1,
          activeUsers30Days: 0,
          unitPrice: 250.00
        }
      ]
    },
    {
      id: "SUB-1011",
      customerId: "cust-103",
      customerName: "CloudScale Systems",
      planId: "plan-monthly",
      status: "Closed", // PDF: Closed stage
      startDate: "2025-06-01",
      expiryDate: "2026-06-01",
      nextBillingDate: "2026-06-01",
      lastBilledDate: "2026-05-01",
      paymentTerms: "Net 30",
      discountId: null,
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-jira",
          productName: "Jira Cloud Premium",
          variant: "Standard",
          quantity: 10,
          activeUsers30Days: 0,
          unitPrice: 15.00
        }
      ]
    },
    {
      id: "SUB-1012",
      customerId: "cust-101",
      customerName: "Acme Technologies Ltd",
      planId: "plan-quarterly",
      status: "Confirmed", // PDF: Confirmed stage, awaiting activation
      startDate: "2026-11-01",
      expiryDate: "2027-11-01",
      nextBillingDate: "2026-11-01",
      lastBilledDate: null,
      paymentTerms: "Net 30",
      discountId: "disc-volume-10",
      taxId: "tax-std-10",
      lines: [
        {
          productId: "prod-brightcrm",
          productName: "Brightloop CRM Core",
          variant: "Standard Edition",
          quantity: 15,
          activeUsers30Days: 15,
          unitPrice: 49.00
        }
      ]
    }
  ],

  // Initial Seed Invoices (Provides realistic starting stats: paid, pending, and overdue)
  invoices: [
    {
      id: "INV-2026-001",
      subscriptionId: "SUB-1006",
      customerId: "cust-103",
      customerName: "CloudScale Systems",
      issueDate: "2026-10-01",
      dueDate: "2026-10-15",
      billingPeriod: { start: "2026-10-01", end: "2026-10-31" },
      status: "Paid",
      subtotal: 250.00,
      discountTotal: 0.00,
      taxTotal: 25.00,
      totalAmount: 275.00,
      amountPaid: 275.00,
      amountDue: 0.00,
      items: [
        {
          productId: "prod-aws-addon",
          description: "Dedicated Cloud Server Addon",
          quantity: 1,
          unitPrice: 250.00,
          total: 250.00
        }
      ]
    },
    {
      id: "INV-2026-002",
      subscriptionId: "SUB-1001",
      customerId: "cust-101",
      customerName: "Acme Technologies Ltd",
      issueDate: "2026-09-01",
      dueDate: "2026-09-15", // In the past -> Overdue!
      billingPeriod: { start: "2026-09-01", end: "2026-09-30" },
      status: "Overdue",
      subtotal: 1290.00,
      discountTotal: 129.00, // 10% volume discount
      taxTotal: 116.10, // 10% tax on 1161
      totalAmount: 1277.10,
      amountPaid: 0.00,
      amountDue: 1277.10,
      items: [
        {
          productId: "prod-slack",
          description: "Slack Enterprise (50 seats)",
          quantity: 50,
          unitPrice: 15.00,
          total: 750.00
        },
        {
          productId: "prod-teams",
          description: "Microsoft Teams Business (45 seats)",
          quantity: 45,
          unitPrice: 12.00,
          total: 540.00
        }
      ]
    },
    {
      id: "INV-2026-003",
      subscriptionId: "SUB-1003",
      customerId: "cust-102",
      customerName: "Vertex Logistics",
      issueDate: "2026-10-15",
      dueDate: "2026-10-30",
      billingPeriod: { start: "2026-10-15", end: "2026-11-14" },
      status: "Confirmed", // Outstanding / Pending payment
      subtotal: 1109.00,
      discountTotal: 0.00,
      taxTotal: 110.90,
      totalAmount: 1219.90,
      amountPaid: 0.00,
      amountDue: 1219.90,
      items: [
        {
          productId: "prod-brightcrm",
          description: "Brightloop CRM Core (Odoo Brand Edition)",
          quantity: 1,
          unitPrice: 609.00,
          total: 609.00
        },
        {
          productId: "prod-aws-addon",
          description: "Dedicated Cloud Server Addon (2 units)",
          quantity: 2,
          unitPrice: 250.00,
          total: 500.00
        }
      ]
    }
  ],

  // Payments received against invoices
  payments: [
    {
      id: "PAY-1001",
      invoiceId: "INV-2026-001",
      amount: 275.00,
      paymentMethod: "bank_transfer",
      paymentDate: "2026-10-05",
      note: "Full payment received via Wire Transfer"
    }
  ],
  notices: []
};

// Deep copy helper to reset database for clean testing/demoing
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const initialSnapshot = JSON.parse(JSON.stringify(db));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveDatabase() {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database.json:', err);
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      db.products = parsed.products || db.products;
      db.plans = parsed.plans || db.plans;
      db.customers = parsed.customers || db.customers;
      db.taxes = parsed.taxes || db.taxes;
      db.discounts = parsed.discounts || db.discounts;
      db.subscriptions = parsed.subscriptions || db.subscriptions;
      db.invoices = parsed.invoices || db.invoices;
      db.payments = parsed.payments || db.payments;
      db.notices = parsed.notices || db.notices;
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.warn('Could not read existing database.json, using seed defaults:', err.message);
    saveDatabase();
  }
}

function resetDatabase() {
  db.products = JSON.parse(JSON.stringify(initialSnapshot.products));
  db.plans = JSON.parse(JSON.stringify(initialSnapshot.plans));
  db.customers = JSON.parse(JSON.stringify(initialSnapshot.customers));
  db.taxes = JSON.parse(JSON.stringify(initialSnapshot.taxes));
  db.discounts = JSON.parse(JSON.stringify(initialSnapshot.discounts));
  db.subscriptions = JSON.parse(JSON.stringify(initialSnapshot.subscriptions));
  db.invoices = JSON.parse(JSON.stringify(initialSnapshot.invoices));
  db.payments = JSON.parse(JSON.stringify(initialSnapshot.payments));
  db.notices = JSON.parse(JSON.stringify(initialSnapshot.notices));
  saveDatabase();
}

// Initialize on startup
loadDatabase();

module.exports = {
  db,
  resetDatabase,
  saveDatabase
};
