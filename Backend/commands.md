# 🛠️ EduHMS Enterprise: Commands & Testing Playbook

This document contains all the commands to run, seed, test, and verify the **EduHMS (Hospital Management System & Electronic Medical Records)** platform across local development, testing, and production environments.

---

## 📑 Table of Contents
1. [Prerequisites & Local Infrastructure](#1-prerequisites--local-infrastructure)
2. [Database Migration & Seeding](#2-database-migration--seeding)
3. [Running the Backend API](#3-running-the-backend-api)
4. [Running the Frontend Application](#4-running-the-frontend-application)
5. [API Testing & cURL Test Suite](#5-api-testing--curl-test-suite)
6. [Production Deployment Commands](#6-production-deployment-commands)
7. [Demo Staff Credentials](#7-demo-staff-credentials)

---

## 1. Prerequisites & Local Infrastructure

### Start Supporting Docker Services (PostgreSQL 16, Redis 7, MinIO S3)
```bash
cd c:\Users\amadu\Desktop\HMS101\Backend

# Start containers in background
docker compose up -d

# Check status of containers
docker compose ps
```

### Stop Supporting Services
```bash
docker compose down
```

---

## 2. Database Migration & Seeding

```bash
cd c:\Users\amadu\Desktop\HMS101\Backend

# 1. Regenerate Prisma Client
npm run prisma:generate

# 2. Push Prisma Schema to PostgreSQL Database
npm run prisma:push

# 3. Seed Demo Branches, Departments, Demo Users, and CDSS Interaction Rules
npm run prisma:seed

# 4. (Optional) Open Prisma Studio Database GUI
npm run prisma:studio
```

---

## 3. Running the Backend API

```bash
cd c:\Users\amadu\Desktop\HMS101\Backend

# Start in Development Mode (with Hot Reload / Watcher)
npm run start:dev

# Start in Production Mode
npm run start:prod

# Compile TypeScript Code (Build Check)
npm run build
```

- **API Base URL:** `http://localhost:4000/api/v1`
- **Interactive Swagger Documentation:** `http://localhost:4000/api/docs`
- **Health Check Endpoint:** `http://localhost:4000/api/v1/health`

---

## 4. Running the Frontend Application

```bash
cd c:\Users\amadu\Desktop\HMS101\Frontend

# Start Frontend Dev Server
npm run dev


# Build Frontend Production Bundle
npm run build
```

- **Frontend URL:** `http://localhost:5173`

---

## 5. API Testing & cURL Test Suite

Open a new terminal to run these tests against your running API (`http://localhost:4000`):

### 5.1 System Health Check
```bash
curl -X GET http://localhost:4000/api/v1/health
```

---

### 5.2 Authentication & Login
```bash
# Login using Work Email
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dr.mensah@eduhms.gh\",\"password\":\"Password123!\"}"

# Or Login using Staff ID / Number
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"EMP-DOC-003\",\"password\":\"Password123!\"}"
```


---

### 5.3 Patient Registration & Records
```bash
# Register a Patient with Emergency Contact and Penicillin Allergy
curl -X POST http://localhost:4000/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d "{
    \"fullName\": \"Adjoa Mensah\",
    \"dateOfBirth\": \"1992-05-18\",
    \"gender\": \"Female\",
    \"phone\": \"+233245551234\",
    \"address\": \"House 45, Ring Road Central, Accra\",
    \"bloodGroup\": \"O+\",
    \"registrationBranchId\": \"accra-main-branch-001\",
    \"emergencyContacts\": [{
      \"contactName\": \"Kofi Mensah\",
      \"relationship\": \"Spouse\",
      \"phone\": \"+233249998888\"
    }],
    \"allergies\": [{
      \"allergenName\": \"Penicillin\",
      \"severity\": \"Severe\",
      \"reaction\": \"Facial swelling and hives\"
    }]
  }"
```

---

### 5.4 Triage Vital Signs & Clinical Alerts
```bash
# Record Vitals (Triggers Hypertension & Fever Alerts + BMI Calculation)
curl -X POST http://localhost:4000/api/v1/vitals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d "{
    \"patientId\": \"PAT-001\",
    \"bpSystolic\": 145,
    \"bpDiastolic\": 95,
    \"pulseRate\": 104,
    \"temperature\": 38.7,
    \"weightKg\": 74.0,
    \"heightCm\": 168.0,
    \"spo2\": 97
  }"
```

---

### 5.5 Appointments & Live Waiting Room Queue
```bash
# View Today's Active Triage Queue (Scheduled, Checked-in, In Progress)
curl -X GET http://localhost:4000/api/v1/appointments/queue/today \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Or View All Today's Appointments (Including No-show and Completed for Reception)
curl -X GET "http://localhost:4000/api/v1/appointments/queue/today?allStatuses=true&branchId=accra-main-branch-001" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```


---

### 5.6 Pharmacy & CDSS Drug-Drug Interaction Safety
```bash
# Cross-Examine Drug Combinations against CDSS Rules
curl -X POST http://localhost:4000/api/v1/pharmacy/cdss/check-interactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d "{\"drugNames\": [\"Aspirin\", \"Warfarin\", \"Ciprofloxacin\"]}"
```

---

### 5.7 Billing & Accounting Overview
```bash
# Get Financial Executive Overview
curl -X GET http://localhost:4000/api/v1/accounting/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 6. Production Deployment Commands (Contabo Cloud VPS 6)

```bash
# 1. Build and Start Full Production Stack
docker compose -f docker-compose.prod.yml up -d --build

# 2. Check Container Health
docker compose -f docker-compose.prod.yml ps

# 3. Run Production Database Migrations
docker compose -f docker-compose.prod.yml exec app npx prisma db push

# 4. Run Production Seeder
docker compose -f docker-compose.prod.yml exec app npm run prisma:seed

# 5. View Production Application Logs
docker compose -f docker-compose.prod.yml logs -f app
```

---

## 7. Demo Staff Credentials

| Role | Email | Password |
|---|---|---|
| **CTO** | `cto@eduhms.gh` | `Password123!` |
| **Administrator** | `admin@eduhms.gh` | `Password123!` |
| **Lead Physician** | `dr.mensah@eduhms.gh` | `Password123!` |
| **Chief Pharmacist** | `pharmacist@eduhms.gh` | `Password123!` |
| **Senior Lab Scientist** | `lab@eduhms.gh` | `Password123!` |
| **Receptionist** | `reception@eduhms.gh` | `Password123!` |
| **Head Accountant** | `accountant@eduhms.gh` | `Password123!` |
