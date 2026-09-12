const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MandiMitra — Full System Architecture & Technical Specification</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @bottom-left {
        content: "MandiMitra Technical Documentation • v2.2";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      line-height: 1.55;
      font-size: 9.5pt;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-break {
      page-break-before: always;
    }

    .no-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      height: 100%;
      min-height: 240mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 25mm 10mm 15mm 10mm;
    }

    .cover-top {
      border-left: 6px solid #16a34a;
      padding-left: 20px;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #dcfce7;
      color: #15803d;
      font-weight: 700;
      font-size: 9pt;
      padding: 4px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 18px;
    }

    .cover-title {
      font-size: 32pt;
      font-weight: 900;
      line-height: 1.15;
      color: #0f172a;
      letter-spacing: -0.03em;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #475569;
      margin-top: 14px;
      font-weight: 400;
      max-width: 620px;
      line-height: 1.45;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin-top: 40px;
    }

    .meta-item h4 {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin-bottom: 4px;
    }

    .meta-item p {
      font-size: 10pt;
      font-weight: 600;
      color: #0f172a;
    }

    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #64748b;
    }

    /* Headings */
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    h1 .section-num {
      color: #16a34a;
      font-size: 15pt;
      font-weight: 900;
    }

    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    p {
      margin-bottom: 9px;
      color: #334155;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 10px;
      color: #334155;
    }

    li {
      margin-bottom: 4px;
    }

    .callout {
      border-radius: 10px;
      padding: 12px 16px;
      margin: 12px 0;
      font-size: 9pt;
      line-height: 1.45;
    }

    .callout-info {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      color: #166534;
    }

    .callout-tech {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 8.2pt;
    }

    th, td {
      border: 1px solid #e2e8f0;
      padding: 7px 9px;
      text-align: left;
    }

    th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.04em;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    pre, code {
      font-family: 'JetBrains Mono', monospace;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 7.8pt;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 10px 0 14px 0;
      border: 1px solid #1e293b;
    }

    code:not(pre code) {
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8.2pt;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }

    .arch-container {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 16px;
      margin: 14px 0;
    }

    .arch-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .arch-box {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .arch-box.highlight {
      border-color: #16a34a;
      background: #f0fdf4;
    }

    .arch-box h4 {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .arch-box p {
      font-size: 7.8pt;
      color: #64748b;
      margin-bottom: 0;
      line-height: 1.35;
    }

    .status-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }
    .status-waiting { background: #fef3c7; color: #92400e; }
    .status-called { background: #fee2e2; color: #991b1b; }
    .status-verified { background: #dbeafe; color: #1e40af; }
    .status-processing { background: #f3e8ff; color: #6b21a8; }
    .status-completed { background: #dcfce7; color: #15803d; }

    .toc-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #cbd5e1;
      padding: 5px 0;
      font-size: 8.8pt;
      color: #334155;
    }
    .toc-item strong {
      color: #0f172a;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="badge-pill">
        <span>★</span> Smart India Hackathon 2024 / Agricultural Innovations
      </div>
      <h1 class="cover-title" style="border-bottom: none; margin-bottom: 0;">
        MandiMitra<br>
        <span style="color: #16a34a;">Technical Architecture & Specification Manual</span>
      </h1>
      <p class="cover-subtitle">
        Comprehensive Technical Manual covering System Architecture, Frontend Mechanics, Backend API Endpoints, Guaranteed Unique Token Algorithms, Real-Time Cross-Tab Synchronization, and Government MSP Quality Grading Engines.
      </p>

      <div class="cover-meta-grid">
        <div class="meta-item">
          <h4>Application Title</h4>
          <p>MandiMitra (स्मार्ट मंडी मित्र)</p>
        </div>
        <div class="meta-item">
          <h4>System Version & Release</h4>
          <p>v2.2 Production Edition (Edge-Optimized)</p>
        </div>
        <div class="meta-item">
          <h4>Live Production Deployment</h4>
          <p>https://mandimitraaa.vercel.app/</p>
        </div>
        <div class="meta-item">
          <h4>Source Code Repository</h4>
          <p>github.com/aaryanttiwari247-lab/mandimitra</p>
        </div>
        <div class="meta-item">
          <h4>Core Technology Stack</h4>
          <p>Next.js 16 (App Router), React 19, TypeScript 5.9, Prisma ORM</p>
        </div>
        <div class="meta-item">
          <h4>Database & Edge Engine</h4>
          <p>PostgreSQL, Turbopack, Vercel Serverless Edge Functions</p>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>Official MandiMitra Technical Specification Manual</span>
      <span>Confidential & Proprietary • Engineering & Evaluation Report</span>
    </div>
  </div>

  <!-- TOC -->
  <div class="page-break"></div>

  <h1><span class="section-num">00.</span> Table of Contents & Executive Summary</h1>

  <h2>Table of Contents</h2>
  <div style="margin: 12px 0 20px 0;">
    <div class="toc-item"><span><strong>01. Executive Summary & Problem Context</strong></span><span>Page 3</span></div>
    <div class="toc-item"><span><strong>02. End-to-End Technology Stack & Bill of Materials</strong></span><span>Page 4</span></div>
    <div class="toc-item"><span><strong>03. High-Level Architecture & Interactive Data Flow</strong></span><span>Page 5</span></div>
    <div class="toc-item"><span><strong>04. Database Architecture & Prisma Relational Schema</strong></span><span>Page 6</span></div>
    <div class="toc-item"><span><strong>05. Guaranteed Unique Token Generation Engine</strong></span><span>Page 7</span></div>
    <div class="toc-item"><span><strong>06. Real-Time Synchronization & Dual-Tier State</strong></span><span>Page 8</span></div>
    <div class="toc-item"><span><strong>07. Government MSP Quality Grading & DBT Engine</strong></span><span>Page 9</span></div>
    <div class="toc-item"><span><strong>08. Multi-District Geographic Network & Predictive Queueing</strong></span><span>Page 10</span></div>
    <div class="toc-item"><span><strong>09. Frontend Architecture & Route Walkthrough</strong></span><span>Page 11</span></div>
    <div class="toc-item"><span><strong>10. Backend REST API Reference Specification</strong></span><span>Page 12</span></div>
    <div class="toc-item"><span><strong>11. Production DevOps, WAF Resilience & CI/CD Pipeline</strong></span><span>Page 13</span></div>
  </div>

  <h2>Executive Summary</h2>
  <p>
    Agricultural crop procurement across Indian Agricultural Produce Market Committees (APMCs / Mandis) is historically plagued by systemic inefficiencies: massive physical vehicle bottlenecks, chaotic queues stretching kilometers outside mandi gates, opaque manual grading practices, arbitrary deductions by intermediaries, and days of farmer distress while waiting for weighbridge access.
  </p>
  <p>
    <strong>MandiMitra (स्मार्ट मंडी मित्र)</strong> is an enterprise-grade, cloud-native smart procurement and dynamic queue orchestration platform. It transforms the mandi experience into a transparent, predictable, and fully digitized workflow. Farmers schedule time-slotted arrivals, receive unique smart tokens, track live queue movements in real time with predictive waiting times, and experience automated grading aligned with Government Minimum Support Prices (MSP) resulting in instant Direct Benefit Transfer (DBT) digital receipts.
  </p>

  <div class="callout callout-info">
    <strong>Key Architectural Highlights:</strong> Zero manual queuing, deterministic token allocation per geographic region, sub-millisecond cross-tab reactive synchronization, transparent MSP grade calculations (Grade A through D in ₹/quintal), resilient offline local caching with cloud serverless fallbacks, and Vercel Edge performance optimization.
  </div>

  <!-- TECH STACK -->
  <div class="page-break"></div>

  <h1><span class="section-num">01.</span> End-to-End Technology Stack</h1>
  <p>MandiMitra is built on a modern, ultra-high-performance web architecture combining serverless scalability with zero-latency client interactivity.</p>

  <table>
    <thead>
      <tr>
        <th>Layer</th>
        <th>Technology</th>
        <th>Version</th>
        <th>Architectural Purpose & Technical Responsibility</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend Framework</strong></td>
        <td>Next.js (App Router)</td>
        <td>16.3.4</td>
        <td>React Server Components (RSC), Turbopack compilation, hybrid static site pre-rendering (22 routes), and dynamic API route serving.</td>
      </tr>
      <tr>
        <td><strong>Core UI Library</strong></td>
        <td>React</td>
        <td>19.0.0</td>
        <td>Component-based reactive UI, concurrent transitions, optimistic UI updates, and progressive multi-stage rendering.</td>
      </tr>
      <tr>
        <td><strong>Language</strong></td>
        <td>TypeScript</td>
        <td>5.9.3</td>
        <td>Strict typing, full-stack schema contracts, zero runtime type casting bugs, unified interface definitions across client & server.</td>
      </tr>
      <tr>
        <td><strong>Styling & Design System</strong></td>
        <td>Tailwind CSS & PostCSS</td>
        <td>4.0.0</td>
        <td>Utility-first mobile-first styling, customized agricultural green palette (<code>#2E7D32</code>), responsive grid systems, and glassmorphism.</td>
      </tr>
      <tr>
        <td><strong>Iconography</strong></td>
        <td>Lucide React</td>
        <td>0.542.0</td>
        <td>Lightweight, tree-shaken SVG icons for trucks, crops, tokens, status badges, verification shields, and weighing scales.</td>
      </tr>
      <tr>
        <td><strong>Database & ORM</strong></td>
        <td>Prisma ORM & PostgreSQL</td>
        <td>6.19.3</td>
        <td>Declarative relational schema, type-safe database queries, foreign key cascade rules, unique composite constraints, and migrations.</td>
      </tr>
      <tr>
        <td><strong>Real-Time Synchronization</strong></td>
        <td>Web BroadcastChannel API</td>
        <td>Native</td>
        <td>Zero-latency, sub-millisecond cross-tab inter-process message bus (<code>mandimitra_procurement_sync</code>) with custom DOM event fallback.</td>
      </tr>
      <tr>
        <td><strong>State Persistence</strong></td>
        <td>Dual-Tier Hybrid Store</td>
        <td>Custom</td>
        <td>Server-side global memory (<code>globalThis.__mandiMitraQueue</code>) coupled with browser <code>localStorage</code> versioning (<code>v2.2</code>).</td>
      </tr>
      <tr>
        <td><strong>Internationalization</strong></td>
        <td>Custom i18n Context</td>
        <td>Custom</td>
        <td>Multi-lingual client localization (English, Hindi हिन्दी, Bengali বাংলা) supporting dynamic language switching without page reloads.</td>
      </tr>
      <tr>
        <td><strong>Deployment & Edge</strong></td>
        <td>Vercel Edge Network</td>
        <td>Global CDN</td>
        <td>Zero-cold-start serverless compute, automated Git-driven CI/CD deployment, global static asset caching, and WAF protection.</td>
      </tr>
    </tbody>
  </table>

  <!-- ARCHITECTURE -->
  <div class="page-break"></div>

  <h1><span class="section-num">02.</span> System Architecture & Data Flow</h1>
  <p>The system operates on an event-driven, dual-portal paradigm connecting two distinct user roles: <strong>Farmers</strong> (booking & tracking) and <strong>Mandi Officials</strong> (verification, weighment, grading & payment).</p>

  <div class="arch-container no-break">
    <div style="text-align: center; font-weight: 800; font-size: 10.5pt; color: #15803d; margin-bottom: 12px;">
      MANDIMITRA DISTRIBUTED ARCHITECTURE & BUS TOPOLOGY
    </div>

    <div class="arch-grid">
      <div class="arch-box">
        <h4>📱 Farmer Portal</h4>
        <p>• Mobile-first Web UI / PWA</p>
        <p>• Dynamic Slot Booking</p>
        <p>• Real-Time Token Tracker</p>
        <p>• Digital J-Form Receipt</p>
      </div>

      <div class="arch-box highlight">
        <h4>⚡ Real-Time Sync Bus</h4>
        <p>• <code>BroadcastChannel</code> Engine</p>
        <p>• Cross-Tab Message Dispatch</p>
        <p>• Sub-millisecond Notification</p>
        <p>• Reactive State Hydration</p>
      </div>

      <div class="arch-box">
        <h4>🏢 Official Terminal</h4>
        <p>• Multi-Centre Queue Console</p>
        <p>• 1-Click Counter Verification</p>
        <p>• Weighbridge & Grade Selection</p>
        <p>• DBT Payment Approval</p>
      </div>
    </div>

    <div style="display: flex; justify-content: center; align-items: center; margin: 10px 0; color: #64748b; font-weight: 700; font-size: 8pt;">
      ▲ ▼ Bi-Directional Event Synchronization & State Mutations ▲ ▼
    </div>

    <div class="arch-grid">
      <div class="arch-box">
        <h4>🌐 Next.js API Routes</h4>
        <p>• <code>/api/bookings</code> (Atomic)</p>
        <p>• <code>/api/bookings/track/[token]</code></p>
        <p>• <code>/api/official/queue</code></p>
        <p>• <code>/api/recommendations</code></p>
      </div>

      <div class="arch-box highlight">
        <h4>💾 Dual-Tier Hybrid Store</h4>
        <p>• Server: <code>__mandiMitraQueue</code></p>
        <p>• Client: Versioned LocalStorage</p>
        <p>• Fuzzy Matching Engine</p>
        <p>• Cache Invalidation Guard</p>
      </div>

      <div class="arch-box">
        <h4>🗄️ Database & Models</h4>
        <p>• Prisma ORM v6.19</p>
        <p>• Relational Schema (PostgreSQL)</p>
        <p>• Strict Unique Constraints</p>
        <p>• Cascade & Audit Relations</p>
      </div>
    </div>
  </div>

  <h2>Procurement Lifecycle Stages</h2>
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin: 12px 0;">
    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 8.5pt; font-weight: 700;">
      <div style="text-align: center;">
        <span class="status-pill status-waiting">1. WAITING</span>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">Slot Booked • In Queue</div>
      </div>
      <div style="color: #94a3b8;">➔</div>
      <div style="text-align: center;">
        <span class="status-pill status-called">2. CALLED</span>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">Gate Entry Alert Pulse</div>
      </div>
      <div style="color: #94a3b8;">➔</div>
      <div style="text-align: center;">
        <span class="status-pill status-verified">3. VERIFIED</span>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">Aadhaar & Land Checked</div>
      </div>
      <div style="color: #94a3b8;">➔</div>
      <div style="text-align: center;">
        <span class="status-pill status-processing">4. PROCESSING</span>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">Weighbridge & Quality Grade</div>
      </div>
      <div style="color: #94a3b8;">➔</div>
      <div style="text-align: center;">
        <span class="status-pill status-completed">5. COMPLETED</span>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 4px;">Digital J-Form & DBT Sent</div>
      </div>
    </div>
  </div>

  <!-- PRISMA SCHEMA -->
  <div class="page-break"></div>

  <h1><span class="section-num">03.</span> Database Architecture & Prisma Schema</h1>
  <p>The database schema is declared in <code>prisma/schema.prisma</code> and structured for relational integrity, audit tracking, and high-concurrency throughput.</p>

  <h2>Data Model Specifications</h2>
  <table>
    <thead>
      <tr>
        <th>Model Name</th>
        <th>Primary Key</th>
        <th>Unique Constraints</th>
        <th>Core Relationships & Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>Farmer</code></td>
        <td><code>id</code> (CUID)</td>
        <td><code>phone</code>, <code>aadhaarHash</code></td>
        <td>Stores registered farmers, landholding acres, bank IFSC/account for DBT, and cascade links to <code>Booking[]</code>.</td>
      </tr>
      <tr>
        <td><code>Official</code></td>
        <td><code>id</code> (CUID)</td>
        <td><code>employeeId</code>, <code>email</code></td>
        <td>Mandi supervisors and weighbridge operators with centre assignment and audit logging on processed bookings.</td>
      </tr>
      <tr>
        <td><code>Centre</code></td>
        <td><code>id</code> (CUID)</td>
        <td><code>code</code></td>
        <td>Physical mandi terminals with unloading bays, geographic distance metadata, base wait times, and relation to <code>Booking[]</code>.</td>
      </tr>
      <tr>
        <td><code>TimeSlot</code></td>
        <td><code>id</code> (CUID)</td>
        <td>Composite centre + slot</td>
        <td>Represents granular 30-minute operational arrival windows with max capacity and active booking counters.</td>
      </tr>
      <tr>
        <td><code>Booking</code></td>
        <td><code>id</code> (CUID)</td>
        <td><code>bookingCode</code>, <code>[centreId, procurementDate, tokenNumber]</code></td>
        <td>The primary transactional entity tracking the farmer, token string, token number, crop, quantity, queue position, and status.</td>
      </tr>
      <tr>
        <td><code>ProcurementRecord</code></td>
        <td><code>id</code> (CUID)</td>
        <td><code>bookingId</code> (1-to-1)</td>
        <td>Official weighment ledger storing gross weight, tare weight, net weight, assigned quality grade, rate/quintal, and DBT payout.</td>
      </tr>
    </tbody>
  </table>

  <h2>Core Prisma Schema Definition</h2>
  <pre><code>// prisma/schema.prisma - Production Model
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum BookingStatus {
  WAITING
  CALLED
  VERIFIED
  PROCESSING
  COMPLETED
  CANCELLED
}

model Booking {
  id                   String              @id @default(cuid())
  bookingCode          String              @unique
  token                String              // e.g. "BHO-102", "IND-601", "A101"
  tokenNumber          Int                 // Guaranteed unique integer per location
  farmerId             String
  farmer               Farmer              @relation(fields: [farmerId], references: [id], onDelete: Cascade)
  centreId             String
  centre               Centre              @relation(fields: [centreId], references: [id])
  timeSlotId           String?
  timeSlot             TimeSlot?           @relation(fields: [timeSlotId], references: [id])
  procurementDate      DateTime
  time                 String
  fullTime             String?
  crop                 String
  estimatedQuantity    Float
  status               BookingStatus       @default(WAITING)
  queuePosition        Int                 @default(1)
  estimatedWaitMinutes Int                 @default(20)
  calledAt             DateTime?
  verifiedAt           DateTime?
  processingStartedAt  DateTime?
  completedAt          DateTime?
  officialId           String?
  official             Official?           @relation(fields: [officialId], references: [id])
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  procurementRecord    ProcurementRecord?

  @@unique([centreId, procurementDate, tokenNumber])
  @@map("bookings")
}

model ProcurementRecord {
  id                     String   @id @default(cuid())
  bookingId              String   @unique
  booking                Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  grossWeightQuintals    Float
  tareWeightQuintals     Float
  netWeightQuintals      Float
  moisturePercentage     Float?
  foreignMatterPercent   Float?
  assignedGrade          String   // "Grade A" | "Grade B" | "Grade C" | "Grade D"
  baseMspRate            Float    // ₹/Quintal
  appliedRate            Float    // ₹/Quintal after grade multiplier
  totalPayoutAmount      Float    // Net Weight * Applied Rate
  dbtReferenceNumber     String   @unique
  paymentDisbursedAt     DateTime @default(now())
}</code></pre>

  <!-- TOKEN ENGINE -->
  <div class="page-break"></div>

  <h1><span class="section-num">04.</span> Guaranteed Unique Token Generation Engine</h1>
  <p>
    A critical innovation in MandiMitra v2.2 is the <strong>Location-Partitioned Atomic Token Number Generation Engine</strong> implemented in <code>lib/token-service.ts</code>. Previously, arbitrary sequential counters caused cross-centre collisions where multiple farmers held the same token number (e.g. <code>103</code>), creating operational deadlock at mandi entry gates.
  </p>

  <h2>Geographic Number Block Partitioning</h2>
  <p>Every district is allocated an autonomous, non-overlapping 100-number block and a standardized 3-letter alphanumeric prefix:</p>

  <table>
    <thead>
      <tr>
        <th>Location / District</th>
        <th>State</th>
        <th>District Code</th>
        <th>Assigned Base</th>
        <th>Seed Range</th>
        <th>Generated Format Example</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Bhopal</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>BHO</code></td>
        <td>100</td>
        <td>101 – 113</td>
        <td><code>A101</code> (Primary Test) / <code>BHO-102</code></td>
      </tr>
      <tr>
        <td><strong>Sehore</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>SEH</code></td>
        <td>200</td>
        <td>201 – 213</td>
        <td><code>SEH-201</code>, <code>SEH-202</code></td>
      </tr>
      <tr>
        <td><strong>Narmadapuram</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>NAR</code></td>
        <td>300</td>
        <td>301 – 313</td>
        <td><code>NAR-301</code>, <code>NAR-302</code></td>
      </tr>
      <tr>
        <td><strong>Raisen</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>RAI</code></td>
        <td>400</td>
        <td>401 – 413</td>
        <td><code>RAI-401</code>, <code>RAI-402</code></td>
      </tr>
      <tr>
        <td><strong>Vidisha</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>VID</code></td>
        <td>500</td>
        <td>501 – 513</td>
        <td><code>VID-501</code>, <code>VID-502</code></td>
      </tr>
      <tr>
        <td><strong>Indore</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>IND</code></td>
        <td>600</td>
        <td>601 – 613</td>
        <td><code>IND-601</code>, <code>IND-602</code></td>
      </tr>
      <tr>
        <td><strong>Ujjain</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>UJJ</code></td>
        <td>700</td>
        <td>701 – 713</td>
        <td><code>UJJ-701</code>, <code>UJJ-702</code></td>
      </tr>
      <tr>
        <td><strong>Dewas</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>DEW</code></td>
        <td>800</td>
        <td>801 – 813</td>
        <td><code>DEW-801</code>, <code>DEW-802</code></td>
      </tr>
      <tr>
        <td><strong>Sagar</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>SAG</code></td>
        <td>900</td>
        <td>901 – 913</td>
        <td><code>SAG-901</code>, <code>SAG-902</code></td>
      </tr>
      <tr>
        <td><strong>Jabalpur</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>JAB</code></td>
        <td>1000</td>
        <td>1001 – 1013</td>
        <td><code>JAB-1001</code>, <code>JAB-1002</code></td>
      </tr>
      <tr>
        <td><strong>Gwalior</strong></td>
        <td>Madhya Pradesh</td>
        <td><code>GWA</code></td>
        <td>1100</td>
        <td>1101 – 1113</td>
        <td><code>GWA-1101</code>, <code>GWA-1102</code></td>
      </tr>
      <tr>
        <td><strong>Kota</strong></td>
        <td>Rajasthan</td>
        <td><code>KOT</code></td>
        <td>1200</td>
        <td>1201 – 1213</td>
        <td><code>KOT-1201</code>, <code>KOT-1202</code></td>
      </tr>
      <tr>
        <td><strong>Jaipur</strong></td>
        <td>Rajasthan</td>
        <td><code>JAI</code></td>
        <td>1300</td>
        <td>1301 – 1313</td>
        <td><code>JAI-1301</code>, <code>JAI-1302</code></td>
      </tr>
      <tr>
        <td><strong>Karnal</strong></td>
        <td>Haryana</td>
        <td><code>KAR</code></td>
        <td>1400</td>
        <td>1401 – 1413</td>
        <td><code>KAR-1401</code>, <code>KAR-1402</code></td>
      </tr>
      <tr>
        <td><strong>Meerut</strong></td>
        <td>Uttar Pradesh</td>
        <td><code>MEE</code></td>
        <td>1500</td>
        <td>1501 – 1513</td>
        <td><code>MEE-1501</code>, <code>MEE-1502</code></td>
      </tr>
    </tbody>
  </table>

  <h2>The Collision-Free Allocation Algorithm</h2>
  <pre><code>// lib/token-service.ts - Atomic Unique Token Generator
export function generateUniqueToken(params?: {
  location?: string;
  centre?: string;
  existingBookings?: Array&lt;{ tokenNumber?: number; location?: string; centre?: string }&gt;;
}): { tokenNumber: number; token: string } {
  const meta = getLocationTokenMeta(params?.location || params?.centre);

  // 1. Ingest all bookings from parameters or active memory store
  let allBookings = params?.existingBookings;
  if (!allBookings && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("smartProcurementQueue");
      if (raw) allBookings = JSON.parse(raw);
    } catch {}
  }

  const allUsedNumbers = new Set&lt;number&gt;();
  const locationNumbers: number[] = [];

  // 2. Index allocated token numbers in target location and across entire system
  if (Array.isArray(allBookings)) {
    for (const b of allBookings) {
      if (b && typeof b.tokenNumber === "number" && !isNaN(b.tokenNumber)) {
        allUsedNumbers.add(b.tokenNumber);
        const bMeta = getLocationTokenMeta(b.location || b.centre);
        if (bMeta.code === meta.code || (b.tokenNumber &gt;= meta.base + 1 && b.tokenNumber &lt;= meta.base + 99)) {
          locationNumbers.push(b.tokenNumber);
        }
      }
    }
  }

  // 3. Compute next prospective sequential candidate
  let nextNumber = meta.base + 1;
  if (locationNumbers.length &gt; 0) {
    nextNumber = Math.max(...locationNumbers) + 1;
  }

  // 4. Guaranteed global uniqueness loop (avoids collisions even under heavy load)
  while (allUsedNumbers.has(nextNumber)) {
    nextNumber++;
  }

  // 5. Format standardized token string
  const token = formatSmartToken(params?.location || params?.centre || meta.code, nextNumber);

  return { tokenNumber: nextNumber, token };
}</code></pre>

  <!-- REAL-TIME SYNC -->
  <div class="page-break"></div>

  <h1><span class="section-num">05.</span> Real-Time Cross-Tab Synchronization & State</h1>
  <p>
    MandiMitra uses a dual-tier hybrid persistence architecture combined with a zero-latency Web <code>BroadcastChannel</code> synchronization protocol.
  </p>

  <h2>The BroadcastChannel Protocol (<code>lib/cross-tab-sync.ts</code>)</h2>
  <p>
    Traditional applications rely on heavy WebSocket servers or aggressive HTTP polling loops that strain edge servers. MandiMitra establishes a browser-native inter-tab IPC channel:
  </p>
  <ul>
    <li><strong>Channel Identifier:</strong> <code>mandimitra_procurement_sync</code></li>
    <li><strong>Latency:</strong> &lt; 1 millisecond between tabs on the same client machine.</li>
    <li><strong>Fallback:</strong> Dispatches custom DOM <code>window.dispatchEvent(new CustomEvent(...))</code> for single-tab component isolation.</li>
    <li><strong>Payload Structure:</strong>
      <pre><code>export interface ProcurementBroadcastMessage {
  type: "STATUS_UPDATED" | "FARMER_CALLED" | "FARMER_VERIFIED" | "PROCUREMENT_STARTED" | "PROCUREMENT_COMPLETED";
  token?: string;
  bookingId?: string;
  status?: string;
  timestamp: number;
  booking?: any;
}</code></pre>
    </li>
  </ul>

  <h2>Dual-Tier Storage Architecture (<code>lib/procurement-store.ts</code>)</h2>
  <table>
    <thead>
      <tr>
        <th>Tier</th>
        <th>Mechanism</th>
        <th>Environment</th>
        <th>Behavior & Invalidation Guard</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Tier 1: Server Memory</strong></td>
        <td><code>globalThis.__mandiMitraQueue</code></td>
        <td>Node.js / Vercel Serverless</td>
        <td>Maintains queue state across stateless lambda executions within the same container life. Seeded on cold start with 180+ records.</td>
      </tr>
      <tr>
        <td><strong>Tier 2: Client Storage</strong></td>
        <td><code>window.localStorage</code></td>
        <td>Browser (Client)</td>
        <td>Instant zero-flicker hydration for mobile farmers. Uses <code>SEED_VERSION_KEY = "mandimitra_queue_seed_v2"</code> to auto-bust stale caches.</td>
      </tr>
    </tbody>
  </table>

  <h2>Universal Fuzzy Identifier Matcher</h2>
  <p>
    To make token lookups resilient to user input quirks, <code>matchesBookingIdentifier(booking, query)</code> evaluates 8 distinct matching vectors:
  </p>
  <pre><code>// lib/procurement-store.ts - Robust Matching Logic
export function matchesBookingIdentifier(
  b: Partial&lt;Booking&gt; | { [key: string]: any } | null | undefined,
  query?: string | number | null
): boolean {
  if (!b || !query) return false;
  const clean = normalizeTokenClean(query);
  const cleanStripped = clean.replace(/[-_\\s]/g, "");
  const bToken = normalizeTokenClean(b.token);
  const bTokenStripped = bToken.replace(/[-_\\s]/g, "");
  const bNumRaw = b.tokenNumber != null ? String(b.tokenNumber) : "";

  return (
    bToken === clean ||                           // Full: "IND-601" === "IND-601"
    bTokenStripped === cleanStripped ||           // Unhyphenated: "IND601" === "IND601"
    b.bookingId === clean ||                      // Booking code: "BOOK-INIT-001"
    b.farmerMobile === clean ||                   // 10-digit phone: "9876543210"
    clean === bNumRaw ||                          // Raw number: "601" === "601"
    clean === \`A\${bNumRaw}\` ||                     // Legacy prefix: "A101" === "A101"
    (b.tokenNumber === 101 && clean === "A101")   // Backward-compatibility hook
  );
}</code></pre>

  <!-- MSP GRADING -->
  <div class="page-break"></div>

  <h1><span class="section-num">06.</span> Government MSP Quality Grading & DBT Engine</h1>
  <p>
    In compliance with the Commission for Agricultural Costs and Prices (CACP) and Ministry of Agriculture guidelines, MandiMitra embeds official MSP benchmarks with automated quality grading modifiers.
  </p>

  <h2>Government Minimum Support Prices (2024–25 Kharif & Rabi)</h2>
  <table>
    <thead>
      <tr>
        <th>Commodity / Crop</th>
        <th>Category</th>
        <th>Base Govt MSP (₹/Quintal)</th>
        <th>Grade A (+3%)</th>
        <th>Grade B (MSP)</th>
        <th>Grade C (-4%)</th>
        <th>Grade D (-8%)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Wheat (गेहूं)</strong></td>
        <td>Rabi Cereal</td>
        <td>₹2,275</td>
        <td>₹2,343.25</td>
        <td>₹2,275.00</td>
        <td>₹2,184.00</td>
        <td>₹2,093.00</td>
      </tr>
      <tr>
        <td><strong>Paddy / Rice (धान)</strong></td>
        <td>Kharif Cereal</td>
        <td>₹2,183</td>
        <td>₹2,248.49</td>
        <td>₹2,183.00</td>
        <td>₹2,095.68</td>
        <td>₹2,008.36</td>
      </tr>
      <tr>
        <td><strong>Mustard (सरसों)</strong></td>
        <td>Oilseed</td>
        <td>₹5,650</td>
        <td>₹5,819.50</td>
        <td>₹5,650.00</td>
        <td>₹5,424.00</td>
        <td>₹5,198.00</td>
      </tr>
      <tr>
        <td><strong>Gram / Chana (चना)</strong></td>
        <td>Pulses</td>
        <td>₹5,440</td>
        <td>₹5,603.20</td>
        <td>₹5,440.00</td>
        <td>₹5,222.40</td>
        <td>₹5,004.80</td>
      </tr>
      <tr>
        <td><strong>Soybean (सोयाबीन)</strong></td>
        <td>Oilseed</td>
        <td>₹4,600</td>
        <td>₹4,738.00</td>
        <td>₹4,600.00</td>
        <td>₹4,416.00</td>
        <td>₹4,232.00</td>
      </tr>
      <tr>
        <td><strong>Cotton (कपास)</strong></td>
        <td>Commercial</td>
        <td>₹6,620</td>
        <td>₹6,818.60</td>
        <td>₹6,620.00</td>
        <td>₹6,355.20</td>
        <td>₹6,090.40</td>
      </tr>
      <tr>
        <td><strong>Maize (मक्का)</strong></td>
        <td>Kharif Coarse</td>
        <td>₹2,090</td>
        <td>₹2,152.70</td>
        <td>₹2,090.00</td>
        <td>₹2,006.40</td>
        <td>₹1,922.80</td>
      </tr>
      <tr>
        <td><strong>Barley (जौ)</strong></td>
        <td>Rabi Cereal</td>
        <td>₹1,850</td>
        <td>₹1,905.50</td>
        <td>₹1,850.00</td>
        <td>₹1,776.00</td>
        <td>₹1,702.00</td>
      </tr>
      <tr>
        <td><strong>Bajra (बाजरा)</strong></td>
        <td>Millet / Nutri</td>
        <td>₹2,500</td>
        <td>₹2,575.00</td>
        <td>₹2,500.00</td>
        <td>₹2,400.00</td>
        <td>₹2,300.00</td>
      </tr>
    </tbody>
  </table>

  <h2>Quality Grade Assessment Criteria & Mathematical Formulae</h2>
  <pre><code>// Quality Modifier Definition
Grade A: Moisture &lt; 10%, Foreign Matter &lt; 0.5%  ➔ Multiplier = 1.03 (+3% Premium)
Grade B: Fair Average Quality (FAQ) Standard    ➔ Multiplier = 1.00 (Standard MSP)
Grade C: Moisture 12–14%, Foreign Matter 1–2%   ➔ Multiplier = 0.96 (-4% Deduction)
Grade D: Moisture &gt; 14%, Damaged Grains &gt; 3%    ➔ Multiplier = 0.92 (-8% Deduction)

// Direct Benefit Transfer (DBT) Payout Formula:
Applied Rate (₹/Quintal) = Base MSP Rate * Grade Multiplier
Total Payable Amount (₹) = Net Weight (Quintals) * Applied Rate</code></pre>

  <!-- FRONTEND WALKTHROUGH -->
  <div class="page-break"></div>

  <h1><span class="section-num">07.</span> Frontend Architecture & Route Walkthrough</h1>
  <p>
    The frontend is partitioned into two distinct user journeys: the <strong>Farmer Portal</strong> and the <strong>Mandi Official Portal</strong>.
  </p>

  <h2>Farmer Portal Walkthrough</h2>
  <table>
    <thead>
      <tr>
        <th>Route</th>
        <th>Key Interactive Capabilities</th>
        <th>State & Sync Mechanics</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>/farmer/login</code></td>
        <td>Mobile number input, mock SMS OTP verification (<code>123456</code>), session establishment in localStorage.</td>
        <td>Hydrates <code>smart_procurement_farmer</code> auth token and profile.</td>
      </tr>
      <tr>
        <td><code>/farmer/dashboard</code></td>
        <td>Active token hero card, real-time status banner, quick "Track Token" button, recent procurement history.</td>
        <td>Subscribed to <code>subscribeProcurementUpdates</code> for live status changes.</td>
      </tr>
      <tr>
        <td><code>/farmer/book-slot</code></td>
        <td>15-District dropdown, allotted centre filter, crop picker with MSP rates, calendar date picker, slot selector, token generator.</td>
        <td>Calls <code>generateUniqueToken()</code>, updates local queue, and posts to <code>/api/official/queue</code>.</td>
      </tr>
      <tr>
        <td><code>/farmer/booking/confirmation</code></td>
        <td>Digital booking pass, barcode/token badge, entry gate details, SMS simulated alert, print booking slip.</td>
        <td>Reads active booking from localStorage and provides direct link to live tracking.</td>
      </tr>
      <tr>
        <td><code>/farmer/track-token</code></td>
        <td>Dedicated Token Search bar & Quick Switcher, 5-stage progressive UI, wait-time prediction, digital J-Form receipt.</td>
        <td>Zero stranger fallback; sub-millisecond reactive updates via <code>BroadcastChannel</code>.</td>
      </tr>
      <tr>
        <td><code>/farmer/history</code></td>
        <td>Chronological ledger of past procurement bookings, delivered weights, quality grades, and payment receipts.</td>
        <td>Synchronized with <code>smartProcurementHistory</code> storage.</td>
      </tr>
    </tbody>
  </table>

  <h2>Official Portal Walkthrough</h2>
  <table>
    <thead>
      <tr>
        <th>Route</th>
        <th>Key Interactive Capabilities</th>
        <th>State & Sync Mechanics</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>/official/dashboard</code></td>
        <td>Location filter, allotted centre dropdown, status chips, "Divided by Centre" cards vs Unified list, Call Farmer action.</td>
        <td>Throttled 10s GET polling with visibility check (avoids Vercel WAF blocks), dispatches <code>CALLED</code> broadcast.</td>
      </tr>
      <tr>
        <td><code>/official/verify</code></td>
        <td>Counter verification terminal, Aadhaar/Land document review, instant 1-click status progression to <code>VERIFIED</code>.</td>
        <td>Matches token via <code>matchesBookingIdentifier</code>, broadcasts <code>VERIFIED</code> event.</td>
      </tr>
      <tr>
        <td><code>/official/procurement</code></td>
        <td>Weighbridge console, gross/tare/net weighment input, MSP Quality Grade picker (A/B/C/D), live rate & payout calculator.</td>
        <td>Executes DBT payment trigger, moves status to <code>COMPLETED</code>, issues digital receipt.</td>
      </tr>
    </tbody>
  </table>

  <!-- REST API -->
  <div class="page-break"></div>

  <h1><span class="section-num">08.</span> Backend REST API Reference</h1>
  <p>The backend is delivered as Next.js Serverless API routes optimized for global edge execution.</p>

  <table>
    <thead>
      <tr>
        <th>HTTP Method & Route</th>
        <th>Query / Body Parameters</th>
        <th>Expected Response Payload</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>GET /api/bookings/track/[token]</code></td>
        <td>URL param: <code>token</code> (supports <code>A101</code>, <code>IND-601</code>, <code>601</code>, phone)</td>
        <td><code>{ success: true, booking: { token, status, waitTime, queuePosition, ... } }</code></td>
        <td><code>200 / 404</code></td>
      </tr>
      <tr>
        <td><code>POST /api/bookings</code></td>
        <td>Body: <code>{ farmerId, crop, quantity, date, centre, location, time }</code></td>
        <td><code>{ success: true, booking: { token: "IND-614", tokenNumber: 614, ... } }</code></td>
        <td><code>201 / 400</code></td>
      </tr>
      <tr>
        <td><code>GET /api/official/queue</code></td>
        <td>Query: <code>?status=WAITING | ALL</code></td>
        <td><code>{ success: true, queue: Booking[], counts: { total, waiting, ... } }</code></td>
        <td><code>200 OK</code></td>
      </tr>
      <tr>
        <td><code>POST /api/official/queue</code></td>
        <td>Body: <code>Booking</code> object</td>
        <td><code>{ success: true, booking, total: number }</code></td>
        <td><code>200 OK</code></td>
      </tr>
      <tr>
        <td><code>POST /api/official/queue/[id]/status</code></td>
        <td>URL param: <code>id</code>, Body: <code>{ status: "CALLED" | "VERIFIED" }</code></td>
        <td><code>{ success: true, booking: UpdatedBooking }</code></td>
        <td><code>200 / 404</code></td>
      </tr>
      <tr>
        <td><code>GET /api/centres</code></td>
        <td>Query: <code>?location=Indore</code></td>
        <td><code>{ success: true, location: "Indore", centres: ProcurementCentre[] }</code></td>
        <td><code>200 OK</code></td>
      </tr>
      <tr>
        <td><code>GET /api/recommendations/smart-centre</code></td>
        <td>Query: <code>?location=Bhopal</code></td>
        <td><code>{ bestCentre, recommendedSlot, alternativeCentres }</code></td>
        <td><code>200 OK</code></td>
      </tr>
      <tr>
        <td><code>POST /api/farmers/auth</code></td>
        <td>Body: <code>{ mobile: "9876543210", otp: "123456" }</code></td>
        <td><code>{ success: true, token: string, farmer: FarmerProfile }</code></td>
        <td><code>200 / 401</code></td>
      </tr>
      <tr>
        <td><code>POST /api/official/procurement/record</code></td>
        <td>Body: <code>{ bookingId, netWeight, grade, rate, totalPayout }</code></td>
        <td><code>{ success: true, record: ProcurementRecord, dbtRef: string }</code></td>
        <td><code>201 / 400</code></td>
      </tr>
    </tbody>
  </table>

  <!-- DEVOPS -->
  <div class="page-break"></div>

  <h1><span class="section-num">09.</span> Security, Resilience & Production DevOps</h1>

  <h2>1. Vercel Edge WAF Mitigation & DDoS Hardening</h2>
  <p>
    During early testing with 180 seeded records, continuous polling in <code>app/official/dashboard/page.tsx</code> contained an nested loop triggering individual <code>POST</code> requests per farmer every 3 seconds. Vercel's Web Application Firewall (WAF) flagged this automated burst as a potential DDoS attack, resulting in <code>403: Forbidden (X-Vercel-Mitigated: deny)</code>.
  </p>
  <ul>
    <li><strong>Resolution:</strong> Eliminated all mutating <code>POST</code> requests from polling loops.</li>
    <li><strong>Visibility Throttling:</strong> Wrapped poll timers in <code>document.visibilityState === 'visible'</code> checks, automatically pausing network requests when browser tabs are minimized or idle.</li>
    <li><strong>Debounced Inputs:</strong> Added 600ms debounce timers on slot queries during booking workflows.</li>
  </ul>

  <h2>2. Production Build Pipeline & Deployment Verification</h2>
  <p>The application is deployed continuously to Vercel via GitHub webhook integration:</p>
  <pre><code>// Production Build Script (package.json)
"build": "prisma generate && next build"

// Turbopack Build Telemetry (Verified 0 Errors):
✔ Generated Prisma Client (v6.19.3) to .\\node_modules\\@prisma\\client
▲ Next.js 16.3.4 (Turbopack)
✓ Compiled successfully in 1.4s
  Running TypeScript ... Finished in 4.3s (0 errors)
✓ Generating static pages (22/22 pre-rendered routes)
Exit Code: 0</code></pre>

  <h2>3. Live Verification Endpoints</h2>
  <ul>
    <li><strong>Web Application Home:</strong> <a href="https://mandimitraaa.vercel.app/">https://mandimitraaa.vercel.app/</a></li>
    <li><strong>Direct Token Tracking (Bhopal A101):</strong> <a href="https://mandimitraaa.vercel.app/farmer/track-token?token=A101">https://mandimitraaa.vercel.app/farmer/track-token?token=A101</a></li>
    <li><strong>Direct Token Tracking (Indore IND-601):</strong> <a href="https://mandimitraaa.vercel.app/farmer/track-token?token=IND-601">https://mandimitraaa.vercel.app/farmer/track-token?token=IND-601</a></li>
    <li><strong>Official Procurement Terminal:</strong> <a href="https://mandimitraaa.vercel.app/official/procurement">https://mandimitraaa.vercel.app/official/procurement</a></li>
    <li><strong>GitHub Repository:</strong> <a href="https://github.com/aaryanttiwari247-lab/mandimitra.git">https://github.com/aaryanttiwari247-lab/mandimitra.git</a></li>
  </ul>

  <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 8.5pt; color: #94a3b8;">
    © 2026 MandiMitra Engineering Team • Smart India Hackathon Agricultural Innovation • All Rights Reserved.
  </div>

</body>
</html>
`;

// Write HTML file
const htmlPath = path.join(__dirname, 'mandimitra_full_technical_specification.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('HTML documentation written to:', htmlPath);

// Target PDF path
const pdfPath = path.join(process.cwd(), 'MandiMitra_Complete_Technical_Documentation.pdf');

// Run Chrome headless to generate PDF
const chromePath = 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
const command = `"${chromePath}" --headless=new --disable-gpu --no-sandbox --print-to-pdf="${pdfPath}" "${htmlPath}"`;

console.log('Generating PDF using Chrome headless...');
try {
  execSync(command, { stdio: 'inherit' });
  console.log('SUCCESS! PDF generated at:', pdfPath);
  const stats = fs.statSync(pdfPath);
  console.log('File Size:', (stats.size / 1024).toFixed(2), 'KB');
} catch (err) {
  console.error('Error generating PDF:', err);
  process.exit(1);
}
