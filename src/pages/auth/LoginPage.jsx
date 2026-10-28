import { Alert, Button, Form, Input } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginWithCredentials } from "../../api/auth.js";
import AuthLayout from "./AuthLayout.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const login = async (credentials) => {
    setError("");
    setSubmitting(true);
    try {
      await loginWithCredentials(credentials);
      navigate("/");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Вход в систему"
      subtitle="Управляйте доставками в одном рабочем пространстве"
    >
      <Form layout="vertical" onFinish={login}>
        <Form.Item
          label="EMAIL"
          name="email"
          rules={[
            { required: true, message: "Введите email" },
            { type: "email", message: "Проверьте email" },
          ]}
        >
          <Input autoComplete="email" placeholder="name@company.ru" />
        </Form.Item>
        <Form.Item
          label="ПАРОЛЬ"
          name="password"
          rules={[{ required: true, message: "Введите пароль" }]}
        >
          <Input.Password
            autoComplete="current-password"
            placeholder="Введите пароль"
          />
        </Form.Item>
        {error && <Alert type="error" showIcon title={error} />}
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Войти
        </Button>
      </Form>
      <div className="auth-switch">
        Нет аккаунта? <Link to="/register">Регистрация по приглашению →</Link>
      </div>
    </AuthLayout>
  );
}
