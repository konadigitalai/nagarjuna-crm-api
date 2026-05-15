// controllers/whatsappController.ts
import { Request, Response } from 'express';
import { deleteTemplate, listTemplates, sendTemplate, sendTemplateMsg, sendWhatsAppService } from '../services/whatsappService';

export async function sendWhatsAppController(req: Request, res: Response) {
    try {
        const { to, message, contentSid, variables } = req.body;
        console.log("🚀 ~ sendWhatsAppController ~ to:", to)

        if (!to) {
            return res.status(400).json({ error: 'Recipient phone number is required' });
        }

        const result = await sendWhatsAppService({ to, message, contentSid, variables });
        // return res.json({ success: true, sid: result.sid });
        return res.json({ success: true, result });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
}


export const listWhatsAppTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await listTemplates();

        res.json({
            success: true,
            templatesData: templates
        });
    } catch (err: any) {
        console.error('Error fetching templates:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const createWhatsAppTemplates = async (req: Request, res: Response) => {
    try {
        const { name, headerName, category, body } = req.body;
        console.log("🚀 ~ sendWhatsAppController ~ name:", name)

        if (!name) {
            return res.status(400).json({ error: 'Recipient phone number is required' });
        }

        const result = await sendTemplate({ name, headerName, category, body });
        // return res.json({ success: true, sid: result.sid });
        return res.json({ success: true, result });
    } catch (err: any) {
        console.error('Error fetching templates:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
export const deleteWhatsAppTemplate = async (req: Request, res: Response) => {
    try {
        const { name } = req.query;
        console.log("🚀 ~ sendWhatsAppController ~ name:", name)

        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }

        const result = await deleteTemplate({ name });
        // return res.json({ success: true, sid: result.sid });
        return res.json({ success: true, result });
    } catch (err: any) {
        console.error('Error fetching templates:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const sendTempMsg = async (req: Request, res: Response) => {
    try {
        const { tempName, lanCode, phoneNumber, components,userId } = req.body;

        if (!tempName) {
            return res.status(400).json({ error: 'Recipient template name is required' });
        }else if (!phoneNumber) {
            return res.status(400).json({ error: 'Recipient phone number is required' });
        }

        const result = await sendTemplateMsg({ tempName, lanCode, phoneNumber, components,userId });
        // return res.json({ success: true, sid: result.sid });
        return res.json({ success: true, result });
    } catch (err: any) {
        console.error('Error fetching templates:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
