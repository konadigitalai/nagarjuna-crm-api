import { createUser, createUserBody, deleteUser, getUser, getUsers, updateUser, updateUserBody } from './users';
import { createContact, createContactBody, deleteContact, getContacts, getContact, updateContactBody, updateContact } from './contacts';

const apiDocumentation = {
  openapi: '3.0.1',
  info: {
    version: '1.3.0',
    title: 'Nagarjuna Steels - Documentation',
    description: 'Nagarjuna Steels Swaggers',
    termsOfService: 'https://nagarjuna-steels.com/terms',
    contact: {
      name: 'Nagarjuna Steels',
      email: 'dev@nagarjuna-steels.com',
      url: 'https://nagarjuna-steels.com',
    },
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Local Server',
    },
    {
      url: 'https://api.nagarjuna-steels.com',
      description: 'Production Server',
    },
  ],
  tags: [
    {
      name: 'Users',
    },
  ],
  paths: {
    '/users': {
      post: createUser,
      get: getUsers,
    },
    '/users/{id}': {
      delete: deleteUser,
      get: getUser,
      put: updateUser,
    },
    '/contacts': {
      post: createContact,
      get: getContacts,
    },
    '/contacts/{id}': {
      delete: deleteContact,
      get: getContact,
      put: updateContact,
    }    
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      createUserBody,
      updateUserBody,
      createContactBody,
      updateContactBody
    },
  },
};

export { apiDocumentation };