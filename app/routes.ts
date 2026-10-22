import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("customers", "routes/customers.tsx"),
  route("customers/new", "routes/customer-new.tsx"),
  route("customers/:id", "routes/customer.tsx"),
  route("staff/:id", "routes/staff.tsx"),
  route("logs", "routes/logs.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
