import { App as AntApp, ConfigProvider } from "antd";
import { Brand } from "../../shell/AppShell.jsx";
import "../../App.css";

export default function AuthLayout({ title, subtitle, children }) {
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
      }}
    >
      <AntApp>
        <div className="auth-page">
          <section className="auth-promo">
            <Brand />
            <div className="promo-copy">
              <small>ПЛАТФОРМА УПРАВЛЕНИЯ ДОСТАВКОЙ</small>
              <h1>
                Все доставки.
                <br />
                Под вашим контролем.
              </h1>
              <p>
                Заказы, исполнители, маршруты и аналитика
                <br />в одном удобном рабочем пространстве.
              </p>
              <div className="promo-steps">
                {[
                  "Создание заказа",
                  "Назначение исполнителя",
                  "Контроль выполнения",
                ].map((item, index) => (
                  <div key={item}>
                    <span>0{index + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="auth-form-side">
            <div className="auth-form">
              <h1>{title}</h1>
              <p>{subtitle}</p>
              {children}
            </div>
            <small className="auth-copyright">© 2026 Delivery / OS</small>
          </section>
        </div>
      </AntApp>
    </ConfigProvider>
  );
}
