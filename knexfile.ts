import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3"
    },
    useNullAsDefault: true
  },
  production: {
    client: "sqlite3",
    connection: {
      filename: "./data.sqlite3"
    },
    useNullAsDefault: true
  }
};

module.exports = config;
