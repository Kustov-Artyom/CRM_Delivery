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
  return { ...order, ...getOrderAddresses(order) };
}

export function withOrderAddresses(values) {
  return {
    ...values,
    route: `${values.from} → ${values.to}`,
  };
}
