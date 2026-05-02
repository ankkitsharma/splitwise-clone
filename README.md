# Splitwise MVP (Express + Sequelize)

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=Sequelize&logoColor=white)

Backend MVP for shared expenses: **users**, **expenses** (equal split among members), and **per-person balances** by currency. Built on the [express-sequelize-boilerplate](https://github.com/gadfaria/express-sequelize-boilerplate) stack (Node.js, Express, Sequelize, MySQL/PostgreSQL/SQLite, etc.).

## Features

- **Users:** register with email/password, default currency, profile (`GET /user/me`), update profile, delete account (blocked if the user is still linked to expenses).
- **Expenses:** create with name, amount, currency, date, members (user IDs), and payer (defaults to the caller). Equal split across members. List, get, update, and delete (creator or payer).
- **Balances:** net amount per other user and currency. Positive `balanceAmount` means **they owe you**; negative means **you owe them**.

## Identity for API calls (no full auth layer)

Per the take-home spec, **assume the current user id is provided on the request**:

- Set header **`X-User-Id`** to a valid user id (e.g. from `POST /user` or `POST /login` response).

If **`SERVER_JWT`** is not `false`, you can still use **Bearer JWT** (e.g. after `POST /login`) instead of `X-User-Id`. If `SERVER_JWT=false`, only `X-User-Id` works for protected routes.

## Getting started

```bash
cd splitwise-clone
yarn
cp .env.example .env
```

Fill in `SERVER_PORT`, database settings (`DB_DIALECT`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`), and optionally `SERVER_JWT`, `SERVER_JWT_SECRET`, `SERVER_JWT_TIMEOUT`. For “header-only” auth, set `SERVER_JWT=false`.

Create the database and run migrations:

```bash
yarn sequelize db:create
yarn sequelize db:migrate
```

Start the server:

```bash
yarn dev
```

## API overview

| Method | Path            | Description                                                                                                                      |
| ------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/user`         | Create user (name, email, password, optional `defaultCurrency`)                                                                  |
| GET    | `/user/me`      | Current user profile — needs `X-User-Id` or JWT                                                                                  |
| PUT    | `/user`         | Update profile (email, `defaultCurrency`, password, etc.)                                                                        |
| DELETE | `/user`         | Delete own account (if no related expenses)                                                                                      |
| GET    | `/user`         | List all users (demo)                                                                                                            |
| GET    | `/user/:id`     | Get user by id                                                                                                                   |
| POST   | `/expenses`     | Create expense: `name`, `value`, `currency`, `date` (ISO date), `memberIds` (array, must include payer), optional `paidByUserId` |
| GET    | `/expenses`     | List expenses the user is involved in                                                                                            |
| GET    | `/expenses/:id` | Expense detail                                                                                                                   |
| PUT    | `/expenses/:id` | Update expense                                                                                                                   |
| DELETE | `/expenses/:id` | Delete expense                                                                                                                   |
| GET    | `/balances`     | Balances with every other user, grouped by currency                                                                              |

`POST /login` still returns a user and token if JWT is enabled.

## Postman

Import **`postman.json`** into Postman. Set the **`server_url`** variable (e.g. `http://localhost:3000`) and **`user_id`** after registering or logging in. Requests that need a current user include the **`X-User-Id`** header.

## Sequelize CLI

```bash
yarn sequelize db:migrate
yarn sequelize db:migrate:undo:all
```
