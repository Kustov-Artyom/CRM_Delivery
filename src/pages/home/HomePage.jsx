import { Button, Card, Statistic, Table, Tag } from "antd";
import { Bot, LogIn, Plus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { getOrderAddresses } from "../orders/orderUtils.js";

function PageHeader({ title, subtitle, action }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-actions">{action}</div>
    </header>
  );
}

function Status({ value }) {
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

function OrdersPreview({ orders }) {
  const columns = [
    {
      title: "ЗАКАЗ",
      dataIndex: "id",
      width: 95,
      render: (id) => (
        <Link className="order-link" to={`/orders/${id}`}>
          № {id}
        </Link>
      ),
    },
    { title: "КЛИЕНТ", dataIndex: "client", width: 145 },
    {
      title: "АДРЕС",
      dataIndex: "route",
      ellipsis: true,
      render: (_, order) => getOrderAddresses(order).to,
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
    />
  );
}

export default function HomePage({ orders, onCreate }) {
  const active = orders.filter((order) => order.status !== "Доставлен").length;
  return (
    <>
      <PageHeader
        title="Обзор доставок"
        subtitle="Вторник, 13 октября 2026 · Операционная панель"
        action={
          <div className="dashboard-header-actions">
            <Button
              href="/login"
              className="auth-preview-button"
              icon={<LogIn size={14} />}
            >
              Вход
            </Button>
            <Button
              href="/register"
              className="auth-preview-button"
              icon={<UserPlus size={14} />}
            >
              Регистрация
            </Button>
            <Button type="primary" icon={<Plus size={16} />} onClick={onCreate}>
              Создать заказ
            </Button>
          </div>
        }
      />
      <div className="content-area">
        <div className="stats-grid">
          <Card className="stat-card">
            <Statistic title="Активных заказов" value={48} />
            <span className="stat-pill positive">+12%</span>
          </Card>
          <Card className="stat-card">
            <Statistic title="Требуют внимания" value={6} />
            <span className="stat-pill warning">Важно</span>
          </Card>
          <Card className="stat-card">
            <Statistic title="Доставлено сегодня" value={142} />
            <span className="stat-pill positive">+8%</span>
          </Card>
          <Card className="stat-card">
            <Statistic title="Исполнителей на смене" value={19} />
            <span className="stat-pill positive">Онлайн</span>
          </Card>
        </div>
        <div className="dashboard-grid">
          <Card className="panel-card orders-preview">
            <div className="panel-title">
              <h3>Активные заказы</h3>
              <Link className="text-link" to="/orders">
                Все заказы
              </Link>
            </div>
            <OrdersPreview orders={orders.slice(0, 5)} />
          </Card>
          <div className="side-panels">
            <Card className="panel-card">
              <div className="panel-title">
                <h3>Интеллектуальный помощник</h3>
                <Bot size={18} />
              </div>
              <Tag color="green">Светлана · активна</Tag>
              <p className="muted">Сценарные уведомления и подсказки</p>
              <b className="small-strong">2 заказа требуют проверки логистом</b>
              <Button block className="secondary-button" href="/assistant">
                Открыть помощника
              </Button>
            </Card>
            <Card className="panel-card">
              <h3>Контроль смены</h3>
              <div className="metric-line">
                <span>Свободны</span>
                <b className="green-text">7</b>
              </div>
              <div className="metric-line">
                <span>Выполняют заказы</span>
                <b>12</b>
              </div>
              <div className="metric-line">
                <span>Задержки</span>
                <b className="red-text">3</b>
              </div>
            </Card>
          </div>
        </div>
        <div className="page-foot">
          Операционная панель{" "}
          <span>01 / Обзор · {active} активных в списке</span>
        </div>
      </div>
    </>
  );
}
