import { useEffect, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import {
  App as AntApp, Button, ConfigProvider, Form, Input, Modal, Select,
  Table, Tag, message, Card, Statistic, Switch
} from "antd";
import {
  ArrowUpRight, LayoutDashboard, Package, Users, Route, Bot, FileText,
  Wallet, Settings, Search, Bell, Clock3, Plus, Pencil, Copy, Link2,
  CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, UserRoundPlus, Send,
  CircleHelp, Sun, Moon, LogIn, UserPlus, LogOut, User
} from "lucide-react";
import { api } from "./api/mockApi";
import "./App.css";

const initialOrders = [
  { id: "10428", client: "Flora Studio", route: "ул. Мира, 8 → Невский, 41", executor: "Иван Петров", status: "В пути", amount: 450, period: "Сегодня" },
  { id: "10427", client: "Бутик Rêve", route: "Пушкинская, 13 → Садовая, 9", executor: "Анна Морозова", status: "В пути", amount: 350, period: "Сегодня" },
  { id: "10426", client: "Цветы №1", route: "Литейный, 12 → Чехова, 3", executor: "Не назначен", status: "Ожидает", amount: 400, period: "Сегодня" },
  { id: "10425", client: "Арт-магазин", route: "Малая Морская, 5 → Казанская, 8", executor: "Дмитрий Власов", status: "Проблема", amount: 550, period: "Сегодня" },
];

const navItems = [
  { key: "dashboard", label: "Обзор", icon: LayoutDashboard },
  { key: "orders", label: "Заказы", icon: Package },
  { key: "executors", label: "Исполнители", icon: Users },
  { key: "routes", label: "Маршруты", icon: Route },
  { key: "assistant", label: "Помощник", icon: Bot },
  { key: "reports", label: "Отчёты", icon: FileText },
  { key: "finance", label: "Финансы", icon: Wallet },
  { key: "admin", label: "Администрирование", icon: UserRoundPlus },
];

const statusColors = {
  "В пути": "green",
  "Ожидает": "gold",
  "Проблема": "red",
  "Доставлен": "green",
};

function Brand() {
  return <div className="brand"><span className="brand-mark"><ArrowUpRight size={21} /></span><span>DELIVERY / OS</span></div>;
}

function SideBar({ page, setPage, collapsed, setCollapsed, onLogout }) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-top">
        <Brand />
        <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label="Свернуть меню">
          {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
        </button>
      </div>
      <div className="nav-caption">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav>
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-item ${page === key || (page === "detail" && key === "orders") ? "active" : ""}`}
            onClick={() => setPage(key)}
          >
            <Icon size={16} strokeWidth={1.8} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className={`nav-item ${page === "settings" ? "active" : ""}`} onClick={() => setPage("settings")}>
          <Settings size={16} /><span>Настройки</span>
        </button>
        <button className="nav-item logout-button" onClick={onLogout}>
          <LogOut size={16} /><span>Выход</span>
        </button>
        <div className="user-chip">
          <span className="avatar">Л</span>
          <div><b>Логист</b><small>Рабочая смена</small></div>
        </div>
      </div>
    </aside>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <header className="page-header">
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="header-actions">
        <button className="icon-button" title="История"><Clock3 size={17} /></button>
        <button className="icon-button" title="Уведомления"><Bell size={17} /><i /></button>
        {action}
      </div>
    </header>
  );
}

function Status({ value }) {
  return <Tag className={`status-tag status-${value === "Ожидает" ? "waiting" : value === "Проблема" ? "problem" : value === "Доставлен" ? "done" : "road"}`}>{value}</Tag>;
}

function OrdersTable({ orders, onOpen }) {
  const columns = [
    { title: "ЗАКАЗ", dataIndex: "id", width: 95, render: (id) => <button className="order-link" onClick={() => onOpen(id)}>№ {id}</button> },
    { title: "КЛИЕНТ", dataIndex: "client", width: 145 },
    { title: "АДРЕС", dataIndex: "route", ellipsis: true, render: (route) => route.split(" → ").slice(-1)[0] },
    { title: "ИСПОЛНИТЕЛЬ", dataIndex: "executor", width: 145 },
    { title: "СТАТУС", dataIndex: "status", width: 120, render: (status) => <Status value={status} /> },
    { title: "СУММА", dataIndex: "amount", width: 90, render: (amount) => <b>{amount} ₽</b> },
  ];
  return <Table rowKey="id" columns={columns} dataSource={orders} pagination={false} size="middle" scroll={{ x: 850 }} onRow={(record) => ({ onDoubleClick: () => onOpen(record.id) })} />;
}

function Dashboard({ orders, onOpen, onCreate }) {
  return (
    <>
      <PageHeader title="Обзор доставок" subtitle="Операционная панель" action={<Button type="primary" icon={<Plus size={16} />} onClick={onCreate}>Создать заказ</Button>} />
      <div className="content-area">
        <div className="stats-grid">
          <Card className="stat-card"><Statistic title="Активных заказов" value={48} /></Card>
          <Card className="stat-card"><Statistic title="Требуют внимания" value={6} /></Card>
          <Card className="stat-card"><Statistic title="Доставлено сегодня" value={142} /></Card>
          <Card className="stat-card"><Statistic title="Исполнителей на смене" value={19} /></Card>
        </div>
        <div className="dashboard-grid">
          <Card className="panel-card orders-preview">
            <div className="panel-title"><h3>Активные заказы</h3><button className="text-link" onClick={() => window.dispatchEvent(new CustomEvent("crm-navigate", { detail: "orders" }))}>Все заказы</button></div>
            <OrdersTable orders={orders.slice(0, 5)} onOpen={onOpen} />
          </Card>
          <div className="side-panels">
            <Card className="panel-card">
              <div className="panel-title"><h3>Интеллектуальный помощник</h3><Bot size={18} /></div>
              <Tag color="green">Светлана · активна</Tag>
              <p className="muted">Сценарные уведомления и подсказки</p>
              <b className="small-strong">2 заказа требуют проверки логистом</b>
              <Button block className="secondary-button" onClick={() => window.dispatchEvent(new CustomEvent("crm-navigate", { detail: "assistant" }))}>Открыть помощника</Button>
            </Card>
            <Card className="panel-card">
              <h3>Контроль смены</h3>
              <div className="metric-line"><span>Свободны</span><b className="green-text">7</b></div>
              <div className="metric-line"><span>Выполняют заказы</span><b>12</b></div>
              <div className="metric-line"><span>Задержки</span><b className="red-text">3</b></div>
            </Card>
          </div>
        </div>
        <div className="page-foot"><span>01 / Обзор</span></div>
      </div>
    </>
  );
}

function OrdersPage({ orders, onOpen, onCreate }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || [o.id, o.client, o.route, o.executor].some(v => v.toLowerCase().includes(q))) &&
      (status === "all" || o.status === status) && (period === "all" || o.period === period);
  });

  return (
    <>
      <PageHeader title="Заказы" subtitle="Просмотр, фильтрация и управление доставками" action={<Button type="primary" icon={<Plus size={16} />} onClick={onCreate}>Создать заказ</Button>} />
      <div className="content-area">
        <Card className="filter-card">
          <div className="filter-grid">
            <label>ПОИСК<Input prefix={<Search size={15} />} placeholder="Номер, клиент или адрес" value={search} onChange={e => setSearch(e.target.value)} /></label>
            <label>СТАТУС<Select value={status} onChange={setStatus} options={[{ value: "all", label: "Все статусы" }, ...Object.keys(statusColors).map(v => ({ value: v, label: v }))]} /></label>
            <label>ПЕРИОД<Select value={period} onChange={setPeriod} options={[{ value: "all", label: "Любой период" }, { value: "Сегодня", label: "Сегодня" }, { value: "Вчера", label: "Вчера" }]} /></label>
            <Button className="secondary-button apply-button" onClick={() => message.success('Фильтры применены')}>Применить</Button>
          </div>
        </Card>
        <Card className="panel-card">
          <div className="panel-title"><h3>Список заказов</h3></div>
          <OrdersTable orders={filtered} onOpen={onOpen} />
        </Card>
        <div className="page-foot"><span>02 / Заказы</span></div>
      </div>
    </>
  );
}

function OrderDetails({ orders, selectedId, onBack, onEdit }) {
  const order = orders.find(o => o.id === selectedId) || orders[0];
  return (
    <>
      <PageHeader title={`Заказ № ${order.id}`} subtitle={`Заказы / № ${order.id}`} action={<><Button className="secondary-button" icon={<Pencil size={15} />} onClick={() => onEdit(order)}>Изменить</Button><Status value={order.status} /></>} />
      <div className="content-area">
        <div className="details-grid">
          <div className="details-main">
            <Card className="panel-card"><h3>Маршрут доставки</h3>
              <div className="route-point"><span className="route-dot" /><div><small>ТОЧКА ЗАБОРА</small><b>Адрес забора уточняется, Санкт-Петербург</b></div></div>
              <div className="route-point"><span className="route-dot" /><div><small>ТОЧКА ДОСТАВКИ</small><b>{order.route || "Адрес получателя"}, Санкт-Петербург</b></div></div>
            </Card>
            <Card className="panel-card"><h3>Информация о заказе</h3>
              <div className="info-grid">
                <div><small>Клиент</small><b>{order.client}</b></div>
                <div><small>Время доставки</small><b>14:00–15:00</b></div>
                <div><small>Стоимость</small><b>{order.amount} ₽</b></div>
                <div><small>Оплата</small><b>Безналичный расчёт</b></div>
              </div>
            </Card>
          </div>
          <div className="details-side">
            <Card className="panel-card"><h3>Исполнитель</h3>
              <div className="executor"><span className="avatar">И</span><div><b>{order.executor}</b><small className="green-text">Выполняет доставку</small></div></div>
              <p className="muted">Назначен системой</p>
              <Button block className="secondary-button" onClick={() => message.info("Выберите нового исполнителя в настройках заказа")}>Переназначить</Button>
            </Card>
            <Card className="panel-card"><h3>История статусов</h3>
              { [["13:42", "Исполнитель едет к получателю"], ["13:25", "Груз получен · фото добавлено"], ["13:08", "Исполнитель назначен"], ["12:58", "Заказ создан"]].map(([time, text]) =>
                <div className="history-row" key={time}><span>{time}</span>{text}</div>
              )}
            </Card>
          </div>
        </div>
        <div className="page-foot"><button className="text-link" onClick={onBack}>← Вернуться к заказам</button><span>03 / Карточка заказа</span></div>
      </div>
    </>
  );
}

function AssistantPage() {
  const [chat, setChat] = useState([{ from: "bot", text: "Здравствуйте! Выберите нужное действие. Я помогу найти информацию по заказам." }]);
  const [draft, setDraft] = useState("");
  const prompts = ["Показать заказы с задержкой", "Найти заказ по номеру", "Связаться со старшим логистом", "Проверить статус заказа"];
  const send = (text) => {
    if (!text.trim()) return;
    setChat(c => [...c, { from: "user", text }, { from: "bot", text: "Запрос принят. Проверьте список заказов и уведомления по текущим доставкам." }]);
    setDraft("");
  };
  return (
    <>
      <PageHeader title="Интеллектуальный помощник Светлана" subtitle="Уведомления и передача ситуаций логисту" />
      <div className="content-area">
        <div className="assistant-grid">
          <Card className="panel-card chat-panel">
            <div className="panel-title"><h3>Диалог с помощником</h3><Tag color="geekblue">По сценариям</Tag></div>
            <div className="chat-messages">{chat.map((m, i) => <div key={i} className={`chat-bubble ${m.from}`}>{m.from === "bot" && <b>Светлана</b>}{m.text}</div>)}</div>
            <div className="quick-prompts">{prompts.map(p => <Button key={p} className="secondary-button" onClick={() => send(p)}>{p}</Button>)}</div>
            <form className="chat-compose" onSubmit={e => { e.preventDefault(); send(draft); }}>
              <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Выберите готовый запрос выше или напишите..." />
              <Button type="primary" htmlType="submit" icon={<Send size={16} />} />
            </form>
          </Card>
          <div className="side-panels">
            <Card className="panel-card"><h3>Что умеет помощник</h3>{["Подсказать статус заказа", "Показать типовые причины задержек", "Направить к нужному разделу", "Передать вопрос логисту"].map(t => <div className="check-line" key={t}><CheckCircle2 size={16} />{t}</div>)}</Card>
            <Card className="panel-card"><h3>Уведомления</h3>{["Заказ № 10425 · Отмечена проблема при доставке", "Заказ № 10426 · Исполнитель пока не назначен"].map(t => <div className="notification" key={t}>{t}</div>)}</Card>
          </div>
        </div>
        <div className="page-foot"><span>04 / Светлана</span></div>
      </div>
    </>
  );
}

function AdminPage() {
  const [role, setRole] = useState("Логист");
  const [expiry, setExpiry] = useState("7 дней");
  const [invite, setInvite] = useState("");
  const [invites, setInvites] = useState([]);

  const createInvite = async () => {
    const token = Math.random().toString(36).slice(2, 8) + "-" + Math.random().toString(36).slice(2, 8);
    const url = `${window.location.origin}/register?invite=${token}`;
    setInvite(url);
    setInvites(items => [{ url, role, expiry, created: new Date().toLocaleString("ru-RU") }, ...items]);
    message.success("Ссылка создана");
  };

  const copyInvite = async (url) => {
    try { await navigator.clipboard.writeText(url); message.success("Ссылка скопирована"); }
    catch { message.info("Скопируйте ссылку вручную"); }
  };

  return (
    <>
      <PageHeader title="Администрирование" subtitle="Управление доступом и приглашение сотрудников" />
      <div className="content-area admin-content">
        <div className="admin-intro"><div className="admin-icon"><Link2 size={22} /></div><div><h2>Пригласить сотрудника</h2><p>Создайте ссылку для приглашения в рабочее пространство Delivery / OS.</p></div></div>
        <div className="admin-grid">
          <Card className="panel-card invite-card">
            <h3>Параметры приглашения</h3>
            <Form layout="vertical" onFinish={createInvite}>
              <Form.Item label="РОЛЬ СОТРУДНИКА"><Select value={role} onChange={setRole} options={[{ value: "Администратор", label: "Администратор" }, { value: "Логист", label: "Логист" }, { value: "Исполнитель", label: "Исполнитель" }]} /></Form.Item>
              <Form.Item label="СРОК ДЕЙСТВИЯ ССЫЛКИ"><Select value={expiry} onChange={setExpiry} options={[{ value: "24 часа", label: "24 часа" }, { value: "7 дней", label: "7 дней" }, { value: "30 дней", label: "30 дней" }]} /></Form.Item>
              <div className="permission-note"><AlertCircle size={17} /><span>Ссылка предоставляет доступ с ролью «{role}» и ведёт на страницу регистрации.</span></div>
              <Button type="primary" htmlType="submit" icon={<Plus size={16} />} block>Сгенерировать ссылку</Button>
            </Form>
            {invite && (
              <div className="generated-link">
                <label>ССЫЛКА ДЛЯ ПРИГЛАШЕНИЯ</label>
                <div className="link-row"><Input readOnly value={invite} /><Button icon={<Copy size={16} />} onClick={() => copyInvite(invite)}>Копировать</Button></div>
                <small>Роль: {role} · Срок действия: {expiry}</small>
              </div>
            )}
          </Card>
          <Card className="panel-card invite-info">
            <div className="info-icon"><CheckCircle2 size={20} /></div>
            <h3>Как это работает</h3>
            <div className="step-row"><span>01</span><div><b>Создайте ссылку</b><p>Выберите роль сотрудника и срок действия приглашения.</p></div></div>
            <div className="step-row"><span>02</span><div><b>Отправьте приглашение</b><p>Скопируйте ссылку и отправьте сотруднику удобным способом.</p></div></div>
            <div className="step-row"><span>03</span><div><b>Завершите настройку доступа</b><p>Сотрудник перейдёт по ссылке и зарегистрируется в системе.</p></div></div>
          </Card>
        </div>
        <Card className="panel-card invite-history">
          <div className="panel-title"><h3>Созданные приглашения</h3></div>
          {invites.length ? (
            <div className="invite-list">{invites.map((item, i) => (
              <div className="invite-list-row" key={item.url}>
                <div className="invite-list-icon"><Link2 size={17} /></div>
                <div className="invite-list-main"><b>{item.role}</b><span>{item.url}</span><small>Создано: {item.created} · Срок: {item.expiry}</small></div>
                <Button icon={<Copy size={15} />} onClick={() => copyInvite(item.url)}>Копировать</Button>
              </div>
            ))}</div>
          ) : (
            <div className="empty-invites"><Link2 size={25} /><b>Пока нет приглашений</b><span>Созданные ссылки появятся здесь.</span></div>
          )}
        </Card>
        <div className="page-foot"><span>08 / Администрирование</span></div>
      </div>
    </>
  );
}

function SettingsPage({ theme, setTheme, profile, setProfile, popups, setPopups }) {
  return (
    <>
      <PageHeader title="Настройки" subtitle="Персонализируйте рабочее пространство" />
      <div className="content-area settings-content">
        <section className="settings-intro"><div className="settings-intro-icon"><Settings size={22} /></div><div><h2>Настройки рабочего пространства</h2><p>Изменения применяются к интерфейсу этого браузера.</p></div></section>
        
        <Card className="panel-card settings-card">
          <div className="settings-section-heading"><div className="settings-section-icon"><Sun size={19} /></div><div><h3>Внешний вид</h3><p>Выберите удобное оформление CRM</p></div></div>
          <div className="theme-options">
            <button className={`theme-option ${theme === "light" ? "selected" : ""}`} onClick={() => setTheme("light")}>
              <span className="theme-preview theme-preview-light"><i /><i /><i /></span>
              <span className="theme-option-copy"><b><Sun size={16} /> Светлая тема</b><small>Светлый фон и контрастные панели</small></span>
            </button>
            <button className={`theme-option ${theme === "dark" ? "selected" : ""}`} onClick={() => setTheme("dark")}>
              <span className="theme-preview theme-preview-dark"><i /><i /><i /></span>
              <span className="theme-option-copy"><b><Moon size={16} /> Тёмная тема</b><small>Тёмное оформление для работы при слабом освещении</small></span>
            </button>
          </div>
        </Card>

        <Card className="panel-card settings-card">
          <div className="settings-section-heading"><div className="settings-section-icon"><User size={19} /></div><div><h3>Параметры профиля</h3><p>Основная информация о вашем аккаунте</p></div></div>
          <Form layout="vertical" initialValues={profile} onValuesChange={(_, allValues) => setProfile(allValues)}>
            <div className="form-row">
              <Form.Item label="Имя и фамилия" name="name"><Input placeholder="Иван Иванов" /></Form.Item>
              <Form.Item label="Должность" name="role"><Input placeholder="Логист" /></Form.Item>
            </div>
            <div className="form-row">
              <Form.Item label="Email" name="email"><Input placeholder="name@company.ru" /></Form.Item>
              <Form.Item label="Телефон" name="phone"><Input placeholder="+7 (999) 000-00-00" /></Form.Item>
            </div>
          </Form>
        </Card>

        <Card className="panel-card settings-card notification-settings-card">
          <div className="settings-section-heading"><div className="settings-section-icon"><Bell size={19} /></div><div><h3>Всплывающие окна</h3><p>Настройка поведения модальных окон и подтверждений</p></div></div>
          <div className="notification-settings-list">
            <div className="notification-setting-row">
              <span className="notification-setting-icon"><AlertCircle size={17} /></span>
              <div className="notification-setting-copy"><b>Подтверждение удаления</b><p>Запрашивать подтверждение перед удалением заказов или сотрудников</p></div>
              <Switch checked={popups.confirmDelete} onChange={(checked) => setPopups(old => ({ ...old, confirmDelete: checked }))} />
            </div>
            <div className="notification-setting-row">
              <span className="notification-setting-icon"><CheckCircle2 size={17} /></span>
              <div className="notification-setting-copy"><b>Автооткрытие карточки</b><p>Автоматически открывать детали заказа при его создании</p></div>
              <Switch checked={popups.autoOpenDetails} onChange={(checked) => setPopups(old => ({ ...old, autoOpenDetails: checked }))} />
            </div>
          </div>
        </Card>
        <div className="page-foot"><span>09 / Настройки</span></div>
      </div>
    </>
  );
}

function AuthPage({ register, onSwitch, onLogin }) {
  return (
    <div className="auth-page">
      <section className="auth-promo">
        <Brand />
        <div className="promo-copy">
          <small>ПЛАТФОРМА УПРАВЛЕНИЯ ДОСТАВКОЙ</small>
          <h1>Все доставки.<br />Под вашим контролем.</h1>
          <p>Заказы, исполнители, маршруты и аналитика<br />в одном удобном рабочем пространстве.</p>
          <div className="promo-steps">{["Создание заказа", "Назначение исполнителя", "Контроль выполнения"].map((x, i) => <div key={x}><span>0{i + 1}</span>{x}</div>)}</div>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-form">
          <h1>{register ? "Создать аккаунт" : "Вход в систему"}</h1>
          <p>{register ? "Зарегистрируйтесь, чтобы начать работать с платформой" : "Управляйте доставками в одном рабочем пространстве"}</p>
          <Form layout="vertical" onFinish={onLogin}>
            {register && <Form.Item label="ИМЯ И ФАМИЛИЯ" name="name" rules={[{ required: true, message: "Введите имя" }]}><Input placeholder="Как к вам обращаться?" /></Form.Item>}
            <Form.Item label="EMAIL" name="email" rules={[{ required: true, message: "Введите email" }, { type: "email", message: "Проверьте email" }]}><Input placeholder="name@company.ru" /></Form.Item>
            <Form.Item label="ПАРОЛЬ" name="password" rules={[{ required: true, message: "Введите пароль" }]}><Input.Password placeholder={register ? "Не менее 8 символов" : "Введите пароль"} /></Form.Item>
            {register && <Form.Item label="ПОДТВЕРДИТЕ ПАРОЛЬ" name="confirm" rules={[{ required: true, message: "Повторите пароль" }]}><Input.Password placeholder="Повторите пароль" /></Form.Item>}
            <Button type="primary" htmlType="submit" block>{register ? "Зарегистрироваться" : "Войти"}</Button>
          </Form>
          <div className="auth-switch">{register ? "Уже есть аккаунт?" : "Нет аккаунта?"}<button onClick={onSwitch}>{register ? "Войти →" : "Зарегистрироваться →"}</button></div>
        </div>
        <small className="auth-copyright">© 2026 Delivery / OS</small>
      </section>
    </div>
  );
}

function GenericPage({ page }) {
  const pages = {
    executors: { title: "Исполнители", subtitle: "Состав смены и текущая загрузка", stats: [{ title: "Всего исполнителей", value: 24 }, { title: "На смене", value: 19 }], columns: [{ title: "ИСПОЛНИТЕЛЬ", dataIndex: "name" }, { title: "РАЙОН", dataIndex: "area" }, { title: "СТАТУС", dataIndex: "status", render: v => <Tag color={v === "Свободен" ? "green" : v === "Задержка" ? "red" : "blue"}>{v}</Tag> }], rows: [{ key: 1, name: "Иван Петров", area: "Центральный", status: "На заказе" }, { key: 2, name: "Егор Смирнов", area: "Центральный", status: "Свободен" }] },
    routes: { title: "Маршруты", subtitle: "Планирование доставок по районам", stats: [{ title: "Маршрутов сегодня", value: 18 }, { title: "В процессе", value: 5 }], columns: [{ title: "МАРШРУТ", dataIndex: "name" }, { title: "ЗОНА", dataIndex: "area" }, { title: "СОСТОЯНИЕ", dataIndex: "status", render: v => <Tag color={v === "Завершён" ? "green" : v === "Задержка" ? "red" : "blue"}>{v}</Tag> }], rows: [{ key: 1, name: "Маршрут № 018", area: "Центр", status: "В пути" }] },
    reports: { title: "Отчёты", subtitle: "Сводка по доставкам за текущий период", stats: [{ title: "Заказов за день", value: 142 }, { title: "Успешно", value: "94%" }], columns: [{ title: "ДАТА", dataIndex: "date" }, { title: "ДОСТАВЛЕНО", dataIndex: "done" }, { title: "ВЫРУЧКА", dataIndex: "revenue", render: v => <b>{v.toLocaleString("ru-RU")} ₽</b> }], rows: [{ key: 1, date: "13.10.2026", done: 128, revenue: 58400 }] },
    finance: { title: "Финансы", subtitle: "Начисления и оплата заказов", stats: [{ title: "Выручка за день", value: "58 400 ₽" }, { title: "Оплачено", value: "45 750 ₽" }], columns: [{ title: "ЗАКАЗ", dataIndex: "id", render: v => <span className="order-link">№ {v}</span> }, { title: "КЛИЕНТ", dataIndex: "client" }, { title: "ОПЛАТА", dataIndex: "payment", render: v => <Tag color={v === "Оплачено" ? "green" : "gold"}>{v}</Tag> }], rows: [{ key: 1, id: "10428", client: "Flora Studio", payment: "Оплачено" }] }
  };
  const data = pages[page] || pages.executors;
  return (
    <>
      <PageHeader title={data.title} subtitle={data.subtitle} />
      <div className="content-area section-content">
        <div className="stats-grid">{data.stats.map(item => <Card className="stat-card" key={item.title}><Statistic title={item.title} value={item.value} /></Card>)}</div>
        <Card className="panel-card section-table">
          <div className="panel-title"><h3>{page === "executors" ? "Список исполнителей" : page === "routes" ? "Текущие маршруты" : page === "reports" ? "Ежедневная сводка" : "Операции по заказам"}</h3></div>
          <Table rowKey="key" columns={data.columns} dataSource={data.rows} pagination={false} size="middle" scroll={{ x: true }} />
        </Card>
        <div className="page-foot"><span>Раздел: {data.title}</span></div>
      </div>
    </>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getPageFromPath = () => {
    const path = location.pathname.replace('/', '') || 'dashboard';
    return path === 'register' || path === 'login' ? 'auth' : path;
  };

  const [page, setPage] = useState(getPageFromPath());
  const [collapsed, setCollapsed] = useState(false);
  const [orders, setOrders] = useState(initialOrders);
  const [selectedId, setSelectedId] = useState("10428");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [auth, setAuth] = useState("app");
  const [register, setRegister] = useState(location.pathname === '/register');
  const [theme, setTheme] = useState(() => localStorage.getItem("crm-theme") || "light");
  
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm-profile")) || { name: "Логист Иванов", role: "Логист", email: "logist@delivery.os", phone: "+7 (999) 000-00-00" }; }
    catch { return { name: "Логист Иванов", role: "Логист", email: "logist@delivery.os", phone: "+7 (999) 000-00-00" }; }
  });
  const [popups, setPopups] = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm-popups")) || { confirmDelete: true, autoOpenDetails: false }; }
    catch { return { confirmDelete: true, autoOpenDetails: false }; }
  });

  const [form] = Form.useForm();

  useEffect(() => { 
    localStorage.setItem("crm-theme", theme); 
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem("crm-profile", JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem("crm-popups", JSON.stringify(popups)); }, [popups]);

  const handleSetPage = (newPage) => {
    setPage(newPage);
    navigate(newPage === 'dashboard' ? '/' : `/${newPage}`);
  };

  useEffect(() => {
    const listener = e => handleSetPage(e.detail);
    window.addEventListener("crm-navigate", listener);
    return () => window.removeEventListener("crm-navigate", listener);
  }, []);

  const handleLogout = () => {
    setAuth("login");
    navigate("/login");
    message.success("Вы успешно вышли из системы");
  };

  const openOrder = id => { setSelectedId(id); handleSetPage("detail"); };
  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = order => { setEditing(order); form.setFieldsValue(order); setModalOpen(true); };
  
  const saveOrder = values => {
    if (editing) setOrders(old => old.map(o => o.id === editing.id ? { ...o, ...values } : o));
    else setOrders(old => [{ ...values, id: String(Math.max(...old.map(o => Number(o.id)), 10428) + 1), period: "Сегодня" }, ...old]);
    setModalOpen(false);
    message.success(editing ? "Заказ обновлён" : "Заказ создан");
  };

  if (auth !== "app") return <AuthPage register={register} onSwitch={() => { setRegister(v => !v); navigate(register ? '/login' : '/register'); }} onLogin={() => { setAuth("app"); navigate("/"); message.success("Демонстрационный вход выполнен"); }} />;

  return (
    <div className="app-shell" data-theme={theme}>
      <SideBar page={page} setPage={handleSetPage} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={handleLogout} />
      <main className="main-content">
        {page === "dashboard" && <Dashboard orders={orders} onOpen={openOrder} onCreate={openCreate} />}
        {page === "orders" && <OrdersPage orders={orders} onOpen={openOrder} onCreate={openCreate} />}
        {page === "detail" && <OrderDetails orders={orders} selectedId={selectedId} onBack={() => handleSetPage("orders")} onEdit={openEdit} />}
        {page === "assistant" && <AssistantPage />}
        {page === "admin" && <AdminPage />}
        {page === "settings" && <SettingsPage theme={theme} setTheme={setTheme} profile={profile} setProfile={setProfile} popups={popups} setPopups={setPopups} />}
        {["executors", "routes", "reports", "finance"].includes(page) && <GenericPage page={page} />}
        <div className="mobile-nav"><span><CircleHelp size={16} /> Delivery / OS</span><span>Демо-режим</span></div>
      </main>
      
      <Modal 
        title={editing ? `Изменить заказ № ${editing.id}` : "Создать заказ"} 
        open={modalOpen} 
        onCancel={() => setModalOpen(false)} 
        footer={null} 
        destroyOnHidden
        getContainer={false}
      >
        <Form form={form} layout="vertical" onFinish={saveOrder} initialValues={{ status: "Ожидает", executor: "Не назначен", amount: 350, period: "Сегодня" }}>
          <Form.Item name="client" label="Клиент" rules={[{ required: true, message: "Введите клиента" }]}><Input placeholder="Название клиента" /></Form.Item>
          <Form.Item name="route" label="Маршрут" rules={[{ required: true, message: "Введите маршрут" }]}><Input placeholder="Адрес доставки" /></Form.Item>
          <Form.Item name="executor" label="Исполнитель"><Select options={["Не назначен", "Иван Петров", "Анна Морозова", "Дмитрий Власов", "Егор Смирнов"].map(v => ({ value: v, label: v }))} /></Form.Item>
          <Form.Item name="status" label="Статус"><Select options={Object.keys(statusColors).map(v => ({ value: v, label: v }))} /></Form.Item>
          <Form.Item name="amount" label="Стоимость"><Input type="number" suffix="₽" /></Form.Item>
          <div className="modal-actions"><Button onClick={() => setModalOpen(false)}>Отмена</Button><Button type="primary" htmlType="submit">{editing ? "Сохранить" : "Создать заказ"}</Button></div>
        </Form>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={{
        token: { colorPrimary: "#4f56df", borderRadius: 8, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', colorText: "#18243a", colorBorder: "#d9dee7", controlHeight: 38 },
        components: { Table: { headerBg: "#e7eaf0", headerColor: "#738098", rowHoverBg: "#f5f6f9", borderColor: "#e1e5ec" }, Card: { borderRadius: 10 }, Button: { fontWeight: 600 } }
      }}>
        <AntApp>
          <MainApp />
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}