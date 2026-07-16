Postgres migration plan

This document describes steps to migrate from the current SQLite setup to Postgres and to run the backend as a server-capable service or serverless functions.

1) Provision Postgres
   - Use a managed Postgres provider (Heroku Postgres, Railway, Render, ElephantSQL, AWS RDS, Supabase) and create a database.
   - Note the DATABASE_URL (postgres://user:password@host:port/dbname)

2) Create the users table in Postgres
   Example SQL (adjust types as needed):

   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     fullname TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     passwordhash TEXT NOT NULL,
     role TEXT NOT NULL
   );

3) Update backend to use Postgres
   - The repo includes backend/db_postgres.js as a simple query helper using `pg`.
   - Replace SQLite queries in server.js with Postgres queries using db_postgres.query(sql, params).
   - Example select:
       const res = await db.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
       const user = res.rows[0];

4) Migrate existing data (if any)
   - Export sqlite data and import into Postgres. You can use tools like `sqlite3` + `pgloader` or a simple script that reads from sqlite and writes to Postgres.

5) Serverless considerations
   - For Vercel serverless functions, use DATABASE_URL for connections and a connection pooling strategy (PG_BOSS or pg pool with `pg` and `pg-pool` recommended). Beware of many short-lived connections — use a serverless-friendly pooler (e.g., PgBouncer) or a managed provider that supports pooling.
   - Alternatively, host the backend on Render/Railway as a long-running Node process which works well with Postgres and persistent DB connections.

6) Environment variables
   - Set DATABASE_URL in your host environment.
   - Set JWT_SECRET and ALLOWED_ORIGINS too.

7) Testing
   - Run the server locally with DATABASE_URL set and verify signup/login work against Postgres.

8) Rollout
   - Deploy backend and point frontend to the deployed backend via window.API_BASE_URL.

If you want, I can update server.js to use the Postgres helper directly and convert the endpoints now — say "Yes, migrate code" and I will modify server.js to support both sqlite and postgres based on env configuration.
