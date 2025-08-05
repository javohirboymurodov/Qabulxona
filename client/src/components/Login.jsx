import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [messageState, setMessageState] = useState(null); 
  const navigate = useNavigate();
  const { message } = App.useApp();

  useEffect(() => {
    if (messageState) {
      if (messageState.type === 'success') {
        message.success(messageState.content);
      } else {
        message.error(messageState.content);
      }
      setMessageState(null);
    }
  }, [messageState, message]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await onLogin(values);

      if (result && result.success) {
        setMessageState({ type: 'success', content: 'Муваффақиятли кирдингиз!' });
        navigate('/', { replace: true });
      } else {
        setMessageState({ type: 'error', content: result?.message || 'Логин ёки парол нотўғри' });
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Логин ёки парол нотўғри';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessageState({ type: 'error', content: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Тизимга кириш</Title>
        </div>

        <Form
          onFinish={handleSubmit}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{
              required: true,
              message: 'Фойдаланувчи номини киритинг!'
            }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Фойдаланувчи номи"
              size="large"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{
              required: true,
              message: 'Паролни киритинг!'
            }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Парол"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Кириш
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
