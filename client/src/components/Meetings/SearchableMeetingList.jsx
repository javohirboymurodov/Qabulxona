import React, { useState } from 'react';
import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const SearchableMeetingList = ({ 
  onChange,
  placeholder = "Мажлисларни қидириш",
  meetingOptions = [],
  mode,
  value,
  ...props
}) => {
  const [searchText, setSearchText] = useState('');
  
  const handleSearch = (value) => {
    setSearchText(value);
    const searchLower = value.toLowerCase().trim();
    if (!searchLower) {
      onChange(meetingOptions);
      return;
    }

    const filtered = meetingOptions.filter(meeting =>
      (meeting.name && meeting.name.toLowerCase().includes(searchLower)) ||
      (meeting.date && meeting.date.toLowerCase().includes(searchLower)) ||
      (meeting.time && meeting.time.toLowerCase().includes(searchLower)) ||
      (meeting.location && meeting.location.toLowerCase().includes(searchLower))
    );
    
    onChange(filtered);
  };
  // If mode is 'multiple', use Select for choosing multiple meetings
  if (mode === 'multiple') {
    return (
      <Select
        {...props}
        mode="multiple"
        placeholder={placeholder}
        showSearch
        onSearch={handleSearch}
        filterOption={false}
        style={{ width: '100%' }}
        options={meetingOptions.map(meeting => ({
          label: `${meeting.name} - ${meeting.date} ${meeting.time}`,
          value: meeting._id
        }))}
      />
    );
  }

  // Default case: use Input for searching
  return (
    <Input
      value={searchText}
      prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
      placeholder={placeholder}
      allowClear
      onChange={(e) => handleSearch(e.target.value)}
      style={{ 
        width: '100%',
        marginBottom: '16px'
      }}
    />
  );
};

export default SearchableMeetingList;
