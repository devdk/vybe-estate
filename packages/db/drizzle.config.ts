// Plain object (no drizzle-kit import) so `npx drizzle-kit` works without
// installing it in the workspace; see the db scripts in package.json.
export default {
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  casing: "snake_case",
  extensionsFilters: ["postgis"],
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://vybe:vybe@localhost:5432/vybe" },
};
