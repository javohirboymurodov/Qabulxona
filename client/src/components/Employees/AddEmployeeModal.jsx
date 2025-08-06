import React from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Upload, Button, App } from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  BankOutlined, 
  IdcardOutlined,
  UploadOutlined,
  BookOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const AddEmployeeModal = ({ onClose, onSave, initialValues = null }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = React.useState([]);
  const { message } = App.useApp();

  React.useEffect(() => {
    if (initialValues) {
      const formData = {
        ...initialValues,
        dateOfBirth: initialValues.dateOfBirth ? moment(initialValues.dateOfBirth) : null,
        joinedDate: initialValues.joinedDate ? moment(initialValues.joinedDate) : null,
      };
      
      form.setFieldsValue(formData);
      
      // If there's an existing PDF file, show it in the upload list
      if (initialValues.objectivePath) {
        setFileList([{
          uid: '-1',
          name: 'Current PDF',
          status: 'done',
          url: `${import.meta.env.VITE_API_URL}/employees/${initialValues._id}/obektivka`
        }]);
      }
    }
  }, [initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Create FormData
      const formData = new FormData();
      
      // Add basic fields
      Object.keys(values).forEach(key => {
        if (key !== 'obektivka' && values[key] !== undefined && values[key] !== null) {
          if (key === 'dateOfBirth' || key === 'joinedDate') {
            formData.append(key, values[key] ? values[key].format('YYYY-MM-DD') : '');
          } else if (key === 'experience') {
            formData.append(key, String(values[key]));
          } else {
            formData.append(key, values[key]);
          }
        }
      });
      
      // Add PDF file if selected
      if (fileList[0]?.originFileObj) {
        formData.append('obektivka', fileList[0].originFileObj);
      }
      
      // Log the FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      await onSave(formData);
      // Message'larni olib tashladik - faqat App.js da bo'ladi
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      // Faqat validation error uchun message qoldiramiz
      message.error('Форманы тўлдиришда хатолик');
    }
  };

  const beforeUpload = (file) => {
    const isPDF = file.type === 'application/pdf';
    if (!isPDF) {
      message.error('Фақат PDF файл юклаш мумкин!');
      return false;
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('PDF файл ҳажми 10MB дан кичик бўлиши керак!');
      return false;
    }

    return true;
  };

  return (
    <Modal
      title={initialValues ? "Ходим маълумотларини таҳрирлаш" : "Янги ходим қўшиш"}
      open={true}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={initialValues ? "Сақлаш" : "Қўшиш"}
      cancelText="Бекор қилиш"
      width={720}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ 
          experience: 0,
          status: 'none'
        }}
      >
        <Form.Item
          name="name"
          label="Ф.И.О"
          rules={[{ required: true, message: 'Илтимос, ходим исмини киритинг' }]}
        >
          <Input 
            prefix={<UserOutlined />}
            placeholder="Ходим Ф.И.О сини киритинг" 
          />
        </Form.Item>

        <Form.Item
          name="position"
          label="Лавозими"
          rules={[{ required: true, message: 'Илтимос, лавозимни киритинг' }]}
        >
          <Input 
            prefix={<IdcardOutlined />}
            placeholder="Лавозимини киритинг" 
          />
        </Form.Item>

        <Form.Item
          name="department"
          label="Бўлим"
          rules={[{ required: true, message: 'Илтимос, бўлимни танланг' }]}
        >
          <Select
            placeholder="Бўлимни танланг"
            suffixIcon={<BankOutlined />}
          >
            <Option value="IT">Ит Бўлими</Option>
            <Option value="HR">HR Бўлими</Option>
            <Option value="Marketing">Маркетинг Бўлими</Option>
            <Option value="Finance">Молия Бўлими</Option>
            <Option value="Operations">Операциялар Бўлими</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="phone"
          label="Телефон рақами"
          rules={[
            { required: true, message: 'Илтимос, телефон рақамини киритинг' },
            { pattern: /^\+998[0-9]{9}$/, message: 'Нотўғри телефон рақами формати. Масала н: +998901234567' }
          ]}
        >
          <Input 
            prefix={<PhoneOutlined />}
            placeholder="+998901234567" 
          />
        </Form.Item>

        <Form.Item
          name="experience"
          label="Иш стажи (йил)"
          rules={[{ required: true, message: 'Илтимос, иш стажини киритинг' }]}
        >
          <InputNumber 
            min={0} 
            max={50}
            placeholder="Иш стажини киритинг"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="dateOfBirth"
          label="Тўғилган сана"
        >
          <DatePicker 
            style={{ width: '100%' }}
            placeholder="Тўғилган санасини танланг"
            format="DD.MM.YYYY"
          />
        </Form.Item>

        <Form.Item
          name="education"
          label="Маълумоти"
        >
          <Input 
            prefix={<BookOutlined />}
            placeholder="Маълумотини киритинг"
          />
        </Form.Item>

        <Form.Item
          name="joinedDate"
          label="Ишга кирган сана"
        >
          <DatePicker 
            style={{ width: '100%' }}
            placeholder="Ишга кирган санасини танланг"
            format="DD.MM.YYYY"
          />
        </Form.Item>

        <Form.Item
          name="biography"
          label="Қўшимча маълумот"
        >
          <TextArea 
            rows={4}
            placeholder="Қўшимча маълумотларни киритинг"
          />
        </Form.Item>

        <Form.Item
          label="Obektivka (PDF)"
        >
          <Upload
            beforeUpload={beforeUpload}
            maxCount={1}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            accept=".pdf"
            customRequest={({ file, onSuccess }) => {
              setTimeout(() => {
                onSuccess("ok");
              }, 0);
            }}
          >
            <Button icon={<UploadOutlined />}>Файлни танланг</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddEmployeeModal;