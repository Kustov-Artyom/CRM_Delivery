import { useState } from "react";
import { Button, Card, Tag } from "antd";
import { ArrowLeft, Navigation, Pencil, Lock } from "lucide-react";
import { useOutletContext, useParams } from "react-router-dom";
import { Status } from "./OrdersLayout.jsx";
import { getOrderAddresses, DELIVERY_RATES } from "./orderUtils.js";
import OrderMap from "./OrderMap.jsx";

export default function OrderDetailsPage() {
  const { orders, navigate, openEdit } = useOutletContext();
  const { orderId } = useParams();
  const [routeInfo, setRouteInfo] = useState(null);

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
  const isDelivered = order.status === "Доставлен";
  const tariffName = DELIVERY_RATES[order.tariff]?.name || "Стандарт (авто)";

  const openNavigator = () => {
    if (!to) return;
    const url = `https://yandex.ru/maps/?rtext=${encodeURIComponent(
      from ? `${from}, Челябинск` : "",
    )}~${encodeURIComponent(`${to}, Челябинск`)}&rtt=auto`;
    window.open(url, "_blank");
  };

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
            icon={<Navigation size={15} />}
            onClick={openNavigator}
          >
            В навигатор
          </Button>
          <Button
            className="secondary-button"
            icon={isDelivered ? <Lock size={15} /> : <Pencil size={15} />}
            disabled={isDelivered}
            title={isDelivered ? "Доставленный заказ нельзя редактировать" : "Изменить"}
            onClick={() => openEdit(order)}
          >
            {isDelivered ? "Заказ закрыт" : "Изменить"}
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

            <OrderMap
              from={from}
              to={to}
              onRouteCalculated={(info) => setRouteInfo(info)}
            />

            <Card className="panel-card">
              <h3>Информация о доставке и заказе</h3>
              <div className="info-grid">
                <div>
                  <small>Клиент</small>
                  <b>{order.client}</b>
                </div>
                <div>
                  <small>Тариф доставки</small>
                  <b>{tariffName}</b>
                </div>
                <div>
                  <small>Расстояние маршрута</small>
                  <b>
                    {routeInfo
                      ? `${(routeInfo.distance / 1000).toFixed(1)} км`
                      : "Расчёт..."}
                  </b>
                </div>
                <div>
                  <small>Время в пути</small>
                  <b>
                    {routeInfo
                      ? `~${Math.round(routeInfo.duration / 60)} мин`
                      : "Расчёт..."}
                  </b>
                </div>
                <div>
                  <small>Стоимость</small>
                  <b>{order.amount} ₽</b>
                </div>
                <div>
                  <small>Оплата</small>
                  <b>{order.paymentMethod || "Безналичный расчёт"}</b>
                </div>
              </div>
            </Card>
          </div>

          <div className="details-side">
            <Card className="panel-card">
              <h3>Исполнитель</h3>
              <div className="executor">
                <span className="avatar">
                  {order.executor ? order.executor[0] : "—"}
                </span>
                <div>
                  <b>{order.executor || "Не назначен"}</b>
                  <small className="green-text">
                    {order.executor !== "Не назначен"
                      ? "Выполняет доставку"
                      : "Ожидает назначения"}
                  </small>
                </div>
              </div>
              <p className="muted">Назначен диспетчером</p>
              <Button
                block
                className="secondary-button"
                disabled={isDelivered}
                onClick={() => openEdit(order)}
              >
                {isDelivered ? "Заказ завершён" : "Переназначить"}
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
      </div>
    </>
  );
}