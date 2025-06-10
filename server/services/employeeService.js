const Employee = require('../models/Employee');
const fs = require('fs');
const path = require('path');
const { validateEmployee } = require('../utils/helpers');

class EmployeeService {
  // Barcha xodimlarni olish
  async getAllEmployees() {
    return await Employee.find().sort('-createdAt');
  }

  // Yangi xodim qo'shish
  async createEmployee(employeeData, file) {
    try {
      // Ma'lumotlarni tahlil qilish
      const parsedData = this._parseEmployeeData(employeeData);
      
      // Tekshirish
      const errors = validateEmployee(parsedData);
      if (errors.length > 0) {
        if (file) this._deleteFile(file.filename);
        throw new Error(errors.join(', '));
      }

      // Faylni boshqarish
      if (file) {
        parsedData.objectivePath = file.filename;
      }

      // Telefon raqamini tekshirish
      const existingEmployee = await Employee.findOne({ phone: parsedData.phone });
      if (existingEmployee) {
        if (file) this._deleteFile(file.filename);
        throw new Error('Bu telefon raqami boshqa xodim tomonidan ro\'yxatdan o\'tgan');
      }

      const employee = new Employee(parsedData);
      return await employee.save();
    } catch (error) {
      if (file) this._deleteFile(file.filename);
      throw error;
    }
  }

  // Xodimni ID bo'yicha olish
  async getEmployeeById(id) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Ходим топилмади');
    }
    return employee;
  }

  // Xodim ma'lumotlarini yangilash
  async updateEmployee(id, employeeData, file) {
    try {
      // Ma'lumotlarni tahlil qilish
      const parsedData = this._parseEmployeeData(employeeData);

      // Fayl yangilanishini boshqarish
      if (file) {
        const oldEmployee = await Employee.findById(id);
        if (oldEmployee?.objectivePath) {
          this._deleteFile(oldEmployee.objectivePath);
        }
        parsedData.objectivePath = file.filename;
      }

      // Telefon raqamini tekshirish
      if (parsedData.phone) {
        const existingEmployee = await Employee.findOne({ phone: parsedData.phone });
        if (existingEmployee && existingEmployee._id.toString() !== id) {
          if (file) this._deleteFile(file.filename);
          throw new Error('Бу телефон рақами бошқа ходим тўмонидан рўйхатдан ўтган');
        }
      }

      const employee = await Employee.findByIdAndUpdate(
        id,
        parsedData,
        { new: true, runValidators: true }
      );

      if (!employee) {
        if (file) this._deleteFile(file.filename);
        throw new Error('Ходим топилмади');
      }

      return employee;
    } catch (error) {
      if (file) this._deleteFile(file.filename);
      throw error;
    }
  }

  // Xodimni o'chirish
  async deleteEmployee(id) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Ходим топилмади');
    }

    if (employee.objectivePath) {
      this._deleteFile(employee.objectivePath);
    }

    await employee.deleteOne();
    return { message: 'Ходим муваффақиятли ўчирилди' };
  }

  // Xodim holatini yangilash
  async updateEmployeeStatus(id, status) {
    if (!['present', 'absent', 'waiting', 'none'].includes(status)) {
      throw new Error('Noto\'g\'ri holat qiymati');
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!employee) {
      throw new Error('Ходим топилмади');
    }

    return employee;
  }

  // Xodimni qidirish
  async searchEmployees(query) {
    const searchRegex = new RegExp(query, 'i');
    return await Employee.find({
      $or: [
        { name: searchRegex },
        { position: searchRegex },
        { department: searchRegex },
        { phone: searchRegex }
      ]
    });
  }

  // Maxfiy yordamchi metodlar
  _parseEmployeeData(data) {
    return {
      ...data,
      experience: data.experience ? Number(data.experience) : 0,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      joinedDate: data.joinedDate ? new Date(data.joinedDate) : undefined
    };
  }

  _deleteFile(filename) {
    const filePath = path.join(__dirname, '..', 'uploadObektivka', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = new EmployeeService();
