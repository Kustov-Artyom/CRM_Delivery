export const DELIVERY_RATES = {
  courier_standard: { name: "Стандарт (авто)", base: 200, perKm: 25 },
  courier_express: { name: "Экспресс", base: 350, perKm: 40 },
  courier_pedestrian: { name: "Пеший курьер", base: 150, perKm: 15 },
};

export function calculateDeliveryCost(distanceMeters, tariffKey = "courier_standard") {
  if (!distanceMeters) return 0;
  const km = distanceMeters / 1000;
  const tariff = DELIVERY_RATES[tariffKey] || DELIVERY_RATES.courier_standard;
  return Math.round(tariff.base + km * tariff.perKm);
}

export function getOrderAddresses(order) {
  if (order.from || order.to) {
    return {
      from: order.from || "",
      to: order.to || "",
    };
  }

  const [from = "", ...destination] = (order.route || "").split(" → ");
  return {
    from,
    to: destination.join(" → "),
  };
}

export function getOrderFormValues(order) {
  return {
    ...order,
    ...getOrderAddresses(order),
    tariff: order.tariff || "courier_standard",
  };
}

export function withOrderAddresses(values) {
  return {
    ...values,
    route: `${values.from} → ${values.to}`,
  };
}