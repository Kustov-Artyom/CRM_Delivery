import { useState } from "react";
import {
  App as AntApp,
  Button,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
} from "antd";
import { useNavigate, Outlet } from "react-router-dom";
import AppShell from "../../shell/AppShell.jsx";
import { getOrderFormValues, withOrderAddresses } from "./orderUtils.js";
import "../../App.css";

const initialOrders = [
  {
    id: "10428",
    client: "Flora Studio",
    route: "ул. Мира, 8 → Невский, 41",
    executor: "Иван Петров",
    status: "В пути",
    amount: 450,
    period: "Сегодня",
  },
  {
    id: "10427",
    client: "Бутик Rêve",
    route: "Пушкинская, 13 → Садовая, 9",
    executor: "Анна Морозова",
    status: "На заборе",
    amount: 350,
    period: "Сегодня",
  },
  {
    id: "10426",
    client: "Цветы №1",
    route: "Литейный, 12 → Чехова, 3",
    executor: "Не назначен",
    status: "Ожидает",
    amount: 400,
    period: "Сегодня",
  },
  {
    id: "10425",
    client: "Арт-магазин",
    route: "Малая Морская, 5 → Казанская, 8",
    executor: "Дмитрий Власов",
    status: "Проблема",
    amount: 550,
    period: "Сегодня",
  },
  {
    id: "10424",
    client: "Flora Studio",
    route: "Марата, 20 → Восстания, 1",
    executor: "Егор Смирнов",
    status: "В пути",
    amount: 350,
    period: "Вчера",
  },
];

const statuses = ["В пути", "На заборе", "Ожидает", "Проблема", "Доставлен"];
const executors = [
  "Не назначен",
  "Иван Петров",
  "Анна Морозова",
  "Дмитрий Власов",
  "Егор Смирнов",
];

export function Status({ value }) {
  const statusClass =
    value === "На заборе"
      ? "pickup"
      : value === "Ожидает"
        ? "waiting"
        : value === "Проблема"
          ? "problem"
          : value === "Доставлен"
            ? "done"
            : "road";

  return <Tag className={`status-tag status-${statusClass}`}>{value}</Tag>;
}

export function OrdersTable({ orders, onOpen }) {
  const columns = [
    {
      title: "ЗАКАЗ",
      dataIndex: "id",
      width: 95,
      render: (id) => (
        <button className="order-link" onClick={() => onOpen(id)}>
          № {id}
        </button>
      ),
    },
    { title: "КЛИЕНТ", dataIndex: "client", width: 145 },
    {
      title: "АДРЕС",
      dataIndex: "route",
      ellipsis: true,
      render: (_, order) => getOrderFormValues(order).to,
    },
    { title: "ИСПОЛНИТЕЛЬ", dataIndex: "executor", width: 145 },
    {
      title: "СТАТУС",
      dataIndex: "status",
      width: 120,
      render: (status) => <Status value={status} />,
    },
    {
      title: "СУММА",
      dataIndex: "amount",
      width: 90,
      render: (amount) => <b>{amount} ₽</b>,
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={orders}
      pagination={false}
      size="middle"
      scroll={{ x: 850 }}
      onRow={(record) => ({ onDoubleClick: () => onOpen(record.id) })}
    />
  );
}

function OrdersRouteContent() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [theme] = useState(() => localStorage.getItem("crm-theme") || "light");
  const [orders, setOrders] = useState(initialOrders);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (order) => {
    setEditing(order);
    form.setFieldsValue(getOrderFormValues(order));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const saveOrder = (values) => {
    const orderValues = withOrderAddresses(values);
    if (editing) {
      setOrders((current) =>
        current.map((order) =>
          order.id === editing.id ? { ...order, ...orderValues } : order,
        ),
      );
      message.success("Заказ обновлён");
      closeModal();
      return;
    }

    const id = String(
      Math.max(...orders.map((order) => Number(order.id)), 10428) + 1,
    );
    const newOrder = { ...orderValues, id, period: "Сегодня" };
    setOrders((current) => [newOrder, ...current]);
    message.success("Заказ создан");
    closeModal();
    navigate(`/orders/${id}`);
  };

  const context = {
    orders,
    navigate,
    openCreate,
    openEdit,
    message,
  };
  return (
    <AppShell collapsed={collapsed} setCollapsed={setCollapsed} theme={theme}>
      <Outlet context={context} />
      <div className="mobile-nav">
        <span>DELIVERY / OS</span>
        <span>Демо-режим</span>
      </div>
      <Modal
        title={editing ? `Изменить заказ № ${editing.id}` : "Создать заказ"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        forceRender
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveOrder}
          initialValues={{
            status: "Ожидает",
            executor: "Не назначен",
            amount: 350,
          }}
        >
          <Form.Item
            name="client"
            label="Клиент"
            rules={[{ required: true, message: "Введите клиента" }]}
          >
            <Input placeholder="Название клиента" />
          </Form.Item>
          <Form.Item
            name="from"
            label="Откуда"
            extra="пока что поиск только по Челябинску (в проекте фронтов почему-то по дефолту стоит Челябинск, и когда вбиваешь адрес то сразу кидает на питер)"
            rules={[{ required: true, message: "Введите адрес отправления" }]}
          >
            <Input placeholder="Например, Невский проспект, 28" />
          </Form.Item>
          <Form.Item
            name="to"
            label="Куда"
            rules={[{ required: true, message: "Введите адрес доставки" }]}
          >
            <Input placeholder="Например, Литейный проспект, 12" />
          </Form.Item>
          <Form.Item name="executor" label="Исполнитель">
            <Select
              options={executors.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Статус">
            <Select
              options={statuses.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="Стоимость">
            <Input type="number" suffix="₽" />
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={closeModal}>Отмена</Button>
            <Button type="primary" htmlType="submit">
              {editing ? "Сохранить" : "Создать заказ"}
            </Button>
          </div>
        </Form>
      </Modal>
    </AppShell>
  );
}

export default function OrdersLayout() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#4f56df",
          borderRadius: 8,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          colorText: "#18243a",
          colorBorder: "#d9dee7",
          controlHeight: 38,
        },
        components: {
          Table: {
            headerBg: "#e7eaf0",
            headerColor: "#738098",
            rowHoverBg: "#f5f6f9",
            borderColor: "#e1e5ec",
          },
          Card: { borderRadius: 10 },
          Button: { fontWeight: 600 },
        },
      }}
    >
      <AntApp>
        <OrdersRouteContent />
      </AntApp>
    </ConfigProvider>
  );
}
