import sgMail from '@sendgrid/mail';
import { Request, Response } from 'express';
import User from '../models/user.model';
import Meeting from '../models/meeting.model';
const nodemailer = require('nodemailer');

const sendGridApiKey = process.env.SEND_GRID_API_KEY!
const email = process.env.EMAIL!
sgMail.setApiKey(sendGridApiKey);

export const sendEmails = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { hostId, userId, participants, meetingName, location, startTime, endTime } = req.body;
        // const transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASSWORD
        //     },
        //     tls: {
        //         rejectUnauthorized: false, // Bypass self-signed certificate errors
        //     },
        // });

        // Fetch host details
        const host: any = await User.findByPk(hostId);

        if (!host) {
            return res.status(404).json({ message: 'Host user not found.' });
        }


        const hostEmail = host.email;

        const formattedStartTime = new Date(startTime).toLocaleString('en-GB', { timeZone: 'UTC' });
        const formattedEndTime = new Date(endTime).toLocaleString('en-GB', { timeZone: 'UTC' });

        // Compose email content
        const subject = `Meeting Invitation: ${meetingName}`;

        const html = `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        color: #333;
                    }
                    h2 {
                        color: #007bff;
                    }
                    .meeting-details {
                        background-color: #fff;
                        border-radius: 5px;
                        padding: 10px;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    }
                    .meeting-details strong {
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="meeting-details">
                    <p>You have been invited to a meeting.</p>
                    <p><strong>Meeting Name:</strong> ${meetingName}</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Start Time:</strong> ${formattedStartTime}</p>
                    <p><strong>End Time:</strong> ${formattedEndTime}</p>
                </div>
            </body>
            </html>
        `;

        // Send emails
        // await sgMail.send({
        //     to: [hostEmail, ...participants],
        //     from: 'manideep.moturi@yopmail.com',
        //     subject: subject,
        //     html: html
        // });
        // const emailOptions = {
        //     from: process.env.EMAIL_USER,
        //     to: [hostEmail, ...participants],
        //     subject: subject,
        //     html: html
        // };
        // await transporter.sendMail(emailOptions);

        const msg = {
            to: [hostEmail, ...participants],
            from: email, // Must be a verified sender in SendGrid
            subject: subject,
            html: html,
        };

        await sgMail.sendMultiple(msg);

        // Ensure the Meeting table exists
        await Meeting.sync({ alter: true });

        // Create the meeting
        await Meeting.create({
            hostId,
            userId,
            participants,
            meetingName,
            location,
            startTime,
            endTime
        });

        return res.status(200).json({ message: 'Emails sent successfully and meeting details stored.' });
    } catch (error: any) {
        console.error('Error occurred while sending emails:', error.toString());
        return res.status(500).json({ message: 'Error occurred while sending emails.', error: error.message });
    }
}

export const getAllMeetings = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { userId } = req.body;

        const whereCondition = userId ? { userId } : {};

        // Fetch all meetings including associated host and participants
        const meetings = await Meeting.findAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'host',
                    attributes: ['id', 'name', 'email']
                },
            ],
            attributes: { exclude: ['hostId'] },
        });

        return res.status(200).json({ meetings });
    } catch (error: any) {
        console.error('Error occurred while fetching meetings:', error.toString());
        return res.status(500).json({ message: 'Error occurred while fetching meetings.' });
    }
}