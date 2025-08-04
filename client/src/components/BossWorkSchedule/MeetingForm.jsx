import React from 'react';
import { Form, Input, TimePicker, Button, Card, List, Tag, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const MeetingForm = ({ meetings, onAddMeeting, onRemoveMeeting }) => {
  const [form] = Form.useForm();

  const handleAddMeeting = () => {
    form.validateFields().then(values => {
      const newMeeting = {
        title: values.meetingTitle,
        description: values.meetingDescription,
        location: values.meetingLocation,
        time: values.meetingTime.format('HH:mm'),
        participants: values.meetingParticipants,
        status: 'scheduled'
      };
      onAddMeeting(newMeeting);
      form.resetFields();
    }).catch(error => {
      console.error('Form validation error:', error);
    });
  };

  return (
    <div>
      <Card title="Янги мажлис қўшиш" size="small" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="meetingTitle"
            label="Мажлис номи"
            rules={[{ required: true, message: 'Мажлис номини киритинг' }]}
          >
            <Input placeholder="Мажлис номини киритинг" />
          </Form.Item>

          <Form.Item
            name="meetingTime"
            label="Бошланиш вақти"
            rules={[{ required: true, message: 'Бошланиш вақтини танланг' }]}
          >
            <TimePicker
              format="HH:mm"
              style={{ width: '100%' }}
              placeholder="Бошланиш вақтини танланг"
            />
          </Form.Item>

          <Form.Item name="meetingLocation" label="Ўтказиладиган жой">
            <Input
              placeholder="Мажлис жойини киритинг"
              prefix={<EnvironmentOutlined />}
            />
          </Form.Item>

          <Form.Item name="meetingParticipants" label="Иштирокчилар">
            <Input placeholder="Иштирокчилар рўйхати" />
          </Form.Item>

          <Form.Item name="meetingDescription" label="Тавсиф">
            <TextArea
              rows={3}
              placeholder="Мажлис тавсифини киритинг"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddMeeting}
            block
            size="large"
          >
            Мажлис қўшиш
          </Button>
        </Form>
      </Card>

      <Divider orientation="left">
        Режалаштирилган мажлислар ({meetings.length})
      </Divider>

      {meetings.length > 0 ? (
        <List
          dataSource={meetings}
          renderItem={(meeting) => (
            <List.Item style={{ padding: '12px 0' }}>
              <Card
                size="small"
                style={{ width: '100%' }}
                styles={{
                  body: { padding: '12px 16px' }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Vaqt va tur */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8
                    }}>
                      <TeamOutlined style={{ color: '#faad14' }} />
                      <strong style={{ color: '#faad14' }}>
                        {meeting.time}
                      </strong>
                      <Tag color="orange">Мажлис</Tag>
                    </div>

                    {/* Sarlavha */}
                    <div style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      marginBottom: 4,
                      color: '#262626'
                    }}>
                      {meeting.title}
                    </div>

                    {/* Joy */}
                    {meeting.location && (
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <EnvironmentOutlined style={{ fontSize: '12px' }} />
                        {meeting.location}
                      </div>
                    )}

                    {/* Ishtirokchilar */}
                    {meeting.participants && (
                      <div style={{
                        fontSize: '12px',
                        color: '#999',
                        marginBottom: 4
                      }}>
                        👥 Иштирокчилар: {meeting.participants}
                      </div>
                    )}

                    {/* Tavsif */}
                    {meeting.description && (
                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        lineHeight: 1.4
                      }}>
                        {meeting.description}
                      </div>
                    )}
                  </div>

                  {/* O'chirish tugmasi */}
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveMeeting(meeting.id)}
                    style={{ marginLeft: 8 }}
                  />
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#999',
          backgroundColor: '#fafafa',
          borderRadius: '6px'
        }}>
          Ҳозирча мажлислар режалаштирилмаган
        </div>
      )}
    </div>
  );
};

export default MeetingForm;