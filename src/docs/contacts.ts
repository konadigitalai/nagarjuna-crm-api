const contactResponse = {
    empId: {
      type: 'string',
      example: 'EMP001',
    },
    name: {
      type: 'string',
      example: 'Manideep',
    },
    email: {
      type: 'string',
      example: 'manideep4658@gmail.com',
    },
    mobile: {
      type: 'string',
      example: '8686897800',
    },
    username: {
      type: 'string',
      example: 'salesperson1',
    },
    password: {
      type: 'string',
      example: 'salesperson1',
    },
    role: {
      type: 'string',
      example: 'salesperson',
    },
  }
  
  const internalServerError = {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Internal server error',
            },
            error: {
              type: 'string',
              example: 'Error message goes here',
            },
          }
        },
      },
    },
  };
  
  const contactNotFound = {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Contact not found',
            },
          },
        },
      },
    },
  };
  
  const invalidContactData = {
    description: 'Invalid Data provided',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'The fields field1, field2 and field3 are required',
            },
          },
        },
      },
    },
  };
  
  const createContactBody = {
    type: 'object',
    properties: {
      personName: {
        type: 'string',
        example: 'Manideep',
      },
      companyName: {
        type: 'string',
        example: 'TCS',
      },
      email: {
        type: 'string',
        example: 'trainingdli2@gmail.com',
      },
      phone: {
        type: 'string',
        example: '8686897800',
      },
      contactType: {
        type: 'string',
        example: 'customer',
      },
      address: {
        type: 'string',
        example: 'Madhapur, Hyderabad',
      },
      description: {
        type: 'string',
        example: 'Software Company',
      },
      userId: {
        type: 'integer',
        example: 1,
      },
    },
  };
  
  const updateContactBody = createContactBody;
  
  const security = [
    {
      bearerAuth: [],
    },
  ];
  
  const createContact = {
    tags: ['Contacts'],
    description: 'Create a new contact in the system',
    operationId: 'createContact',
    security: security, // Include security here
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/createContactBody',
          },
        },
      },
      required: true,
    },
    responses: {
      '201': {
        description: 'Contact created successfully!',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: contactResponse,
            },
          },
        },
      },
      '500': internalServerError,
    },
  };
  
  const getContacts = {
    tags: ['Contacts'],
    description: 'Retrieve all the contacts',
    operationId: 'getContacts',
    security: security, // Include security here
    responses: {
      '200': {
        description: 'Contacts retrieved successfully!',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: contactResponse,
              },
            },
          },
        },
      },
      '500': internalServerError,
    },
  };
  
  const getContact = {
    tags: ['Contacts'],
    description: 'Retrieve one contact',
    operationId: 'getContact',
    security: security, // Include security here
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'Contact ID',
        required: true,
        type: 'string',
      },
    ],
    responses: {
      '200': {
        description: 'Contact retrieved successfully!',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: contactResponse,
            },
          },
        },
      },
      '404': contactNotFound,
      '500': internalServerError,
    },
  };
  
  const updateContact = {
    tags: ['Contacts'],
    description: 'Update a contact',
    operationId: 'updateContact',
    security: security, // Include security here
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'Contact ID',
        required: true,
        type: 'string',
      },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/updateContactBody',
          },
        },
      },
      required: true,
    },
    responses: {
      '200': {
        description: 'Contact updated successfully!',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: contactResponse,
            },
          },
        },
      },
      '404': contactNotFound,
      '500': internalServerError,
    },
  };
  
  const deleteContact = {
    tags: ['Contacts'],
    description: 'Delete a contact',
    operationId: 'deleteContact',
    security: security, // Include security here
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'Contact ID',
        required: true,
        type: 'string',
      },
    ],
    responses: {
      '200': {
        description: 'Contact deleted successfully!',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Contact deleted successfully!',
                },
              },
            },
          },
        },
      },
      '500': internalServerError,
    },
  };
  
  export { createContact, createContactBody, deleteContact, getContacts, getContact, updateContactBody, updateContact };
  