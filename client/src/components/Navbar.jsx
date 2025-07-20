import React from 'react';
import { Layout, Menu, Avatar, Space, Dropdown } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  ScheduleOutlined,
  CaretDownOutlined,
  LogoutOutlined,
  HistoryOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';

const { Header } = Layout;

const Navbar = ({ onViewChange, activeView, onLogout, admin }) => {
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Бош Сахифа'
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: 'Раҳбар ходимлар'
    },
    {
      key: 'meetings',
      icon: <CalendarOutlined />,
      label: 'Мажлислар Тарихи'
    },
    {
      key: 'boss-schedule',
      icon: <ScheduleOutlined />,
      label: 'Раҳбар Иш Графиги'
    },
    {
      key: 'reception-history',
      icon: <HistoryOutlined />,
      label: 'Қабул Тарихи'
    }
  ];

  // Faqat superadmin uchun Adminlar menyusini qo'shamiz
  if (admin && admin.role === 'super_admin') {
    menuItems.push({
      key: 'admins',
      icon: <UsergroupAddOutlined />,
      label: 'Фойдаланувчилар'
    });
  }

  const handleLogout = () => {
    // API logout o'rniga localStorage ni tozalash
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Parent component dagi logout funksiyasini chaqirish
    if (onLogout) {
      onLogout();
    }
  };

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
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogout
      }
    ]
  };

  const handleMenuClick = (e) => {
    onViewChange(e.key);
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'superadmin':
        return 'Супер Администратор';
      case 'publisher':
        return 'Нашриётчи';
      default:
        return 'Админ';
    }
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
          <span>{admin?.fullName || getRoleText(admin?.role)}</span>
          <CaretDownOutlined />
        </Space>
      </Dropdown>
    </Header>
  );
};

export default Navbar;