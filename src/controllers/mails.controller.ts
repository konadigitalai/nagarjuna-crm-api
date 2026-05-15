import { Request, Response } from 'express';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

const sendGridApiKey = process.env.SEND_GRID_API_KEY!
const email = process.env.EMAIL!
sgMail.setApiKey(sendGridApiKey);
if (!sendGridApiKey) {
    console.error("SendGrid API key is missing!");
    process.exit(1);  // Exit the process if the API key is missing
}

// Define the type for the email request body 
interface EmailRequest {
    to: string[];
    bcc?: string[];
    from: string;
    subject: string;
    html: string;
}

// Controller function to send emails
export const sendEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        // Extract email details from the request body 
        const { to, bcc, from, subject, html }: EmailRequest = req.body;

        // // Create a transporter using Gmail (or your preferred email service)
        // const transporter = nodemailer.createTransport({
        //     service: 'gmail', // Or another email service of your choice
        //     auth: {
        //         user: process.env.EMAIL_USER, // Your email address (e.g., from: 'youremail@gmail.com')
        //         pass: process.env.EMAIL_PASSWORD // Your email password or App password
        //     },
        //     tls: {
        //         rejectUnauthorized: false // To bypass self-signed certificate errors
        //     }
        // });
        // Create email options 
        // const msg = {
        //     to,
        //     bcc,
        //     from,
        //     subject,
        //     html,
        // };

        // // Send email
        // await transporter.sendMail(msg);

        const msg = {
            to: to,
            bcc: bcc,
            from: email, // Must be a verified sender in SendGrid
            subject: subject,
            html: html,
        };

        await sgMail.sendMultiple(msg);

        // Respond with success message
        res.status(200).json({ message: 'Email sent successfully.' });
    } catch (error) {
        // Handle errors 
        console.error('Error sending email:', error);
        console.log(error);

        res.status(500).json({ error: 'Error sending email.' });
    }
};
