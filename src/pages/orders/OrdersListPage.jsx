import { useState } from "react";
import { Button, Card, Input, Select } from "antd";
import { Plus, Search } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { OrdersTable } from "./OrdersLayout.jsx";
import { getOrderAddresses } from "./orderUtils.js";

const statuses = ["Ожидает", "Собирается", "В пути", "Проблема", "Доставлен"];

export default function OrdersListPage() {
  const { orders, navigate, openCreate, message } = useOutletContext();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");

  const filtered = orders.filter((order) => {
    const query = search.toLowerCase();
    const { from, to } = getOrderAddresses(order);
    return (
      (!query ||
        [order.id, order.client, from, to, order.executor].some((value) =>
          value.toLowerCase().includes(query),
        )) &&
      (status === "all" || order.status === status) &&
      (period === "all" || order.period === period)
    );
  });

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Заказы</h1>
          <p>Просмотр, фильтрация и управление доставками</p>
        </div>
        <div className="header-actions">
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Создать заказ
          </Button>
        </div>
      </header>
      <div className="content-area">
        <Card className="filter-card">
          <div className="filter-grid">
            <label>
              ПОИСК
              <Input
                prefix={<Search size={15} />}
                placeholder="Номер, клиент или адрес"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              СТАТУС
              <Select
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "Все статусы" },
                  ...statuses.map((value) => ({ value, label: value })),
                ]}
              />
            </label>
            <label>
              ПЕРИОД
              <Select
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "all", label: "Любой период" },
                  { value: "Сегодня", label: "Сегодня" },
                  { value: "Вчера", label: "Вчера" },
                ]}
              />
            </label>
            <Button
              className="secondary-button apply-button"
              onClick={() =>
                message.success(`Найдено заказов: ${filtered.length}`)
              }
            >
              Применить
            </Button>
          </div>
        </Card>
        <Card className="panel-card">
          <div className="panel-title">
            <h3>Список заказов</h3>
          </div>
          <OrdersTable
            orders={filtered}
            onOpen={(id) => navigate(`/orders/${id}`)}
          />
          <div className="table-foot">
            Показаны {filtered.length} из {orders.length} заказов
          </div>
        </Card>
        <div className="page-foot">
          Операционная панель <span>02 / Заказы</span>
        </div>
      </div>
    </>
  );
}