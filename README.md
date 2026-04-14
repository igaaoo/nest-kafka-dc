# 🚗 NestJS Kafka — Vehicle Distribution Center API

A microservices-based system built with **NestJS** and **Apache Kafka** to manage vehicle distribution across different patios (yards). The architecture consists of an **API Gateway** that exposes HTTP endpoints and two microservices that communicate asynchronously via Kafka topics.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (HTTP)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway                           │
│              NestJS REST API  —  Port 3000                  │
│                                                             │
│   POST /auth/register     POST /dc/vehicle                  │
│   POST /dc/transaction    PATCH /dc/entry                   │
│                                                             │
│   [retry + timeout on all Kafka send() calls]               │
└──────────────┬──────────────────────────┬───────────────────┘
               │         Kafka            │
               ▼                          ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│   Auth Microservice  │    │       DC Microservice        │
│                      │◄───│  (calls auth via Kafka)      │
│  Manages users       │    │                              │
│                      │    │  Manages vehicles &          │
│                      │    │  transactions                │
└──────────┬───────────┘    └──────────────┬───────────────┘
           │                               │
           ▼                               ▼
  ┌─────────────────┐             ┌─────────────────┐
  │    auth_db      │             │     dc_db       │
  │  (PostgreSQL)   │             │  (PostgreSQL)   │
  │  schema: auth   │             │  schema: cd     │
  │  └─ users       │             │  ├─ vehicles    │
  └─────────────────┘             │  └─ transactions│
                                  └─────────────────┘
```

> **Database-per-service**: each microservice owns its own isolated database.
> Cross-service data integrity (e.g., checking if a user exists) is enforced at
> the application level via Kafka, not by database foreign keys.

---

## 🧩 Services

### `api-gateway`
The entry point for all HTTP requests. Validates incoming payloads using DTOs (`class-validator`) and forwards them to the appropriate microservice via Kafka.

- Runs on **port 3000**
- All Kafka calls use **exponential-backoff retry** with a 5 s timeout (up to 3 retries)
- On exhausted retries returns `503 Service Unavailable`

### `auth-microservice`
Handles user management. Listens for Kafka messages and interacts with `auth_db` (schema `auth`) via **Prisma**.

- Kafka topics: `auth.register`, `get_user`
- Stores users with `ATIVO` / `DESATIVADO` status

### `dc-microservice`
Handles vehicle and transaction management. Listens for Kafka messages, interacts with `dc_db` (schema `cd`) via **Prisma**, and calls `auth-microservice` via Kafka to validate users.

- Kafka topics: `transaction.create`, `vehicle.create`, `vehicle.entry`
- Stores vehicles and tracks their movement between patios via transactions

---

## 🗄️ Database Schema

Each microservice has its **own dedicated PostgreSQL database** running in the same container.

### `auth_db` — owned by `auth-microservice`

#### `auth.users`
| Column       | Type      | Description                 |
|-------------|-----------|-----------------------------|
| `user_id`   | SERIAL PK | Auto-incremented user ID    |
| `username`  | TEXT      | Unique username             |
| `status`    | TEXT      | `ATIVO` or `DESATIVADO`     |
| `created_at`| TIMESTAMP | Record creation timestamp   |

---

### `dc_db` — owned by `dc-microservice`

#### `cd.vehicles`
| Column       | Type      | Description                    |
|-------------|-----------|--------------------------------|
| `chassi`    | TEXT PK   | Vehicle chassis number         |
| `modelo`    | TEXT      | Vehicle model                  |
| `patio`     | TEXT      | Current yard/patio location    |
| `created_at`| TIMESTAMP | Record creation timestamp      |

#### `cd.transactions`
| Column        | Type      | Description                                          |
|--------------|-----------|------------------------------------------------------|
| `id`         | SERIAL PK | Auto-incremented transaction ID                      |
| `chassi`     | TEXT FK   | References `cd.vehicles`                            |
| `username`   | TEXT      | Username (validated via Kafka, no cross-DB FK)      |
| `destination`| TEXT      | Target patio for the vehicle                         |
| `status`     | TEXT      | `ABERTA`, `EXECUTADA`, or `ENCERRADA`               |
| `created_at` | TIMESTAMP | Record creation timestamp                            |

> `username` replaces the former `user_id` FK. Since `auth_db` and `dc_db` are
> separate databases, cross-database foreign keys are not possible in PostgreSQL.
> User existence is validated at runtime via the `get_user` Kafka topic.

---

## 🌐 API Endpoints

All endpoints are exposed by the **API Gateway** at `http://localhost:3000`.

### Auth

#### `POST /auth/register`
Registers a new user in the system.

**Request Body:**
```json
{
  "username": "john_doe"
}
```

---

### DC (Distribution Center)

#### `POST /dc/vehicle`
Registers a new vehicle in the system.

**Request Body:**
```json
{
  "username": "john_doe",
  "chassi": "ABC123",
  "model": "Toyota Corolla",
  "patio": "PATIO-A"
}
```

#### `POST /dc/transaction`
Creates an open transaction to move a vehicle to a different patio.

**Request Body:**
```json
{
  "username": "john_doe",
  "chassi": "ABC123",
  "destination": "PATIO-B"
}
```

**Business Rules:**
- The user must exist (validated via Kafka → `auth-microservice`)
- The vehicle must exist
- The vehicle must not already be at the destination patio
- There must be no other open (`ABERTA`) transaction for the same vehicle

#### `PATCH /dc/entry`
Confirms the physical entry of a vehicle into its destination patio, marking the transaction as `EXECUTADA` and updating the vehicle's current patio.

**Request Body:**
```json
{
  "username": "john_doe",
  "chassi": "ABC123",
  "destination": "PATIO-B"
}
```

---

## 🔄 Kafka Topics

| Topic                | Producer        | Consumer           | Description                        |
|---------------------|-----------------|--------------------|------------------------------------|
| `auth.register`     | API Gateway     | Auth Microservice  | Register a new user                |
| `get_user`          | DC Microservice | Auth Microservice  | Look up a user by username         |
| `transaction.create`| API Gateway     | DC Microservice    | Create a vehicle transaction       |
| `vehicle.create`    | API Gateway     | DC Microservice    | Register a new vehicle             |
| `vehicle.entry`     | API Gateway     | DC Microservice    | Confirm vehicle entry into a patio |

---

## 🛡️ Resilience — Kafka Retry

All Kafka `send()` calls in the API Gateway are wrapped with a retry pipeline (`api-gateway/src/common/kafka-retry.util.ts`):

| Parameter       | Value | Description                                      |
|----------------|-------|--------------------------------------------------|
| `timeoutMs`    | 5000  | Max wait for a response before timing out        |
| `maxRetries`   | 3     | Max retry attempts after a failure               |
| `baseDelayMs`  | 500   | Initial delay; doubles on each retry (backoff)   |

**Retry delays:** 500 ms → 1000 ms → 2000 ms → `503 Service Unavailable`

Kafka client connections (broker-level) also have a built-in retry policy in all `ClientsModule` configurations:

```
retries: 5 | initialRetryTime: 300 ms | factor: 0.2
```

---

## 🛠️ Tech Stack

| Technology          | Version  | Role                             |
|--------------------|----------|----------------------------------|
| NestJS             | ^11.0.1  | Framework for all services       |
| KafkaJS            | ^2.2.4   | Kafka client for Node.js         |
| Prisma             | ^7.7.0   | ORM for PostgreSQL               |
| PostgreSQL         | 15       | Relational database (2 DBs)      |
| Docker / Compose   | —        | Infrastructure & orchestration   |
| Kafdrop            | latest   | Kafka UI for monitoring          |
| class-validator    | ^0.15.1  | DTO validation in API Gateway    |
| RxJS               | ^7.8.1   | Retry/timeout operators          |
| TypeScript         | ^5.7.3   | Language used across all services|

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/)

---

### Running with Docker Compose (Recommended)

This starts **all infrastructure and services** (Kafka, Zookeeper, PostgreSQL, Kafdrop, and all three NestJS apps):

```bash
cd docker-compose
docker compose up --build
```

Once running:
- API Gateway: `http://localhost:3000`
- Kafdrop (Kafka UI): `http://localhost:9000`
- PostgreSQL: `localhost:5432` (databases: `auth_db`, `dc_db`)

> ⚠️ If you previously ran the project with the old single-database setup,
> remove the existing volume before rebuilding:
> ```bash
> docker compose down -v
> docker compose up --build
> ```

---

### Running Locally (Development)

First, start the infrastructure:
```bash
cd docker-compose
docker compose up kafka postgres kafdrop
```

Then, in separate terminals, start each service:

**API Gateway:**
```bash
cd api-gateway
npm install
npm run dev
```

**Auth Microservice:**
```bash
cd auth-microservice
npm install
npm run dev
```

**DC Microservice:**
```bash
cd dc-microservice
npm install
npm run dev
```

---

### Environment Variables

**`auth-microservice/.env`**
```env
KAFKA_BROKER=localhost:9092
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
```

**`dc-microservice/.env`**
```env
KAFKA_BROKER=localhost:9092
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dc_db
```

> The API Gateway reads `KAFKA_BROKER` from the environment directly (set via Docker Compose or shell).

---

## 📁 Project Structure

```
nest-kafka/
├── api-gateway/              # HTTP REST entry point
│   └── src/
│       ├── common/
│       │   └── kafka-retry.util.ts  # Shared retry + timeout pipeline
│       ├── auth/             # Auth routes → Kafka producer
│       └── dc/               # DC routes → Kafka producer
│           └── dto/          # Request validation DTOs
│
├── auth-microservice/        # User management service
│   ├── prisma/               # Schema for auth_db (auth.users)
│   └── src/
│       ├── user/             # User controller & service
│       └── database/         # Prisma service
│
├── dc-microservice/          # Vehicle & transaction service
│   ├── prisma/               # Schema for dc_db (cd.vehicles + cd.transactions)
│   └── src/
│       ├── dc/               # DC controller & service
│       └── database/         # Prisma service
│
└── docker-compose/
    ├── docker-compose.yaml   # Full stack orchestration
    └── init.sql              # Creates auth_db and dc_db with their schemas
```

---

## 📜 License

This project is unlicensed and intended for study purposes.
