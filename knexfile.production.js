// Production knexfile — uses compiled JS migrations (no ts-node required)
module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  migrations: {
    directory: './dist/core/database/migrations',
    extension: 'js',
    loadExtensions: ['.js'],
  },
  pool: {
    min: 2,
    max: 10,
  },
};
