export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard",
    "/units",
    "/tenants",
    "/utility-usage",
    "/billing",
    "/cleaning",
    "/maintenance",
    "/staffs",
    "/parcels",
    "/setting",
  ],
};
