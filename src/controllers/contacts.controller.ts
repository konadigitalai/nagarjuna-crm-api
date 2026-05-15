import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import Joi from "joi";
import xlsx from "xlsx";
import { OrderItem } from "sequelize/types";
import multer from "multer";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import Contact, { DealerAttributes } from "../models/contact.model";
import RelatedContact from "../models/related-contact.model";
import User from "../models/user.model";
import { managerIdWiseUsers } from "./users.controller";

export const imgUpload = multer();

export const getContacts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const currentUser = req.uid;
    const currentRole = req.role;
    // Extract query parameters
    const { contactType, userId, startTime, endTime } = req.query;

    // Prepare filter object based on provided query parameters
    const filter: any = {};
    if (contactType) {
      filter.contactType = contactType;
    }
    if (currentRole === "manager") {
      const usersList = await managerIdWiseUsers(currentUser)
      filter.userId = { [Op.in]: usersList };
      // filter.userId = currentUser;
    }
    if (userId) {
      filter.userId = userId;
    }

    if (startTime && endTime) {
      filter.updatedAt = {
        [Op.between]: [startTime, endTime],
      };
    } else if (startTime) {
      filter.updatedAt = {
        [Op.gte]: startTime,
      };
    } else if (endTime) {
      filter.updatedAt = {
        [Op.lte]: endTime,
      };
    }

    // Fetch all contacts from the database with optional filtering
    const contacts = await Contact.findAll({
      where: filter,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]] as OrderItem[],
    });

    // Return the contacts in the response
    return res.status(200).json({
      contacts,
    });
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error fetching contacts:", error);
    return res.status(500).json("Internal Server error");
  }
};
export const getContactsForWp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Extract query parameters
    const { contactType, userId, startTime, endTime } = req.query;

    // Prepare filter object based on provided query parameters
    const filter: any = {};
    if (contactType) {
      filter.contactType = contactType;
    }
    if (userId) {
      filter.userId = userId;
    }

    if (startTime && endTime) {
      filter.updatedAt = {
        [Op.between]: [startTime, endTime],
      };
    } else if (startTime) {
      filter.updatedAt = {
        [Op.gte]: startTime,
      };
    } else if (endTime) {
      filter.updatedAt = {
        [Op.lte]: endTime,
      };
    }

    // Fetch all contacts from the database with optional filtering
    const contacts = await Contact.findAll({
      where: filter,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
      attributes: ["id", "contactType", "phone", "personName"],
      order: [["createdAt", "DESC"]] as OrderItem[],
    });

    // Return the contacts in the response
    return res.status(200).json({
      contacts,
    });
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error fetching contacts:", error);
    return res.status(500).json("Internal Server error");
  }
};

export const getContactById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = parseInt(req.params.id);

  try {
    // Find the contact by ID
    const contact = await Contact.findByPk(id, {
      include: [
        { model: RelatedContact, as: "relatedContacts" },
        {
          model: User,
          as: "user",
          attributes: ["name", "email"],
        },
      ],
    });

    // If contact is not found, return 404 Not Found
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Return the contact in the response
    return res.status(200).json(contact);
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error fetching contact by ID:", error);
    return res.status(500).json("Internal Server error");
  }
};

export const createContact = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    personName,
    companyName,
    phone,
    phone2,
    landline,
    email,
    contactType,
    address,
    description,
    userId,
    gstNumber,
  } = req.body;

  try {
    // Ensure the Contact table exists
    // await Contact.sync({ alter: true });

    // Insert contact into the database
    const newDealer = await Contact.create({
      personName,
      companyName,
      phone,
      phone2,
      landline,
      email,
      contactType,
      address,
      description,
      userId,
      gstNumber,
    });

    // // Integrate with Interakt API to track the user
    // try {
    //   // Format phone number for Interakt API (remove any non-digit characters and ensure it starts with country code)
    //   const formattedPhone = phone ? phone.replace(/\D/g, '') : '';
    //   const phoneNumber = formattedPhone.length > 10 ? formattedPhone : '91' + formattedPhone;

    //   // Fetch user to get tags if userId is provided
    //   let userTags: string[] = [];
    //   if (userId) {
    //     const user = await User.findByPk(userId);
    //     if (user && user.tags) {
    //       userTags = user.tags;
    //     }
    //   }

    //   // Prepare data for Interakt API
    //   const interaktData = {
    //     phoneNumber: phoneNumber.substring(2), // Remove country code for phoneNumber field
    //     countryCode: "+91", // Assuming India as default, adjust as needed
    //     traits: {
    //       name: personName || companyName || 'Unknown',
    //       email: email || '',
    //     },
    //     tags: [...userTags] // Add user tags to the Interakt tags
    //   };

    //   // Make API call to Interakt
    //   await axios.post('https://api.interakt.ai/v1/public/track/users/', interaktData, {
    //     headers: {
    //       'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`,
    //       'Content-Type': 'application/json'
    //     }
    //   });
    // } catch (interaktError) {
    //   console.error('Error integrating with Interakt API:', interaktError);
    //   // Continue with the response even if Interakt API fails
    // }

    await RelatedContact.sync({ alter: true });

    // Return success response
    return res.status(201).json({
      message: "Contact created successfully",
      data: {
        id: newDealer.id,
        personName: newDealer.personName,
        companyName: newDealer.companyName,
        phone: newDealer.phone,
        phone2: newDealer.phone2,
        landline: newDealer.landline,
        email: newDealer.email,
        contactType: newDealer.contactType,
        address: newDealer.address,
        description: newDealer.description,
        userId: newDealer.userId,
        gstNumber: newDealer.gstNumber,
      },
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    // Return error response
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateContact = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Extract contact ID from request parameters
  const id = parseInt(req.params.id);

  // Extract updated contact details from request body
  const {
    personName,
    companyName,
    phone,
    phone2,
    landline,
    email,
    contactType,
    address,
    description,
    userId,
    gstNumber,
  } = req.body;

  try {
    // Find the contact by ID
    const contact = await Contact.findByPk(id);

    // If contact is not found, return 404 Not Found
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Update contact attributes
    contact.personName = personName;
    contact.companyName = companyName;
    contact.phone = phone;
    contact.phone2 = phone2;
    contact.landline = landline;
    contact.email = email;
    contact.contactType = contactType;
    contact.address = address;
    contact.description = description;
    contact.userId = userId;
    contact.gstNumber = gstNumber;

    // Save the changes to the database
    await contact.save();

    // Return a JSON response with the updated contact details
    return res.json({
      message: "Contact updated successfully",
      contact: {
        id,
        personName,
        companyName,
        phone,
        phone2,
        landline,
        email,
        contactType,
        address,
        description,
        userId,
        gstNumber,
      },
    });
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error updating contact:", error);
    return res.status(500).json("Internal Server error");
  }
};

// Delete a contact by ID
export const deleteContact = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Extract contact ID from request parameters
  const id = parseInt(req.params.id);

  try {
    // Find the contact by ID
    const contact = await Contact.findByPk(id);

    // If contact is not found, return 404 Not Found
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Delete the related contacts associated with the contact
    await RelatedContact.destroy({ where: { dealerId: id } });

    // Delete the contact from the database
    await contact.destroy();

    // Return a JSON response indicating successful deletion
    return res
      .status(200)
      .json({ message: `Contact ${contact.companyName} deleted successfully` });
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error("Error deleting contact:", error);
    return res.status(500).json("Internal Server error");
  }
};

export const deleteContacts = async (req: Request, res: Response) => {
  const idsString = req.query.ids as string;
  const ids = idsString.split(",").map((id) => parseInt(id, 10));
  try {
    // Delete related contacts based on dealerIds
    await Promise.all(
      ids.map(async (id) => {
        await RelatedContact.destroy({ where: { dealerId: id } });
      })
    );

    const deletedRowCount = await Contact.destroy({
      where: { id: { [Op.in]: ids } },
    });
    if (deletedRowCount === 0) {
      return res.status(404).json({ message: "Contacts not found" });
    }
    res.status(200).json({ message: "Contacts deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting contacts:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const processExcelData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Extract the uploaded Excel file from the request
    const excelFile = req.file;
    if (!excelFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Load the Excel workbook
    const workbook = xlsx.readFile(excelFile.path);

    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Extract data from the worksheet
    const contactsData: DealerAttributes[] =
      xlsx.utils.sheet_to_json(worksheet);

    // Validate and process each row of data
    for (let i = 0; i < contactsData.length; i++) {
      const contact = contactsData[i];
      contact.phone = contact.phone.toString();

      // Joi schema for contact data validation
      const contactSchema = Joi.object({
        personName: Joi.string().required(),
        companyName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string()
          .required()
          .pattern(/^[0-9]{10}$/),
        contactType: Joi.string()
          .valid("customer", "dealer", "fabricator")
          .required(),
        address: Joi.string().required(),
        description: Joi.string().required(),
        userId: Joi.number().integer().required(),
      });

      // Validate the contact data
      const validationResult = contactSchema.validate(contact, {
        abortEarly: false,
      });
      if (validationResult.error) {
        return res.status(400).json({
          error: `Validation error in row ${i + 1
            }: ${validationResult.error.details
              .map((detail) => detail.message)
              .join("; ")}`,
        });
      }
    }

    // Insert validated contact data into the database
    await Contact.bulkCreate(contactsData);

    // Return success response
    return res.status(200).json({ message: "Contacts inserted successfully" });
  } catch (error: any) {
    console.error("Error processing Excel data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Controller function to get contacts count by contactType for a date range
export const getContactsCountByType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    let { fromDate, toDate, type, userId } = req.query;

    if (!fromDate) {
      fromDate = new Date().toISOString().slice(0, 10);
    }

    if (!toDate) {
      toDate = new Date().toISOString().slice(0, 10);
    }

    const parsedFromDate = new Date(fromDate as string);
    parsedFromDate.setUTCHours(0, 0, 0, 0);

    const parsedToDate = new Date(toDate as string);
    parsedToDate.setUTCHours(23, 59, 59, 999);

    if (type === "contactType") {
      const contactsCount = await Contact.findAll({
        attributes: ["contactType", [fn("COUNT", col("id")), "count"]],
        where: {
          createdAt: {
            [Op.between]: [parsedFromDate, parsedToDate],
          },
        },
        group: ["contactType"],
      });

      // Initialize default counts object
      const defaultCounts: any = {
        dealer: 0,
        fabricator: 0,
        customer: 0,
      };

      // Iterate through the contactsCount array and update counts
      contactsCount.forEach((contact: any) => {
        const contactType = contact.contactType;
        const count = parseInt(contact.getDataValue("count"), 10);
        defaultCounts[contactType] = count;
      });

      // Convert defaultCounts object into an array of objects
      const result = Object.keys(defaultCounts).map((contactType) => ({
        contactType,
        count: defaultCounts[contactType],
      }));

      return res.status(200).json({ contactsCount: result });
    } else {
      const whereClause: any = {
        createdAt: {
          [Op.between]: [parsedFromDate, parsedToDate],
        },
      };

      let contactsCountByUserId = 0;
      if (userId) {
        const _whereClause = { ...whereClause };
        _whereClause.userId = userId;

        contactsCountByUserId = await Contact.count({
          where: _whereClause,
        });
      }

      const contactsCountForAll = await Contact.count({
        where: whereClause,
      });

      return res
        .status(200)
        .json({ contactsCountByUserId, contactsCountForAll });
    }
  } catch (error: any) {
    // Handle errors
    console.error("Error fetching contacts count by contactType:", error);
    return res
      .status(500)
      .json({ error: "Internal Server error", message: error.message });
  }
};

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);
const containerName = process.env.AZURE_STORAGE_DP_CONTAINER_NAME!;
const containerClient = blobServiceClient.getContainerClient(containerName);

export const uploadImage = async (
  file: Express.Multer.File
): Promise<string> => {
  const blobName = `${uuidv4()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });
  return blockBlobClient.url;
};

// Controller to handle dealer display picture update
export const updateDealerDisplayPicture = async (
  req: Request,
  res: Response
) => {
  try {
    const { dealerId } = req.body;
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const displayPictureUrl = await uploadImage(req.file);

    const contact = await Contact.findByPk(dealerId);
    if (!contact) {
      return res.status(404).send({ message: "Contact not found" });
    }

    contact.displayPicture = displayPictureUrl;
    await contact.save();

    res.send({ message: "Display picture updated successfully", contact });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to update display picture", error });
  }
};

export const contactDataUpdate = async (req: Request, res: Response) => {
  const { userId, contactType, ids } = req.body; // Extract userId and contactType from request body
  const idstring = ids.split(",").map((id: string) => parseInt(id, 10)); // Convert to an array of integers
  try {
    interface ContactUpdateData {
      userId?: number; // Optional, since it may or may not be provided
      contactType?: string; // Optional
    }
    let data: ContactUpdateData = {};
    if (userId) {
      data.userId = userId;
    }
    if (contactType) {
      data.contactType = contactType;
    }
    // Update contacts with the provided userId and contactType
    const [updatedRowCount] = await Contact.update(
      data,
      { where: { id: { [Op.in]: idstring } } } // Update only for provided IDs
    );

    if (updatedRowCount === 0) {
      return res
        .status(404)
        .json({ message: "Contacts not found or no updates made" });
    }

    res.status(200).json({ message: "Contacts updated successfully" });
  } catch (error: any) {
    console.error("Error updating contacts:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
