import React from 'react';
import { Layout, Menu, Avatar, Space, Dropdown } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  ScheduleOutlined,
  CaretDownOutlined
} from '@ant-design/icons';

const { Header } = Layout;

const Navbar = ({ onViewChange, activeView }) => {
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Бош Сахифа'
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: 'Ходимлар Базаси'
    },
    {
      key: 'meetings',
      icon: <CalendarOutlined />,
      label: 'Йиғилишлар'
    },
    {
      key: 'boss-meetings',
      icon: <UserOutlined />,
      label: 'Раҳбар Қабули'
    },
    {
      key: 'boss-schedule',
      icon: <ScheduleOutlined />,
      label: 'Раҳбар Иш Графиги'
    }
  ];

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: 'Профил',
        icon: <UserOutlined />
      },
      {
        key: 'logout',
        label: 'Чиқиш',
        danger: true
      }
    ]
  };

  const handleMenuClick = (e) => {
    onViewChange(e.key);
  };

  return (
    <Header 
      style={{ 
        padding: '0 24px',
        background: 'linear-gradient(135deg, #005BAE, #003a75)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        width: '100%',
        top: 0,
        zIndex: 1000
      }}
    >
      <div className="logo" style={{ color: 'white', fontSize: '24px' }}>
        <Space>
          <CalendarOutlined />
          <span>Қабулхона</span>
        </Space>
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[activeView]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'white'
        }}
        theme="dark"
      />

      <Dropdown
        menu={userMenu}
        trigger={['click']}
        placement="bottomRight"
      >
        <Space style={{ cursor: 'pointer', color: 'white' }}>
          <Avatar icon={<UserOutlined />} />
          <span>Админ</span>
          <CaretDownOutlined />
        </Space>
      </Dropdown>
    </Header>
  );
};

export default Navbar;