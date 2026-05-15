// controllers/relatedContactsController.ts
import { Request, Response } from 'express';
import { Op } from 'sequelize';

import RelatedContact from '../models/related-contact.model';

// Create a related contact
export const createRelatedContact = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, dealerId, designation } = req.body;

    // Ensure the RelatedContact table exists
    await RelatedContact.sync({ alter: true });

    const relatedContact = await RelatedContact.create({ name, email, phone, dealerId, designation });
    res.status(201).json(relatedContact);
  } catch (error: any) {
    console.error('Error creating related contact:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get all related contacts
export const getRelatedContacts = async (req: Request, res: Response) => {
  try {
    const relatedContacts = await RelatedContact.findAll();
    res.status(200).json(relatedContacts);
  } catch (error: any) {
    console.error('Error fetching related contacts:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get related contact by ID
export const getRelatedContactById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const relatedContact = await RelatedContact.findByPk(id);
    if (!relatedContact) {
      return res.status(404).json({ message: 'Related contact not found' });
    }
    res.status(200).json(relatedContact);
  } catch (error: any) {
    console.error('Error fetching related contact:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update a related contact
export const updateRelatedContact = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const { name, email, phone, dealerId, designation } = req.body;
    const [updatedRowsCount] = await RelatedContact.update({ name, email, phone, dealerId, designation }, { where: { id } });
    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Related contact not found' });
    }
    res.status(200).json({ message: 'Related contact updated successfully' });
  } catch (error: any) {
    console.error('Error updating related contact:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete a related contact
export const deleteRelatedContact = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const deletedRowCount = await RelatedContact.destroy({ where: { id } });
    if (deletedRowCount === 0) {
      return res.status(404).json({ message: 'Related contact not found' });
    }
    res.status(200).json({ message: 'Related contact deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting related contact:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteRelatedContacts = async (req: Request, res: Response) => {
  const idsString = req.query.ids as string;
  const ids = idsString.split(',').map(id => parseInt(id, 10));

  try {
    const deletedRowCount = await RelatedContact.destroy({ where: { id: { [Op.in]: ids } } });
    if (deletedRowCount === 0) {
      return res.status(404).json({ message: 'Related contacts not found' });
    }
    res.status(200).json({ message: 'Related contacts deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting related contacts:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
