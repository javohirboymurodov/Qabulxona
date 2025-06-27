import React from 'react';
import { Descriptions, Space, Tag, Typography, Button, message } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  BankOutlined,
  IdcardOutlined,
  CalendarOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Text } = Typography;

const EmployeeDetails = ({ employee }) => {
  const handleViewPDF = () => {
    if (employee.objectivePath) {
      const pdfUrl = `${import.meta.env.VITE_API_URL}/employees/${employee._id}/obektivka`;
      window.open(pdfUrl, '_blank');
    } else {
      message.info('Ушбу ходим учун PDF файл мавжуд эмас');
    }
  };

  const handleDownloadPDF = () => {
    if (employee.objectivePath) {
      const pdfUrl = `${import.meta.env.VITE_API_URL}/employees/${employee._id}/obektivka`;
      fetch(pdfUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${employee.name}-obektivka.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        })
        .catch(() => {
          message.error('PDF файлни юклаб олишда хатолик юз берди');
        });
    } else {
      message.info('Ушбу ходим учун PDF файл мавжуд эмас');
    }
  };

  return (
    <Descriptions bordered column={1}>
      {/* Asosiy ma'lumotlar */}
      <Descriptions.Item label={
        <Space>
          <UserOutlined />
          <span>Ф.И.О</span>  
        </Space>
      }>
        {employee.name}
      </Descriptions.Item>

      <Descriptions.Item label={
        <Space>
          <IdcardOutlined />
          <span>Лавозими</span>
        </Space>
      }>
        <Tag color="blue">{employee.position}</Tag>
      </Descriptions.Item>

      <Descriptions.Item label={
        <Space>
          <BankOutlined />
          <span>Бўлими</span>
        </Space>
      }>
        {employee.department}
      </Descriptions.Item>

      <Descriptions.Item label={
        <Space>
          <PhoneOutlined />
          <span>Телефон рақами</span>
        </Space>
      }>
        {employee.phone}
      </Descriptions.Item>

      <Descriptions.Item label={
        <Space>
          <ClockCircleOutlined />
          <span>Иш стажи</span>
        </Space>
      }>
        {employee.experience} йил
      </Descriptions.Item>

      {/* Qo'shimcha ma'lumotlar */}
      {employee.dateOfBirth && (
        <Descriptions.Item label={
          <Space>
            <CalendarOutlined />
            <span>Туғилган санаси</span>
          </Space>
        }>
          {moment(employee.dateOfBirth).format('DD.MM.YYYY')}
        </Descriptions.Item>
      )}

      {employee.education && (
        <Descriptions.Item label={
          <Space>
            <BookOutlined />
            <span>Маълумоти</span>
          </Space>
        }>
          {employee.education}
        </Descriptions.Item>
      )}

      {employee.joinedDate && (
        <Descriptions.Item label={
          <Space>
            <CalendarOutlined />
            <span>Ишга кирган санаси</span>
          </Space>
        }>
          {moment(employee.joinedDate).format('DD.MM.YYYY')}
        </Descriptions.Item>
      )}

      {employee.biography && (
        <Descriptions.Item label="Қўшимча маълумот">
          <Text>{employee.biography}</Text>
        </Descriptions.Item>
      )}

      {/* Obektivka PDF */}
      {employee.objectivePath && (
        <Descriptions.Item label={
          <Space>
            <FilePdfOutlined />
            <span>Объективка</span>
          </Space>
        }>
          <Space>
            <Button 
              type="primary" 
              icon={<FilePdfOutlined />} 
              onClick={handleViewPDF}
            >
              ПДФ ни кўриш
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadPDF}
            >
              Юклаб олиш
            </Button>
          </Space>
        </Descriptions.Item>
      )}
    </Descriptions>
  );
};

export default EmployeeDetails;