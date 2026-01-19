# 🚀 E-OFFICE PKL - Quick Setup Guide

Panduan instalasi pertama kali untuk **E-Office Persuratan FSM UNDIP**.

---

## 📋 Prerequisites

- **Bun** >= 1.1.6
- **Docker & Docker Compose**
- **Git**

```bash
bun --version    # 1.1.6+
docker --version # 24.x+
```

---

## ⚡ Quick Start

### 1️⃣ Clone & Install
```bash
git clone https://github.com/your-org/eoffice-PKL-monorepo.git
cd eoffice-PKL-monorepo
```

### 2️⃣ Database Setup
```bash
cd e-office-api-v2
docker compose -f docker-compose.dev.yml up -d
```

### 3️⃣ Backend Setup
```bash
# Install dependencies
bun install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://e-office-api-v2:90d467e0d673bc1a8fba21ed@localhost:5432/e-office-api-v2"
NODE_ENV=development
PORT=3000
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=e-office-files
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
EOF

# Setup database
bunx prisma generate
bunx prisma migrate deploy
bun run src/db/seed.ts
```

### 4️⃣ Frontend Setup
```bash
cd ../e-office-webapp-v2
bun install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
```

### 5️⃣ MinIO Setup (Optional)
```bash
docker run -d --name minio \
  -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

### 6️⃣ Run Application
```bash
# Terminal 1 - Backend
cd e-office-api-v2 && bun run dev

# Terminal 2 - Frontend
cd e-office-webapp-v2 && bun run dev
```

---

## 🔐 Test Login

| Role | Email | Password |
|------|-------|----------|
| Superadmin | superadmin@fsm.internal | password1234 |
| Mahasiswa | mahasiswa@students.undip.ac.id | password1234 |

**URLs:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/swagger
- MinIO: http://localhost:9001

---

## 🐛 Common Issues

**Port already in use:**
```bash
lsof -i :3000    # Check port
kill -9 <PID>    # Kill process
```

**Database error:**
```bash
docker ps                                  # Check container
docker restart e-office-api-v2-postgres   # Restart
```

**Module not found:**
```bash
rm -rf node_modules bun.lockb
bun install
bunx prisma generate
```

---

## 📚 Next Steps

- Read: [BUSINESS_PROCESS.md](BUSINESS_PROCESS.md)
- Prisma Studio: `bunx prisma studio`
- Development: `bun run dev`

✅ **Ready!**
