import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { apiDocumentation } from './docs/api-doc';

// routers
import userRouter from './routes/users.router';
import dealerRouter from './routes/contacts.router';
import contactActiviteRouter from './routes/activite.router';
import relatedContactRouter from './routes/related-contacts.router';
import trackingInfoRouter from './routes/tracking-info.router';
import trackingNoteRouter from './routes/tracking-notes.router';
import trackingImageRouter from './routes/tracking-images.router';
import communicationRouter from './routes/communications.router';
import attendanceRouter from './routes/attendances.router';
import meetingRouter from './routes/meetings.router';
import mailRouter from './routes/mails.router';
import salesPersonTrackingInfoRouter from './routes/salesperson-tracking.router';
import appStatisticsRouter from './routes/app-statistics.router';
import webStatisticsRouter from './routes/web-statistics.router';
import taskRouter from './routes/tasks.router';
import messageRouter from './routes/messages.router';
import followUpRouter from './routes/followUp.router';
import masterDashbordRouter from './routes/master-dashbord.router';
import whatsappRouter from './routes/whatsapp.router';
import groupRouter from './routes/group.routes';

import { checkDatabaseAvailability } from './database';

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://nagarjuna-crm-webapp-psi.vercel.app"
    ],
    credentials: true,
  })
);

app.options('*', cors());

/* =========================
   SWAGGER
========================= */

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocumentation));

/* =========================
   ROUTES
========================= */

app.use('/api/v1/users', userRouter);
app.use('/api/v1/contacts', dealerRouter);
app.use('/api/v1/tasks', contactActiviteRouter);
app.use('/api/v1/related-contacts', relatedContactRouter);
app.use('/api/v1/sales-person/tracking', salesPersonTrackingInfoRouter);
app.use('/api/v1/activities', trackingInfoRouter);
app.use('/api/v1/tracking-notes', trackingNoteRouter);
app.use('/api/v1/tracking-images', trackingImageRouter);
app.use('/api/v1/communications', communicationRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/meetings', meetingRouter);
app.use('/api/v1/mails', mailRouter);
app.use('/api/v1/app-statistics', appStatisticsRouter);
app.use('/api/v1/web-statistics', webStatisticsRouter);
app.use('/api/v1/task', taskRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/followUp', followUpRouter);
app.use('/api/v1/master-dashbord', masterDashbordRouter);
app.use('/api/v1/whatsapp', whatsappRouter);
app.use('/api/v1/group', groupRouter);

/* =========================
   HEALTH CHECK
========================= */

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Nagarjuna CRM API is running',
  });
});

/* =========================
   DB INIT (SAFE)
========================= */

async function init() {
  try {
    const ok = await checkDatabaseAvailability();

    if (ok) {
      console.log('✅ Database connected successfully');
    } else {
      console.log('❌ Database connection failed');
    }
  } catch (err) {
    console.error('❌ DB init error:', err);
  }
}

init();

/* =========================
   START SERVER (LOCAL ONLY)
========================= */

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;