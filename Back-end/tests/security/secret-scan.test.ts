import fs from 'fs';
import path from 'path';

describe('Phase 17 — Secret Audit & Scanning', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const srcDir = path.resolve(rootDir, 'src');
  const docsDir = path.resolve(rootDir, 'docs');
  const envExamplePath = path.resolve(rootDir, '.env.example');
  const gitignorePath = path.resolve(rootDir, '.gitignore');

  // Patterns indicating live credentials or private keys
  const SECRET_PATTERNS = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /mongodb\+srv:\/\/[^:]+:[^@]+@/,
    /cloudinary:\/\/[0-9]+:[a-zA-Z0-9_-]+@/,
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, // real JWT tokens
    /AKIA[0-9A-Z]{16}/, // AWS Access Key ID
  ];

  function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
          getFilesRecursively(fullPath, fileList);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.json') || entry.name.endsWith('.md'))) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  it('verifies .env.example contains placeholders only and zero real credentials', () => {
    expect(fs.existsSync(envExamplePath)).toBe(true);
    const content = fs.readFileSync(envExamplePath, 'utf8');

    // Secrets must have empty values or development placeholders
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim();

      if (['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI', 'CLOUDINARY_API_SECRET', 'SMTP_PASSWORD'].includes(key)) {
        // Must be empty in .env.example
        expect(val).toBe('');
      }
    }
  });

  it('verifies .gitignore properly excludes .env and logs', () => {
    expect(fs.existsSync(gitignorePath)).toBe(true);
    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toMatch(/^\.env$/m);
    expect(content).toMatch(/^\*\.log$/m);
  });

  it('scans all source files and documentation for committed private keys and live credentials', () => {
    const srcFiles = getFilesRecursively(srcDir);
    const docFiles = getFilesRecursively(docsDir);
    const allFiles = [...srcFiles, ...docFiles];

    expect(allFiles.length).toBeGreaterThan(10);

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of SECRET_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          throw new Error(`Potential secret leak detected in ${file}: matches ${pattern.toString()}`);
        }
      }
    }
  });
});
