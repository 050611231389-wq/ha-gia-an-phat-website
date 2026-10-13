require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.jsonl');
fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: false, limit: '30kb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(__dirname, { extensions: ['html'] }));

const clean = (v, max=500) => String(v || '').replace(/[<>]/g, '').trim().slice(0,max);
const emailOK = v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOK = v => /^[0-9+().\s-]{8,20}$/.test(v);

function transporter(){
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

app.post('/api/leads', async (req,res) => {
  try {
    if (req.body.website) return res.status(200).json({ok:true}); // honeypot
    const lead = {
      id: crypto.randomUUID(), createdAt: new Date().toISOString(),
      name: clean(req.body.name,100), phone: clean(req.body.phone,20),
      business: clean(req.body.business,150), email: clean(req.body.email,150),
      interest: clean(req.body.interest,100), productCode: clean(req.body.productCode,100),
      message: clean(req.body.message,2000), source: clean(req.body.source,500), consent: req.body.consent === true
    };
    if (!lead.name || !phoneOK(lead.phone) || !emailOK(lead.email) || !lead.consent)
      return res.status(400).json({ok:false,message:'Vui lòng kiểm tra họ tên, số điện thoại, email và xác nhận đồng ý liên hệ.'});

    fs.appendFileSync(LEADS_FILE, JSON.stringify(lead) + '\n', 'utf8');

    const mailer = transporter();
    if (mailer) {
      const to = process.env.LEAD_TO_EMAIL || 'manhhung208@gmail.com';
      await mailer.sendMail({
        from: process.env.MAIL_FROM || `"Hà Gia An Phát Website" <${process.env.SMTP_USER}>`, to,
        replyTo: lead.email || undefined,
        subject: `[Website Hà Gia An Phát] Lead mới - ${lead.name} - ${lead.interest || 'Tư vấn'}`,
        text: `Lead mới từ website\n\nHọ tên: ${lead.name}\nSĐT: ${lead.phone}\nGara/Doanh nghiệp: ${lead.business || '-'}\nEmail: ${lead.email || '-'}\nSản phẩm quan tâm: ${lead.interest || '-'}\nMã SP/OE: ${lead.productCode || '-'}\nNội dung: ${lead.message || '-'}\nNguồn: ${lead.source || '-'}\nThời gian: ${lead.createdAt}\nMã lead: ${lead.id}`
      });
    }

    // Optional future CRM / automation webhook (Make, Zapier, n8n, HubSpot middleware, etc.)
    if (process.env.CRM_WEBHOOK_URL) {
      try { await fetch(process.env.CRM_WEBHOOK_URL, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(lead)}); }
      catch (e) { console.error('CRM webhook failed:', e.message); }
    }
    res.json({ok:true,id:lead.id});
  } catch (e) {
    console.error(e);
    res.status(500).json({ok:false,message:'Hệ thống đang bận. Vui lòng thử lại hoặc gọi hotline.'});
  }
});

app.get('/api/health', (req,res)=>res.json({ok:true,service:'Ha Gia An Phat website'}));
app.listen(PORT, ()=>console.log(`Ha Gia An Phat website running on port ${PORT}`));
