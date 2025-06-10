import React from "react";
import { Layout, Row, Col, Typography, Space, Divider } from "antd";
import {
  GlobalOutlined,
  CreditCardOutlined,
  BankOutlined,
  CarOutlined,
  HomeOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";

const { Footer } = Layout;
const { Link } = Typography;

const AppFooter = () => {
  return (
    <Footer
      style={{
        background: "#001529",
        padding: "16px 0",
        position: "fixed",
        bottom: 0,
        width: "100%",
        zIndex: 1000,
      }}
    >
      <Row justify="center">
        <Col>
          <Space
            split={
              <Divider type="vertical" style={{ borderColor: "#ffffff40" }} />
            }
            size="large"
          >
            {/* Transport */}
            <Space size="middle" style={{ color: "white" }}>
              <Link
                href="https://eticket.railway.uz/uz/home"
                target="_blank"
                style={{ color: "white" }}
              >
                <GlobalOutlined /> Темир йўл билети
              </Link>
            </Space>
            <Space>
              <Link
                href="https://uzairways.com"
                target="_blank"
                style={{ color: "white" }}
              >
                <GlobalOutlined /> Uzbekistan Airways
              </Link>
            </Space>
            <Space>
              <Link
                href="https://avtovokzal.uz"
                target="_blank"
                style={{ color: "white" }}
              >
                <CarOutlined /> Автовокзал
              </Link>
            </Space>

            {/* Hotels & Restaurants */}
            <Space size="middle" style={{ color: "white" }}>
              <Link
                href="https://mybooking.uz/uz"
                target="_blank"
                style={{ color: "white" }}
              >
                <HomeOutlined /> Меҳмонхоналар
              </Link>
            </Space>
            <Space>
              <Link
                href="https://www.afisha.uz/uz/catalog/restaurants"
                target="_blank"
                style={{ color: "white" }}
              >
                <ShoppingOutlined /> Ресторанлар
              </Link>
            </Space>

            {/* Banks & Payment */}
            <Space size="middle" style={{ color: "white" }}>
              <Link
                href="https://bronla.uz"
                target="_blank"
                style={{ color: "white" }}
              >
                <BankOutlined /> Дам олиш жойлари
              </Link>
            </Space>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default AppFooter;
