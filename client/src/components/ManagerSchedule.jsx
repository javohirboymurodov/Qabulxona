import React, { useState, useEffect } from "react";
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
  message,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import locale from "antd/es/date-picker/locale/uz_UZ";
import {
  getScheduleByDate,
  createSchedule,
  updateSchedule,
} from "../services/api";

const ManagerSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [tasks, setTasks] = useState([{ id: 1 }]);

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate]);

  const fetchSchedule = async (date) => {
    try {
      setLoading(true);
      const response = await getScheduleByDate(date.format("YYYY-MM-DD"));
      setScheduleData(response.data);
    } catch (error) {
      console.error("Jadval yuklashda xatolik:", error);
      message.error("Jadval ma'lumotlarini yuklashda xatolik");
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
      if (!values.tasks) {
        throw new Error("Vazifalar kiritilmagan");
      }

      const formattedTasks = values.tasks.map((task, index) => ({
        title: task.title,
        description: task.description,
        startTime: task.timeRange[0].format("HH:mm"),
        endTime: task.timeRange[1].format("HH:mm"),
      }));

      const schedulePayload = {
        date: selectedDate.format("YYYY-MM-DD"),
        tasks: formattedTasks,
      };

      if (scheduleData) {
        await updateSchedule(
          selectedDate.format("YYYY-MM-DD"),
          schedulePayload
        );
        message.success("Jadval yangilandi");
      } else {
        await createSchedule(
          selectedDate.format("YYYY-MM-DD"),
          schedulePayload
        );
        message.success("Jadval saqlandi");
      }

      setIsModalVisible(false);
      form.resetFields();
      setTasks([{ id: 1 }]);
      fetchSchedule(selectedDate);
    } catch (error) {
      console.error(
        "Jadvalni saqlashda xatolik:",
        error?.response?.data || error
      );
      message.error(
        error?.response?.data?.message || "Jadvalni saqlashda xatolik yuz berdi"
      );
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
            onSelect={(date) => setSelectedDate(date)}
          />
        </Card>
      </Col>
      <Col span={16}>
        <Card
          title={selectedDate.format("DD MMMM YYYY")}
          extra={
            <Button
              type="primary"
              icon={scheduleData ? <EditOutlined /> : <PlusOutlined />}
              onClick={handleModalOpen}
            >
              {scheduleData ? "Таҳрирлаш" : "Жадвал қўшиш"}
            </Button>
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
              rowKey={(record) =>
                `${
                  record._id ||
                  `${record.startTime}-${record.endTime}-${Math.random()}`
                }`
              }
            />
          ) : (
            <Empty description="Бу кун учун жадвал киритилмаган" />
          )}
        </Card>
      </Col>

      <Modal
        title={`${selectedDate.format("DD.MM.YYYY")} кун учун жадвал`}
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
                  locale={locale}
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

export default ManagerSchedule;
