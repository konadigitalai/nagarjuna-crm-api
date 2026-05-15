// Import necessary modules and types
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import './config';
import { checkDatabaseAvailability } from './database';
import { apiDocumentation } from './docs/api-doc';
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
import './scheduled-tasks'; // Automatically initializes scheduled tasks

const app = express();

// Configure middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(cors());
app.options('*', cors());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocumentation));

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

async function startServer() {
  try {
    const isDatabaseAvailable = await checkDatabaseAvailability();
    if (isDatabaseAvailable) {
      // Start the server only if the database is available
      console.log('Started database server', process.env.DB_DATABASE);
    } else {
      console.log('Server cannot start due to database unavailability.');
    }
  } catch (err) {
    console.error('Error starting server:', err);
  }
}

app.get('/', function (req, res) {
  startServer()
  res.status(200);
  res.send({ message: 'nagarjuna steels services is up on running.' });
});

// Set up the Express application to listen on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startServer();
});
