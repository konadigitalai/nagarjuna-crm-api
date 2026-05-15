// services/whatsappService.ts
import axios from 'axios';
import 'dotenv/config';
import twilio from 'twilio';
import WpMessage from '../models/wpmessage.model';
import { Request, Response } from 'express';
import User from '../models/user.model';

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);
console.log("🚀 ~ process.env.TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID)

type SendWhatsAppOptions = {
    to: string;
    message?: string;
    contentSid?: string;
    variables?: Record<string, string>;
};

export async function sendWhatsAppService({
    to,
    message,
    contentSid,
    variables
}: SendWhatsAppOptions) {
    const payload: any = {
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${to}`,
    };

    if (contentSid) {
        payload.contentSid = contentSid;
        if (variables) {
            payload.contentVariables = JSON.stringify(variables);
        }
    } else if (message) {
        payload.body = message;
    } else {
        throw new Error('Either message or contentSid is required');
    }
    console.log("🚀 ~ sendWhatsAppService ~ payload:", payload)

    const msg = await client.messages.create(payload);
    const msg1 = await client.messages(msg?.sid).fetch();
    console.log('Status:', msg.status);
    console.log('Error Code:', msg.errorCode);
    console.log('Error Message:', msg.errorMessage);

    return { msg, msg1 };
}

export async function listTemplates() {
    try {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN as string; // Long-lived token
        if (!accessToken) {
            throw new Error("❌ Please set WHATSAPP_ACCESS_TOKEN in .env file");
        }
        const url = `${process.env.META_API}${process.env.META_WABA_ID}/message_templates`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data
    } catch (error: any) {
        console.error("❌ Error fetching templates:", error.response?.data || error.message);
        return error.response?.data || error.message
    }
}

type createTemplate = {
    name: string;
    headerName?: string;
    category?: string;
    body?: string;
};

export async function sendTemplate({ name, headerName, category, body }: createTemplate) {
    console.log("🚀 ~ sendTemplate ~ category:", category)
    try {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
        if (!accessToken) {
            throw new Error("❌ Please set WHATSAPP_ACCESS_TOKEN in .env file");
        }

        const url = `${process.env.META_API}${process.env.META_WABA_ID}/message_templates`;

        const payload = {
            name: name,
            language: "en_US",
            category: category, // ✅ must be valid
            components: [
                {
                    type: "HEADER",
                    format: "TEXT",
                    text: headerName
                },
                {
                    type: "BODY",
                    text: body
                }
                // Optional buttons
                // {
                //   type: "BUTTONS",
                //   buttons: [
                //     {
                //       type: "QUICK_REPLY", // or URL, PHONE_NUMBER, CATALOG
                //       text: "View items"
                //     }
                //   ]
                // }
            ]
        };

        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        return response.data
    } catch (error: any) {
        console.error("❌ Error creating template:", error.response?.data || error.message);
        return error.response?.data || error.message
    }
}

export async function deleteTemplate({ name }: { name: any }) {
    try {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
        if (!accessToken) {
            throw new Error("❌ Please set WHATSAPP_ACCESS_TOKEN in .env file");
        }

        const url = `${process.env.META_API}${process.env.META_WABA_ID}/message_templates`;

        const response = await axios.delete(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                name: name, // template name to delete
            },
        });

        return response.data
    } catch (error: any) {
        console.error("❌ Error creating template:", error.response?.data || error.message);
        return error.response?.data || error.message
    }
}

type templateMsg = {
    tempName: string;
    lanCode?: string;
    phoneNumber: string;
    components?: any;
    userId?: any;
};

const normalizeMobile = (mobile: string): string => {
    // 🔹 remove all spaces
    mobile = mobile.replace(/\s+/g, "").trim();

    if (/^\+91\d{10}$/.test(mobile)) {
        return mobile.replace(/^\+91/, "91"); // +91 → 91
    } else if (/^\d{10}$/.test(mobile)) {
        return "91" + mobile; // 10 digit → 91XXXXXXXXXX
    } else if (/^91\d{10}$/.test(mobile)) {
        return mobile; // already correct
    }
    return mobile; // fallback
};

export async function sendTemplateMsg({ tempName, lanCode, phoneNumber, components, userId }: templateMsg) {
    try {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
        if (!accessToken) {
            throw new Error("❌ Please set WHATSAPP_ACCESS_TOKEN");
        }
        WpMessage.sync({ alter: true });
        const url = `${process.env.META_API}${process.env.META_PHONE_NUMBER_ID}/messages`;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: normalizeMobile(phoneNumber),
            type: "template",
            template: {
                name: tempName,
                language: {
                    code: lanCode || "en_US"
                },
                components: components ?? []
            }
        }

        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        if (response?.data?.messages?.[0]?.message_status && response?.data?.messages?.[0]?.id) {
             if (await WpMessage.count() === 0) {
                await WpMessage.sync({ alter: true });
            }
            const newMessage = await WpMessage.create({ userId, msgStatus: response?.data?.messages?.[0]?.message_status, msgId: response?.data?.messages?.[0]?.id });
        }


        return response.data
    } catch (error: any) {
        console.error("❌ Error creating template:", error.response?.data || error.message);
        return error.response?.data || error.message
    }
}


export const getWpMessage = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.query;
    try {
        const whereClause = userId ? { userId } : {};
        const messages = await WpMessage.findAll({
            where: whereClause,  // Apply the where clause conditionally
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ messages });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};