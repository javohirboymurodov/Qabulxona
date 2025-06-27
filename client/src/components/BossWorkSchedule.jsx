// React and utils
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

// Date handling
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

// Ant Design components and locale
import { 
  Card, 
  Calendar, 
  Button, 
  Modal, 
  Form, 
  Input, 
  TimePicker, 
  Space, 
  Table, 
  Empty, 
  Row, 
  Col 
} from "antd";
import uzUZ from "antd/locale/uz_UZ";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

// API services
import { getScheduleByDate, createSchedule, updateSchedule } from "../services/api";

// Initialize dayjs plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const BossWorkSchedule = ({ showMessage }) => {
  // First verify showMessage prop exists
  if (!showMessage || typeof showMessage.error !== 'function') {
    console.error('showMessage prop is required with error function');
    return null;
  }

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [tasks, setTasks] = useState([{ id: 1 }]);

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate]);

  const isDateEditable = (date) => {
    const selectedDay = dayjs(date).startOf('day');
    const today = dayjs().startOf('day');
    return selectedDay.isSameOrAfter(today);
  };

  const fetchSchedule = async (date) => {
    try {
      setLoading(true);
      const formattedDate = dayjs(date).format("YYYY-MM-DD");
      const response = await getScheduleByDate(formattedDate);
      
      if (response.data?.success) {
        setScheduleData(response.data.data);
      } else {
        setScheduleData(null);
      }
    } catch (error) {
      console.error("Jadval yuklashda xatolik:", error);
      showMessage.error("Жадвал маълумотларини юклашда хатолик юз берди");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setTasks([...tasks, { id: tasks.length + 1 }]);
  };

  const handleRemoveTask = (taskId) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((task) => task.id !== taskId));
    }
  };

  const handleSaveSchedule = async (values) => {
    try {
      // Form validation
      if (!values?.tasks?.length) {
        showMessage.error("Вазифалар киритилмаган");
        return;
      }

      // Date validation
      const scheduleDate = dayjs(selectedDate);
      const today = dayjs().startOf("day");

      if (scheduleDate.isBefore(today)) {
        showMessage.error("Ўтган сана учун иш режа киритиб бўлмайди");
        return;
      }

      // Process tasks
      const formattedTasks = [];
      for (const task of values.tasks) {
        if (!task?.timeRange?.[0] || !task?.timeRange?.[1] || !task?.title || !task?.description) {
          showMessage.error("Барча майдонларни тўлдиринг");
          return;
        }

        formattedTasks.push({
          title: task.title,
          description: task.description,
          startTime: task.timeRange[0].format("HH:mm"),
          endTime: task.timeRange[1].format("HH:mm"),
        });
      }

      const schedulePayload = {
        date: selectedDate.format("YYYY-MM-DD"),
        tasks: formattedTasks,
      };

      // Save or update
      if (scheduleData) {
        await updateSchedule(selectedDate.format("YYYY-MM-DD"), schedulePayload);
        showMessage.success("Жадвал янгиланди");
      } else {
        await createSchedule(selectedDate.format("YYYY-MM-DD"), schedulePayload);
        showMessage.success("Жадвал сақланди");
      }

      // Reset form state
      setIsModalVisible(false);
      form.resetFields();
      setTasks([{ id: 1 }]);
      fetchSchedule(selectedDate);

    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Иш режани сақлашда хатолик юз берди";
      
      if (showMessage && typeof showMessage.error === 'function') {
        showMessage.error(errorMessage);
      } else {
        console.error('Error:', errorMessage);
      }
    }
  };

  const columns = [
    {
      title: "Вақт",
      dataIndex: "time",
      width: 150,
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: "Вазифа",
      dataIndex: "title",
    },
    {
      title: "Тавсиф",
      dataIndex: "description",
    },
  ];

  const handleModalOpen = () => {
    if (scheduleData) {
      form.setFieldsValue({
        tasks: scheduleData.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          timeRange: [
            dayjs(task.startTime, "HH:mm"),
            dayjs(task.endTime, "HH:mm"),
          ],
        })),
      });
      setTasks(scheduleData.tasks.map((_, index) => ({ id: index + 1 })));
    } else {
      form.resetFields();
      setTasks([{ id: 1 }]);
    }
    setIsModalVisible(true);
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Card>
          <Calendar
            fullscreen={false}
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </Card>
      </Col>
      <Col span={16}>
        <Card
          title={selectedDate.format("DD MMMM YYYY")}
          extra={
            isDateEditable(selectedDate) && (
              <Button
                type="primary"
                icon={scheduleData ? <EditOutlined /> : <PlusOutlined />}
                onClick={handleModalOpen}
              >
                {scheduleData ? "Таҳрирлаш" : "Жадвал қўшиш"}
              </Button>
            )
          }
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              Юкланмоқда
            </div>
          ) : scheduleData?.tasks?.length > 0 ? (
            <Table
              dataSource={scheduleData.tasks}
              columns={columns}
              pagination={false}
              rowKey={(record) => record._id}
            />
          ) : (
            <Empty 
              description={
                isDateEditable(selectedDate) 
                  ? "Бу кун учун жадвал киритилмаган" 
                  : "Бу кун учун иш режа мавжуд эмас"
              }
            />
          )}
        </Card>
      </Col>

      <Modal
        title={`${selectedDate.format("DD.MM.YYYY")} кун учун иш режаси`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setTasks([{ id: 1 }]);
        }}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleSaveSchedule} layout="vertical">
          {tasks.map((task, index) => (
            <Card
              key={`task-${task.id}`} // index ishlatish shart emas, task.id o'zi unique
              size="small"
              title={`Вазифа ${task.id}`}
              extra={
                tasks.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveTask(task.id)}
                  />
                )
              }
              style={{ marginBottom: 16 }}
            >
              <Form.Item
                name={["tasks", task.id - 1, "title"]}
                rules={[{ required: true, message: "Вазифа номини киритинг" }]}
              >
                <Input placeholder="Вазифа номи" />
              </Form.Item>

              <Form.Item
                name={["tasks", task.id - 1, "timeRange"]}
                rules={[{ required: true, message: "Вақт оралиғини танланг" }]}
              >
                <TimePicker.RangePicker
                  format="HH:mm"
                  locale={uzUZ}
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                name={["tasks", task.id - 1, "description"]}
                rules={[
                  { required: true, message: "Вазифа тавсифини киритинг" },
                ]}
              >
                <Input.TextArea placeholder="Вазифа тавсифи" rows={2} />
              </Form.Item>
            </Card>
          ))}

          <Button
            type="dashed"
            onClick={handleAddTask}
            style={{ width: "100%", marginBottom: 16 }}
            icon={<PlusOutlined />}
          >
            Янги вазифа қўшиш
          </Button>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setTasks([{ id: 1 }]);
                }}
              >
                Бекор қилиш
              </Button>
              <Button type="primary" htmlType="submit">
                Сақлаш
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

// Add prop types outside the component
BossWorkSchedule.propTypes = {
  showMessage: PropTypes.shape({
    success: PropTypes.func.isRequired,
    error: PropTypes.func.isRequired,
    warning: PropTypes.func.isRequired,
    info: PropTypes.func.isRequired
  }).isRequired
};

export default BossWorkSchedule;
