import { useLayoutEffect, useRef, useState } from "react";
import { App as AntApp, Button, Card, ConfigProvider, Input, Tag } from "antd";
import { Bell, CheckCircle2, Clock3, Send } from "lucide-react";
import AppShell from "../../shell/AppShell.jsx";

function PageHeader({ title, subtitle }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-actions">
        <button className="icon-button" title="История">
          <Clock3 size={17} />
        </button>
        <button className="icon-button" title="Уведомления">
          <Bell size={17} />
          <i />
        </button>
      </div>
    </header>
  );
}

function AssistantContent() {
  const [chat, setChat] = useState([
    {
      from: "bot",
      text: "Здравствуйте! Выберите нужное действие. Я помогу найти информацию по заказам.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const chatMessagesRef = useRef(null);
  const prompts = [
    "Показать заказы с задержкой",
    "Найти заказ по номеру",
    "Связаться со старшим логистом",
    "Проверить статус заказа",
  ];
  useLayoutEffect(() => {
    const chatMessages = chatMessagesRef.current;
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, [chat]);
  const send = (text) => {
    if (!text.trim()) return;
    setChat((messages) => [
      ...messages,
      { from: "user", text },
      {
        from: "bot",
        text: "Запрос принят. Проверьте список заказов и уведомления по текущим доставкам.",
      },
    ]);
    setDraft("");
  };
  return (
    <>
      <PageHeader
        title="Интеллектуальный помощник Светлана"
        subtitle="Уведомления и передача ситуаций логисту"
      />
      <div className="content-area">
        <div className="assistant-grid">
          <Card className="panel-card chat-panel">
            <div className="panel-title">
              <h3>Диалог с помощником</h3>
              <Tag color="geekblue">По сценариям</Tag>
            </div>
            <div className="chat-messages" ref={chatMessagesRef}>
              {chat.map((message, index) => (
                <div key={index} className={`chat-bubble ${message.from}`}>
                  {message.from === "bot" && <b>Светлана</b>}
                  {message.text}
                </div>
              ))}
            </div>
            <div className="quick-prompts">
              {prompts.map((prompt) => (
                <Button
                  key={prompt}
                  className="secondary-button"
                  onClick={() => send(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
            <form
              className="chat-compose"
              onSubmit={(event) => {
                event.preventDefault();
                send(draft);
              }}
            >
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Выберите готовый запрос выше или напишите..."
              />
              <Button
                type="primary"
                htmlType="submit"
                icon={<Send size={16} />}
              />
            </form>
          </Card>
          <div className="side-panels">
            <Card className="panel-card">
              <h3>Что умеет помощник</h3>
              {[
                "Подсказать статус заказа",
                "Показать типовые причины задержек",
                "Направить к нужному разделу",
                "Передать вопрос логисту",
              ].map((item) => (
                <div className="check-line" key={item}>
                  <CheckCircle2 size={16} />
                  {item}
                </div>
              ))}
            </Card>
            <Card className="panel-card">
              <h3>Уведомления</h3>
              {[
                "Заказ № 10425 · Отмечена проблема при доставке",
                "Заказ № 10426 · Исполнитель пока не назначен",
                "Сценарий обновлён · Добавлен ответ по срокам",
              ].map((item) => (
                <div className="notification" key={item}>
                  {item}
                </div>
              ))}
            </Card>
          </div>
        </div>
        <div className="page-foot">
          Рабочее пространство <span>04 / Светлана</span>
        </div>
      </div>
    </>
  );
}

export default function AssistantPage() {
  const [collapsed, setCollapsed] = useState(false);
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
        components: { Card: { borderRadius: 10 }, Button: { fontWeight: 600 } },
      }}
    >
      <AntApp>
        <AppShell collapsed={collapsed} setCollapsed={setCollapsed}>
          <AssistantContent />
        </AppShell>
      </AntApp>
    </ConfigProvider>
  );
}
