import { Button, Card } from "antd";
import { ArrowLeft, Pencil } from "lucide-react";
import { useOutletContext, useParams } from "react-router-dom";
import { Status } from "./OrdersLayout.jsx";
import { getOrderAddresses } from "./orderUtils.js";
import OrderMap from "./OrderMap.jsx";

export default function OrderDetailsPage() {
  const { orders, navigate, openEdit, message } = useOutletContext();
  const { orderId } = useParams();
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return (
      <>
        <header className="page-header">
          <div>
            <h1>Заказ не найден</h1>
            <p>Заказ № {orderId} отсутствует в текущем списке</p>
          </div>
        </header>
        <div className="content-area">
          <Button
            className="secondary-button"
            onClick={() => navigate("/orders")}
          >
            Вернуться к заказам
          </Button>
        </div>
      </>
    );
  }

  const { from, to } = getOrderAddresses(order);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Заказ № {order.id}</h1>
          <p>Заказы / № {order.id}</p>
        </div>
        <div className="header-actions">
          <Button
            className="secondary-button"
            icon={<ArrowLeft size={15} />}
            onClick={() => navigate("/orders")}
          >
            К заказам
          </Button>
          <Button
            className="secondary-button"
            icon={<Pencil size={15} />}
            onClick={() => openEdit(order)}
          >
            Изменить
          </Button>
          <Status value={order.status} />
        </div>
      </header>
      <div className="content-area">
        <div className="details-grid">
          <div className="details-main">
            <Card className="panel-card">
              <h3>Маршрут доставки</h3>
              <div className="route-point">
                <span className="route-dot" />
                <div>
                  <small>ОТКУДА</small>
                  <b>{from || "Адрес отправления не указан"}, Челябинск</b>
                </div>
              </div>
              <div className="route-point">
                <span className="route-dot" />
                <div>
                  <small>КУДА</small>
                  <b>{to || "Адрес доставки не указан"}, Челябинск</b>
                </div>
              </div>
            </Card>
            <OrderMap from={from} to={to} />
            <Card className="panel-card">
              <h3>Информация о заказе</h3>
              <div className="info-grid">
                <div>
                  <small>Клиент</small>
                  <b>{order.client}</b>
                </div>
                <div>
                  <small>Время доставки</small>
                  <b>14:00–15:00</b>
                </div>
                <div>
                  <small>Стоимость</small>
                  <b>{order.amount} ₽</b>
                </div>
                <div>
                  <small>Оплата</small>
                  <b>Безналичный расчёт</b>
                </div>
              </div>
            </Card>
          </div>
          <div className="details-side">
            <Card className="panel-card">
              <h3>Исполнитель</h3>
              <div className="executor">
                <span className="avatar">И</span>
                <div>
                  <b>{order.executor}</b>
                  <small className="green-text">Выполняет доставку</small>
                </div>
              </div>
              <p className="muted">Назначен системой</p>
              <Button
                block
                className="secondary-button"
                onClick={() =>
                  message.info(
                    "Выберите нового исполнителя в настройках заказа",
                  )
                }
              >
                Переназначить
              </Button>
            </Card>
            <Card className="panel-card">
              <h3>История статусов</h3>
              {[
                ["13:42", "Исполнитель едет к получателю"],
                ["13:25", "Груз получен · фото добавлено"],
                ["13:08", "Исполнитель назначен"],
                ["12:58", "Заказ создан"],
              ].map(([time, text]) => (
                <div className="history-row" key={time}>
                  <span>{time}</span>
                  {text}
                </div>
              ))}
            </Card>
          </div>
        </div>
        <div className="page-foot">
          <button className="text-link" onClick={() => navigate("/orders")}>
            ← Вернуться к заказам
          </button>
          <span>03 / Карточка заказа</span>
        </div>
      </div>
    </>
  );
}
