import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Создать аккаунт можно только по приглашению"
    >
      <div className="permission-note">
        <span>
          Для регистрации откройте персональную ссылку-приглашение от
          администратора. Без действующего приглашения аккаунт не создаётся.
        </span>
      </div>
      <div className="auth-switch">
        <Link to="/login">Вернуться ко входу →</Link>
      </div>
    </AuthLayout>
  );
}
