# Dropwise 💧

Dropwise is building the operating layer for service communication. The product helps MSPs, IT support teams, and service desks manage work from the communication tools they already use while staying synchronized with the ticketing systems their business depends on. 🚀

Dropwise gives support organizations a unified way to route, respond to, track, and manage service work across chat, messaging, and ticketing environments. Instead of forcing teams to work across disconnected systems, Dropwise keeps communication, ticket activity, ownership, and operational visibility aligned in one workflow layer.

## ⚠️ What problem Dropwise solves

Support teams communicate in one place, update tickets in another, and manage operations somewhere in between. That split creates operational drag:

- technicians respond in chat while official ticket records live elsewhere
- updates get missed or delayed
- context switching slows response times
- duplicate work and weak accountability become more common
- managers struggle to see backlog, ownership, and response discipline clearly

Dropwise closes that gap by acting as the workflow layer between communication channels and service systems.

## ✅ Product value

Dropwise is designed to help support organizations:

- bring ticket activity into the tools where technicians already collaborate 💬
- keep the system of record updated for billing, documentation, and client history 🧾
- route work automatically to the right people, teams, or channels 🎯
- improve response discipline and ticket handling consistency ⏱️
- give service leaders visibility into backlog, workload, and response times 📊

The goal is not to force a rip-and-replace. The goal is to make support teams faster, more consistent, and easier to manage while fitting into the tools the business already depends on.

## 🌐 Business positioning

Dropwise is not a chat plugin or a point integration. It is a service operations platform.

The broader company direction is:

- one workflow and operational inbox layer across communication channels 💬
- one synchronization layer across ticketing, PSA, and helpdesk platforms 🔄
- one place to route, respond, track, and automate service work across fragmented tools ⚙️

The vision is a cross-channel support operations platform that standardizes service communication and workflow without locking customers to a single vendor. Whether teams work in Slack, Microsoft Teams, SMS, or future channels, and whether their source systems live in ConnectWise or other platforms, Dropwise is designed to sit in the middle and keep work moving cleanly.

## 👥 Who it is for

- Buyers: MSP owners, operations leads, and service desk managers 🏢
- Daily users: technicians, dispatchers, and support coordinators 👨‍💻

The core pitch is simple: reduce context switching, improve response discipline, increase technician efficiency, and give service leaders better operational control.

## 🧱 Current repository

This repository currently contains:

- `apps/web`: a Next.js web application
- `apps/api`: a Spring Boot API service
- `archive/dropwise`: the previous full implementation, retained as a migration reference for backend domain logic, integrations, tenancy, and security

## 🛠️ Local development

### Web app 🌐

```bash
cd apps/web
npm install
npm run dev
```

### API 🔌

```bash
cd apps/api
./mvnw spring-boot:run
```

### Tests 🧪

API tests:

```bash
cd apps/api
./mvnw test
```

Web linting:

```bash
cd apps/web
npm run lint
```
