const userResponseWithRole = {
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

const userNotFound = {
  description: 'Resource not found',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'User not found',
          },
        },
      },
    },
  },
};

const invalidUserData = {
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

const createUserBody = {
  type: 'object',
  properties: {
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
};

const updateUserBody = {
  type: 'object',
  properties: {
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
};

const security = [
  {
    bearerAuth: [],
  },
];

const createUser = {
  tags: ['Users'],
  description: 'Create a new user in the system',
  operationId: 'createUser',
  security: security, // Include security here
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/createUserBody',
        },
      },
    },
    required: true,
  },
  responses: {
    '201': {
      description: 'User created successfully!',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: userResponseWithRole,
          },
        },
      },
    },
    '500': internalServerError,
  },
};

const getUsers = {
  tags: ['Users'],
  description: 'Retrieve all the users',
  operationId: 'getUsers',
  security: security, // Include security here
  responses: {
    '200': {
      description: 'Users retrieved successfully!',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: userResponseWithRole,
            },
          },
        },
      },
    },
    '500': internalServerError,
  },
};

const getUser = {
  tags: ['Users'],
  description: 'Retrieve one user',
  operationId: 'getUser',
  security: security, // Include security here
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string',
    },
  ],
  responses: {
    '200': {
      description: 'User retrieved successfully!',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: userResponseWithRole,
          },
        },
      },
    },
    '404': userNotFound,
    '500': internalServerError,
  },
};

const updateUser = {
  tags: ['Users'],
  description: 'Update a user',
  operationId: 'updateUser',
  security: security, // Include security here
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string',
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/updateUserBody',
        },
      },
    },
    required: true,
  },
  responses: {
    '200': {
      description: 'User retrieved successfully!',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: userResponseWithRole,
          },
        },
      },
    },
    '404': userNotFound,
    '500': internalServerError,
  },
};

const deleteUser = {
  tags: ['Users'],
  description: 'Delete a user',
  operationId: 'deleteUser',
  security: security, // Include security here
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string',
    },
  ],
  responses: {
    '200': {
      description: 'User deleted successfully!',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'User deleted successfully!',
              },
            },
          },
        },
      },
    },
    '500': internalServerError,
  },
};

export { createUser, createUserBody, deleteUser, getUsers, getUser, updateUserBody, updateUser };