#!/bin/bash
set -e

echo "======================================="
echo "  theBequer - VPS Deployment Script"
echo "======================================="

# ── 1. System update & Docker install ──────────────────────────────────────
echo "[1/6] Updating system & installing dependencies..."
apt-get update -qq
apt-get install -y -qq curl git ca-certificates gnupg lsb-release

# Install Docker if not present
if ! command -v docker &>/dev/null; then
  echo "  → Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "  → Docker already installed: $(docker --version)"
fi

# Install Docker Compose plugin if not present
if ! docker compose version &>/dev/null; then
  echo "  → Installing Docker Compose plugin..."
  apt-get install -y -qq docker-compose-plugin
fi

echo "  → Docker Compose: $(docker compose version)"

# ── 2. Clone / update repo ─────────────────────────────────────────────────
APP_DIR="/opt/theBequer"
echo "[2/6] Setting up repository at $APP_DIR..."

if [ -d "$APP_DIR/.git" ]; then
  echo "  → Pulling latest changes..."
  git -C "$APP_DIR" pull origin master
else
  echo "  → Cloning repository..."
  git clone https://github.com/Aizen00Rayen/theBequer.git "$APP_DIR"
fi

cd "$APP_DIR"

# ── 3. Create .env file ────────────────────────────────────────────────────
echo "[3/6] Creating .env file..."
cat > .env <<'ENVEOF'
DB_NAME=bequer_db
DB_USER=bequer_user
DB_PASSWORD=gr_-lLZa9UdhzNKpGD_yLDoNy5NgnHoP
SECRET_KEY=wM9Nz5pyat-eEg-DJN9rLAAALJjq69GCWK6MYY9EETe9BJifSRr7I_2cf3AwjQUNcbA
FRONTEND_URL=https://thebequer.tech
ENVEOF
chmod 600 .env
echo "  → .env created"

# ── 4. Build & start containers ────────────────────────────────────────────
echo "[4/6] Building and starting Docker containers (this may take a few minutes)..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ── 5. Wait for services & verify ─────────────────────────────────────────
echo "[5/6] Waiting for services to be healthy..."
sleep 10

echo "  → Container status:"
docker compose ps

echo "  → Testing backend health..."
for i in {1..10}; do
  if docker exec bequer_backend curl -sf http://localhost:8000/api/courses/ -o /dev/null 2>/dev/null; then
    echo "  → Backend is responding!"
    break
  fi
  echo "  → Attempt $i/10, waiting 5s..."
  sleep 5
done

# ── 6. SSL with Certbot ────────────────────────────────────────────────────
echo "[6/6] Setting up SSL (Certbot)..."
if ! command -v certbot &>/dev/null; then
  apt-get install -y -qq certbot
fi

echo ""
echo "======================================="
echo "  Deployment Complete!"
echo "======================================="
echo ""
echo "  App is running at:  http://185.170.58.143"
echo "  Django admin:       http://185.170.58.143/admin/"
echo ""
echo "  To create a superuser (admin account):"
echo "    docker exec -it bequer_backend python manage.py createsuperuser"
echo ""
echo "  To enable HTTPS (run after DNS is pointed to this server):"
echo "    certbot certonly --standalone --pre-hook 'docker compose -f /opt/theBequer/docker-compose.yml stop frontend' \\"
echo "                     --post-hook 'docker compose -f /opt/theBequer/docker-compose.yml start frontend' \\"
echo "                     -d thebequer.tech -d www.thebequer.tech"
echo ""
echo "  To view logs:"
echo "    docker compose -C /opt/theBequer logs -f"
echo ""
