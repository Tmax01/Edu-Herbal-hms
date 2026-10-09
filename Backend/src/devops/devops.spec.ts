import * as fs from 'fs';
import * as path from 'path';

describe('DevOps & Infrastructure Configuration Invariants', () => {
  const backendRoot = path.resolve(__dirname, '../../');
  const frontendRoot = path.resolve(__dirname, '../../../Frontend');

  describe('Container Security & Dockerfile Audits', () => {
    it('Backend Dockerfile enforces multi-stage build, npm ci, and unprivileged user', () => {
      const dockerfilePath = path.join(backendRoot, 'Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(content).toContain('AS builder');
      expect(content).toContain('AS runner');
      expect(content).toContain('npm ci');
      expect(content).toContain('USER node'); // non-root user execution
      expect(content).toContain('EXPOSE 4000');
    });

    it('Frontend Dockerfile enforces multi-stage build, static bundle copying, and Nginx serving', () => {
      const dockerfilePath = path.join(frontendRoot, 'Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(content).toContain('AS builder');
      expect(content).toContain('AS runner');
      expect(content).toContain('npm ci');
      expect(content).toContain('COPY --from=builder /app/dist /usr/share/nginx/html');
      expect(content).toContain('EXPOSE 80');
    });
  });

  describe('Docker Compose Service Health & Topology Invariants', () => {
    it('docker-compose.prod.yml defines healthchecks for postgres and backend app', () => {
      const prodComposePath = path.join(backendRoot, 'docker-compose.prod.yml');
      expect(fs.existsSync(prodComposePath)).toBe(true);

      const content = fs.readFileSync(prodComposePath, 'utf-8');
      // PostgreSQL pg_isready healthcheck
      expect(content).toContain('pg_isready -U postgres');
      // App API healthcheck endpoint
      expect(content).toContain('/api/v1/health');
      // Dependent conditions
      expect(content).toContain('condition: service_healthy');
    });

    it('docker-compose.prod.yml configures persistent volume storage for database and redis', () => {
      const prodComposePath = path.join(backendRoot, 'docker-compose.prod.yml');
      const content = fs.readFileSync(prodComposePath, 'utf-8');

      expect(content).toContain('eduhms_prod_pgdata:');
      expect(content).toContain('eduhms_prod_redisdata:');
      expect(content).toContain('eduhms_prod_miniodata:');
    });
  });

  describe('Nginx Reverse Proxy Security Configuration', () => {
    it('Backend Nginx configuration enforces TLS protocols and reverse proxy headers', () => {
      const confPath = path.join(backendRoot, 'nginx/conf.d/eduhms.conf');
      expect(fs.existsSync(confPath)).toBe(true);

      const content = fs.readFileSync(confPath, 'utf-8');
      expect(content).toContain('TLSv1.2 TLSv1.3');
      expect(content).toContain('proxy_pass http://app:4000');
      expect(content).toContain('proxy_set_header X-Forwarded-For');
      expect(content).toContain('gzip on');
    });

    it('Frontend Nginx configuration enforces security headers and SPA fallback routing', () => {
      const confPath = path.join(frontendRoot, 'nginx.conf');
      expect(fs.existsSync(confPath)).toBe(true);

      const content = fs.readFileSync(confPath, 'utf-8');
      expect(content).toContain('X-Frame-Options "SAMEORIGIN"');
      expect(content).toContain('X-Content-Type-Options "nosniff"');
      expect(content).toContain('try_files $uri $uri/ /index.html');
      expect(content).toContain('gzip on');
    });
  });

  describe('Secrets & Environment Configuration Integrity', () => {
    it('.env.example provides descriptive placeholders without leaking actual credentials', () => {
      const envExamplePath = path.join(backendRoot, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);

      const content = fs.readFileSync(envExamplePath, 'utf-8');
      expect(content).toContain('DATABASE_URL=');
      expect(content).toContain('JWT_SECRET=');
      expect(content).toContain('JWT_REFRESH_SECRET=');
    });
  });
});
