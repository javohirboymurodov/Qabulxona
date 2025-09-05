const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qabulxona API',
      version: '1.0.0',
      description: 'Qabulxona tizimi uchun REST API dokumentatsiyasi',
      contact: {
        name: 'Qabulxona Team',
        email: 'admin@qabulxona.uz'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://qabulxona-api.onrender.com',
        description: 'Production server (Render.com)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Employee: {
          type: 'object',
          required: ['name', 'position', 'phone', 'department', 'experience'],
          properties: {
            _id: {
              type: 'string',
              description: 'Xodim ID'
            },
            name: {
              type: 'string',
              description: 'Xodim ismi'
            },
            position: {
              type: 'string',
              description: 'Lavozimi'
            },
            phone: {
              type: 'string',
              description: 'Telefon raqami'
            },
            department: {
              type: 'string',
              description: 'Bo\'lim'
            },
            experience: {
              type: 'number',
              description: 'Ish tajribasi (yil)'
            },
            biography: {
              type: 'string',
              description: 'Qo\'shimcha ma\'lumot'
            },
            objectivePath: {
              type: 'string',
              description: 'Obektivka fayl yo\'li'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Tug\'ilgan sana'
            },
            education: {
              type: 'string',
              description: 'Ma\'lumoti'
            },
            joinedDate: {
              type: 'string',
              format: 'date',
              description: 'Ishga qo\'shilgan sana'
            },
            status: {
              type: 'string',
              enum: ['waiting', 'present', 'absent'],
              description: 'Xodim holati'
            },
            telegramId: {
              type: 'string',
              description: 'Telegram ID'
            },
            isVerified: {
              type: 'boolean',
              description: 'Telegram orqali tasdiqlangan'
            }
          }
        },
        Admin: {
          type: 'object',
          required: ['username', 'password', 'fullName', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'Admin ID'
            },
            username: {
              type: 'string',
              description: 'Foydalanuvchi nomi'
            },
            fullName: {
              type: 'string',
              description: 'To\'liq ismi'
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin'],
              description: 'Admin roli'
            },
            isActive: {
              type: 'boolean',
              description: 'Faol holati'
            }
          }
        },
        Meeting: {
          type: 'object',
          required: ['name', 'date', 'time', 'participants'],
          properties: {
            _id: {
              type: 'string',
              description: 'Yig\'ilish ID'
            },
            name: {
              type: 'string',
              description: 'Yig\'ilish nomi'
            },
            description: {
              type: 'string',
              description: 'Yig\'ilish tavsifi'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Yig\'ilish sanasi'
            },
            time: {
              type: 'string',
              description: 'Yig\'ilish vaqti (HH:mm)'
            },
            location: {
              type: 'string',
              description: 'Yig\'ilish joyi'
            },
            participants: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Qatnashuvchilar ID lari'
            }
          }
        },
        ReceptionHistory: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Qabul tarixi ID'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Qabul sanasi'
            },
            employees: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ReceptionEmployee'
              },
              description: 'Qabulga kelgan xodimlar'
            }
          }
        },
        ReceptionEmployee: {
          type: 'object',
          properties: {
            employeeId: {
              type: 'string',
              description: 'Xodim ID'
            },
            name: {
              type: 'string',
              description: 'Xodim ismi'
            },
            position: {
              type: 'string',
              description: 'Lavozimi'
            },
            department: {
              type: 'string',
              description: 'Bo\'lim'
            },
            phone: {
              type: 'string',
              description: 'Telefon raqami'
            },
            scheduledTime: {
              type: 'string',
              description: 'Belgilangan vaqt (HH:mm)'
            },
            status: {
              type: 'string',
              enum: ['waiting', 'present', 'absent'],
              description: 'Qabul holati'
            },
            arrivedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Kelgan vaqt'
            },
            task: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Topshiriq tavsifi'
                },
                deadline: {
                  type: 'number',
                  description: 'Muddat (kun)'
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'completed', 'overdue'],
                  description: 'Topshiriq holati'
                }
              }
            }
          }
        },
        Schedule: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Jadval ID'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Jadval sanasi'
            },
            tasks: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Task'
              },
              description: 'Vazifalar'
            },
            notes: {
              type: 'string',
              description: 'Eslatmalar'
            }
          }
        },
        Task: {
          type: 'object',
          required: ['title', 'description', 'startTime', 'endTime'],
          properties: {
            _id: {
              type: 'string',
              description: 'Vazifa ID'
            },
            title: {
              type: 'string',
              description: 'Vazifa sarlavhasi'
            },
            description: {
              type: 'string',
              description: 'Vazifa tavsifi'
            },
            startTime: {
              type: 'string',
              description: 'Boshlanish vaqti (HH:mm)'
            },
            endTime: {
              type: 'string',
              description: 'Tugash vaqti (HH:mm)'
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
              description: 'Vazifa prioriteti'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'completed', 'cancelled'],
              description: 'Vazifa holati'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Muvaffaqiyatli bajarilganligi'
            },
            message: {
              type: 'string',
              description: 'Xatolik xabari'
            },
            error: {
              type: 'string',
              description: 'Xatolik tafsilotlari'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Muvaffaqiyatli bajarilganligi'
            },
            message: {
              type: 'string',
              description: 'Muvaffaqiyat xabari'
            },
            data: {
              type: 'object',
              description: 'Qaytarilgan ma\'lumot'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [path.join(__dirname, '../routes/*.js')]
};

const specs = swaggerJsdoc(options);
module.exports = specs;
