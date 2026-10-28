import { useState, useRef } from "react";
import {
  App as AntApp,
  Button,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Select,
  AutoComplete,
  Table,
  Tag,
  Spin,
} from "antd";
import { useNavigate, Outlet } from "react-router-dom";
import AppShell from "../../shell/AppShell.jsx";
import {
  getOrderFormValues,
  withOrderAddresses,
  calculateDeliveryCost,
  DELIVERY_RATES,
} from "./orderUtils.js";
import { fetchRouteDistance, searchAddressSuggestions } from "./OrderMap.jsx";
import "../../App.css";

const initialOrders = [
  {
    id: "10428",
    client: "Flora Studio",
    route: "ул. Мира, 8 → Невский, 41",
    executor: "Иван Петров",
    status: "В пути",
    tariff: "courier_standard",
    paymentMethod: "Безналичный расчёт",
    amount: 450,
    period: "Сегодня",
  },
  {
    id: "10427",
    client: "Бутик Rêve",
    route: "Пушкинская, 13 → Садовая, 9",
    executor: "Анна Морозова",
    status: "Собирается",
    tariff: "courier_pedestrian",
    paymentMethod: "Наличные курьеру",
    amount: 350,
    period: "Сегодня",
  },
  {
    id: "10426",
    client: "Цветы №1",
    route: "Литейный, 12 → Чехова, 3",
    executor: "Не назначен",
    status: "Ожидает",
    tariff: "courier_standard",
    paymentMethod: "Безналичный расчёт",
    amount: 400,
    period: "Сегодня",
  },
  {
    id: "10425",
    client: "Арт-магазин",
    route: "Малая Морская, 5 → Казанская, 8",
    executor: "Дмитрий Власов",
    status: "Проблема",
    tariff: "courier_express",
    paymentMethod: "СБП / онлайн",
    amount: 550,
    period: "Сегодня",
  },
  {
    id: "10424",
    client: "Flora Studio",
    route: "Марата, 20 → Восстания, 1",
    executor: "Егор Смирнов",
    status: "Доставлен",
    tariff: "courier_standard",
    paymentMethod: "Безналичный расчёт",
    amount: 350,
    period: "Вчера",
  },
];

const allStatuses = ["Ожидает", "Собирается", "В пути", "Проблема", "Доставлен"];
const createStatuses = ["Ожидает", "Собирается"];

const executors = [
  "Не назначен",
  "Иван Петров",
  "Анна Морозова",
  "Дмитрий Власов",
  "Егор Смирнов",
];

const paymentMethods = [
  "Безналичный расчёт",
  "Наличные курьеру",
  "СБП / онлайн",
];

export function Status({ value }) {
  const statusClass =
    value === "Собирается"
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
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(350);

  const [fromOptions, setFromOptions] = useState([]);
  const [toOptions, setToOptions] = useState([]);

  const fromDebounceRef = useRef(null);
  const toDebounceRef = useRef(null);

  const [form] = Form.useForm();

  const handleSearchFrom = (text) => {
    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);
    if (!text || text.trim().length < 3) {
      setFromOptions([]);
      return;
    }
    fromDebounceRef.current = setTimeout(async () => {
      const suggestions = await searchAddressSuggestions(text);
      setFromOptions(suggestions);
    }, 500);
  };

  const handleSearchTo = (text) => {
    if (toDebounceRef.current) clearTimeout(toDebounceRef.current);
    if (!text || text.trim().length < 3) {
      setToOptions([]);
      return;
    }
    toDebounceRef.current = setTimeout(async () => {
      const suggestions = await searchAddressSuggestions(text);
      setToOptions(suggestions);
    }, 500);
  };

  const calculateAutoCost = async () => {
    const from = form.getFieldValue("from");
    const to = form.getFieldValue("to");
    const tariff = form.getFieldValue("tariff") || "courier_standard";

    if (from && to && from.trim().length > 2 && to.trim().length > 2) {
      setCalculatingPrice(true);
      const distanceMeters = await fetchRouteDistance(from, to);
      if (distanceMeters) {
        const cost = calculateDeliveryCost(distanceMeters, tariff);
        setCalculatedAmount(cost);
        form.setFieldsValue({ amount: cost });
      } else {
        const fallbackCost = DELIVERY_RATES[tariff]?.base || 200;
        setCalculatedAmount(fallbackCost);
        form.setFieldsValue({ amount: fallbackCost });
      }
      setCalculatingPrice(false);
    } else {
      const baseCost = DELIVERY_RATES[tariff]?.base || 200;
      setCalculatedAmount(baseCost);
      form.setFieldsValue({ amount: baseCost });
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setFromOptions([]);
    setToOptions([]);
    setCalculatedAmount(DELIVERY_RATES.courier_standard.base);
    form.setFieldsValue({
      status: "Ожидает",
      executor: "Не назначен",
      tariff: "courier_standard",
      paymentMethod: "Безналичный расчёт",
      amount: DELIVERY_RATES.courier_standard.base,
    });
    setModalOpen(true);
  };

  const openEdit = (order) => {
    if (order.status === "Доставлен") {
      message.warning("Заказ доставлен и закрыт для редактирования");
      return;
    }
    setEditing(order);
    setFromOptions([]);
    setToOptions([]);
    const formVals = getOrderFormValues(order);
    form.setFieldsValue(formVals);
    setCalculatedAmount(order.amount || DELIVERY_RATES.courier_standard.base);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFromOptions([]);
    setToOptions([]);
  };

  const saveOrder = (values) => {
    const finalAmount = calculatedAmount;
    const orderValues = {
      ...withOrderAddresses(values),
      amount: finalAmount,
    };

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
            tariff: "courier_standard",
            paymentMethod: "Безналичный расчёт",
            amount: 200,
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
            rules={[{ required: true, message: "Введите адрес отправления" }]}
          >
            <AutoComplete
              options={fromOptions}
              onSearch={handleSearchFrom}
              onSelect={calculateAutoCost}
              onBlur={calculateAutoCost}
              placeholder="Например, Энгельса, 44"
            />
          </Form.Item>

          <Form.Item
            name="to"
            label="Куда"
            rules={[{ required: true, message: "Введите адрес доставки" }]}
          >
            <AutoComplete
              options={toOptions}
              onSearch={handleSearchTo}
              onSelect={calculateAutoCost}
              onBlur={calculateAutoCost}
              placeholder="Например, Ленина, 50"
            />
          </Form.Item>

          <Form.Item name="tariff" label="Тариф доставки">
            <Select
              onChange={calculateAutoCost}
              options={[
                {
                  value: "courier_standard",
                  label: "Стандарт (авто) — от 200 ₽",
                },
                {
                  value: "courier_express",
                  label: "Экспресс — от 350 ₽",
                },
                {
                  value: "courier_pedestrian",
                  label: "Пеший курьер — от 150 ₽",
                },
              ]}
            />
          </Form.Item>

          <Form.Item name="paymentMethod" label="Способ оплаты">
            <Select
              options={paymentMethods.map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>

          <Form.Item name="executor" label="Исполнитель">
            <Select
              options={executors.map((value) => ({ value, label: value }))}
            />
          </Form.Item>

          <Form.Item name="status" label="Статус">
            <Select
              options={(editing ? allStatuses : createStatuses).map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>

          <Form.Item name="amount" hidden>
            <Input />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(79, 86, 223, 0.08)",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#697586" }}>
              Расчётная стоимость доставки:
            </span>
            <b style={{ fontSize: "16px", color: "#18243a" }}>
              {calculatingPrice ? (
                <Spin size="small" />
              ) : (
                `${calculatedAmount} ₽`
              )}
            </b>
          </div>

          <div className="modal-actions">
            <Button onClick={closeModal}>Отмена</Button>
            <Button type="primary" htmlType="submit" disabled={calculatingPrice}>
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