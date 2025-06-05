import React, { useState } from 'react';
import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const SearchableEmployeeList = ({ 
  onChange,
  placeholder = "Xodimlarni qidirish",
  employeeOptions = [],
  mode,
  value,
  ...props
}) => {
  const [searchText, setSearchText] = useState('');
  
  const handleSearch = (value) => {
    setSearchText(value);
    const searchLower = value.toLowerCase().trim();
    if (!searchLower) {
      onChange(employeeOptions);
      return;
    }
    
    const filtered = employeeOptions.filter(emp => 
      (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
      (emp.position && emp.position.toLowerCase().includes(searchLower)) ||
      (emp.department && emp.department.toLowerCase().includes(searchLower)) ||
      (emp.phone && emp.phone.toLowerCase().includes(searchLower))
    );
    
    onChange(filtered);
  };
  // If mode is 'multiple', use Select for choosing multiple employees
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
        options={employeeOptions.map(emp => ({
          label: `${emp.name} - ${emp.position}`,
          value: emp._id
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

export default SearchableEmployeeList;
