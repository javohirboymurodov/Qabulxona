import React from 'react';
import { Typography, Space } from 'antd';
import * as Icons from '@ant-design/icons';

const { Title } = Typography;

const PanelTitle = ({ icon, title }) => {
  // Dinamik ravishda ikonni olish
  const IconComponent = Icons[icon.replace('fa-', '').replace(/(^\w|\s\w)/g, 
    letter => letter.toUpperCase()) + 'Outlined'];

  return (
    <Title level={4} style={{ marginBottom: 16 }}>
      <Space>
        {IconComponent && <IconComponent />}
        {title}
      </Space>
    </Title>
  );
};

export default PanelTitle;