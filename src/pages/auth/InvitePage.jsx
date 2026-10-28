import { useEffect, useState } from "react";
import { Alert, Button, Form, Input } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import { redeemInvitation, verifyInvitation } from "../../api/invitations.js";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verification, setVerification] = useState({
    token: null,
    invitation: null,
    error: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const loading = verification.token !== token;
  const invitation = loading ? null : verification.invitation;
  const error = loading ? "" : verification.error;

  useEffect(() => {
    let current = true;
    verifyInvitation(token)
      .then((result) => {
        if (current) setVerification({ token, invitation: result, error: "" });
      })
      .catch((requestError) => {
        if (current)
          setVerification({
            token,
            invitation: null,
            error: requestError.message,
          });
      });
    return () => {
      current = false;
    };
  }, [token]);

  const register = async (values) => {
    setSubmitting(true);
    setVerification((current) => ({ ...current, error: "" }));
    try {
      await redeemInvitation(token, {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      navigate("/");
    } catch (requestError) {
      setVerification({ token, invitation, error: requestError.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={
        loading
          ? "Проверка приглашения"
          : invitation
            ? "Регистрация по приглашению"
            : "Приглашение недействительно"
      }
      subtitle={
        loading
          ? "Проверяем статус и срок действия ссылки"
          : invitation
            ? `Роль: ${invitation.role}`
            : "Ссылка не найдена, уже использована или срок её действия истёк"
      }
    >
      {loading ? null : invitation ? (
        <Form layout="vertical" onFinish={register}>
          <Form.Item
            label="ИМЯ И ФАМИЛИЯ"
            name="name"
            rules={[{ required: true, message: "Введите имя" }]}
          >
            <Input placeholder="Как к вам обращаться?" />
          </Form.Item>
          <Form.Item
            label="EMAIL"
            name="email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Проверьте email" },
            ]}
          >
            <Input placeholder="name@company.ru" />
          </Form.Item>
          <Form.Item
            label="ПАРОЛЬ"
            name="password"
            rules={[
              { required: true, message: "Введите пароль" },
              { min: 8, message: "Не менее 8 символов" },
            ]}
          >
            <Input.Password placeholder="Не менее 8 символов" />
          </Form.Item>
          <Form.Item
            label="ПОДТВЕРДИТЕ ПАРОЛЬ"
            name="confirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Повторите пароль" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || getFieldValue("password") === value
                    ? Promise.resolve()
                    : Promise.reject(new Error("Пароли не совпадают"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Повторите пароль" />
          </Form.Item>
          {error && <Alert type="error" showIcon title={error} />}
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Зарегистрироваться
          </Button>
        </Form>
      ) : (
        <Alert
          type="warning"
          showIcon
          title={error || "Запросите новую ссылку у администратора"}
        />
      )}
      <div className="auth-switch">
        <Link to="/login">Перейти ко входу →</Link>
      </div>
    </AuthLayout>
  );
}
