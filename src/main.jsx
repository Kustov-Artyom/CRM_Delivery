import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App.jsx";
import OrdersLayout from "./pages/orders/OrdersLayout.jsx";
import OrdersListPage from "./pages/orders/OrdersListPage.jsx";
import OrderDetailsPage from "./pages/orders/OrderDetailsPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import InvitePage from "./pages/auth/InvitePage.jsx";
import AssistantPage from "./pages/assistant/AssistantPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/executors" element={<App />} />
        <Route path="/routes" element={<App />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/reports" element={<App />} />
        <Route path="/finance" element={<App />} />
        <Route path="/admin" element={<App />} />
        <Route path="/settings" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/orders" element={<OrdersLayout />}>
          <Route index element={<OrdersListPage />} />
          <Route path=":orderId" element={<OrderDetailsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
