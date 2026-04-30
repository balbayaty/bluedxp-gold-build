/**
 * Codebase Index Generator for Claude AI
 * Simple JavaScript version that works without TypeScript compilation
 * 
 * Usage: node scripts/generate-claude-codebase-index.js
 */

const fs = require('fs');
const path = require('path');

class CodebaseIndexGenerator {
  constructor(rootDir = process.cwd(), outputPath = 'CLAUDE_CODEBASE_INDEX.md') {
    this.rootDir = rootDir;
    this.outputPath = outputPath;
    this.excludePatterns = [
      /node_modules/,
      /\.next/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.cache/,
      /\.env/,
    ];
  }

  async generate() {
    console.log('🔍 Analyzing codebase...');
    
    const index = {
      metadata: this.getMetadata(),
      architecture: this.getArchitecture(),
      modules: this.getModules(),
      services: this.getServices(),
      apiEndpoints: this.getAPIEndpoints(),
      types: this.getTypes(),
      components: this.getComponents(),
      pages: this.getPages(),
      dependencies: this.getDependencies(),
      fileStructure: this.getFileStructure(),
      keyFiles: this.getKeyFiles(),
      gaps: this.identifyGaps(),
    };

    const markdown = this.formatAsMarkdown(index);
    
    fs.writeFileSync(this.outputPath, markdown, 'utf-8');
    console.log(`✅ Codebase index generated: ${this.outputPath}`);
    console.log(`📊 Total size: ${(markdown.length / 1024).toFixed(2)} KB`);
  }

  getMetadata() {
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        name: 'Unknown',
        version: '1.0.0',
        description: 'BlueDXP Platform',
        generatedAt: new Date().toISOString(),
        rootDirectory: this.rootDir,
      };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    return {
      name: packageJson.name || 'hazalyze-asn-module',
      version: packageJson.version || '1.0.0',
      description: packageJson.description || 'BlueDXP Platform - Enterprise Intelligence Operating System',
      generatedAt: new Date().toISOString(),
      rootDirectory: this.rootDir,
    };
  }

  getArchitecture() {
    const archFiles = [
      'docs/ARCHITECTURE/LAYER_INTERACTION_ARCHITECTURE.md',
      'docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md',
      'docs/ARCHITECTURE/MICROSERVICES_ARCHITECTURE.md',
      'VISUAL_ARCHITECTURE_DIAGRAM.md',
      'ARCHITECTURE_MINDMAP.md',
    ];

    return {
      principles: [
        'Deep Layer Architecture (L0-L5 + Lx)',
        'Integration-First Design',
        '4IR & 5IR Aligned',
        'Multi-Tenant Architecture',
        'Event-Driven Architecture (CQRS & Event Sourcing)',
        'Plugin-Based Module System',
      ],
      documentationFiles: archFiles.filter(f => this.fileExists(f)),
    };
  }

  getModules() {
    const modulesDir = path.join(this.rootDir, 'lib/modules');
    const modules = [];

    if (!fs.existsSync(modulesDir)) return modules;

    try {
      const moduleFiles = fs.readdirSync(modulesDir)
        .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'registry.ts')
        .map(f => ({
          name: f.replace('.ts', ''),
          path: `lib/modules/${f}`,
          files: this.getFilesInModule(f.replace('.ts', '')),
        }));

      return moduleFiles;
    } catch (error) {
      console.warn('Warning: Could not read modules directory:', error.message);
      return modules;
    }
  }

  getFilesInModule(moduleName) {
    const moduleDirs = [
      `app/${moduleName}`,
      `components/${moduleName}`,
      `lib/services/${moduleName}`,
    ];

    const files = [];

    for (const dir of moduleDirs) {
      const fullPath = path.join(this.rootDir, dir);
      if (fs.existsSync(fullPath)) {
        try {
          files.push(...this.scanDirectory(fullPath, dir));
        } catch (error) {
          // Ignore errors
        }
      }
    }

    return files.slice(0, 20);
  }

  getServices() {
    const servicesDir = path.join(this.rootDir, 'lib/services');
    const services = [];

    if (!fs.existsSync(servicesDir)) return services;

    try {
      const serviceDirs = fs.readdirSync(servicesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const serviceName of serviceDirs) {
        const servicePath = path.join(servicesDir, serviceName);
        const indexFile = path.join(servicePath, 'index.ts');
        
        if (fs.existsSync(indexFile)) {
          try {
            const content = fs.readFileSync(indexFile, 'utf-8');
            const functions = this.extractExportedFunctions(content);
            const dependencies = this.extractDependencies(content);

            services.push({
              name: serviceName,
              path: `lib/services/${serviceName}`,
              functions,
              dependencies,
            });
          } catch (error) {
            // Skip if can't read
          }
        }
      }
    } catch (error) {
      console.warn('Warning: Could not read services directory:', error.message);
    }

    return services;
  }

  getAPIEndpoints() {
    const apiDir = path.join(this.rootDir, 'app/api');
    const endpoints = [];

    if (!fs.existsSync(apiDir)) return endpoints;

    const scanApiDir = (dir, prefix = '') => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            scanApiDir(fullPath, `${prefix}/${entry.name}`);
          } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
            endpoints.push(`/api${prefix}`);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    scanApiDir(apiDir);
    return endpoints.sort();
  }

  getTypes() {
    const typesDir = path.join(this.rootDir, 'types');
    const types = [];

    if (!fs.existsSync(typesDir)) return types;

    try {
      const typeFiles = fs.readdirSync(typesDir)
        .filter(f => f.endsWith('.ts'))
        .map(f => f.replace('.ts', ''));

      return typeFiles.sort();
    } catch (error) {
      return types;
    }
  }

  getComponents() {
    const componentsDir = path.join(this.rootDir, 'components');
    const components = [];

    if (!fs.existsSync(componentsDir)) return components;

    try {
      return this.scanDirectory(componentsDir, 'components')
        .filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.ts'))
        .slice(0, 50);
    } catch (error) {
      return components;
    }
  }

  getPages() {
    const appDir = path.join(this.rootDir, 'app');
    const pages = [];

    if (!fs.existsSync(appDir)) return pages;

    const scanPages = (dir, prefix = '') => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && entry.name !== 'api') {
            scanPages(fullPath, `${prefix}/${entry.name}`);
          } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
            try {
              const stats = fs.statSync(fullPath);
              const content = fs.readFileSync(fullPath, 'utf-8');
              
              pages.push({
                path: `app${prefix}/page.tsx`,
                size: stats.size,
                lines: content.split('\n').length,
                lastModified: stats.mtime,
              });
            } catch (error) {
              // Skip if can't read
            }
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    scanPages(appDir);
    return pages.sort((a, b) => a.path.localeCompare(b.path));
  }

  getDependencies() {
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return { production: [], development: [], total: 0 };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      return {
        production: Object.keys(packageJson.dependencies || {}),
        development: Object.keys(packageJson.devDependencies || {}),
        total: (Object.keys(packageJson.dependencies || {}).length + 
                Object.keys(packageJson.devDependencies || {}).length),
      };
    } catch (error) {
      return { production: [], development: [], total: 0 };
    }
  }

  getFileStructure() {
    const structure = {};

    const scanDir = (dir, depth = 0) => {
      if (depth > 3) return;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (this.shouldExclude(entry.name)) continue;

          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.rootDir, fullPath);

          if (entry.isDirectory()) {
            const fileCount = this.countFiles(fullPath);
            if (fileCount > 0) {
              structure[relativePath] = fileCount;
            }
            scanDir(fullPath, depth + 1);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    scanDir(this.rootDir);
    return structure;
  }

  getKeyFiles() {
    const keyFiles = [
      'README.md',
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      'lib/modules/registry.ts',
      'lib/services/event-bus/index.ts',
      'lib/services/event-store/index.ts',
      'lib/services/agents/agentOrchestrator.ts',
      'types/user.ts',
      'types/tenant.ts',
      'SECURITY.md',
      'CONTRIBUTING.md',
      'CLAUDE_ACCESS_GUIDE.md',
    ];

    return keyFiles.filter(f => this.fileExists(f));
  }

  identifyGaps() {
    const gaps = [];

    const hasTests = fs.existsSync(path.join(this.rootDir, '__tests__')) ||
                     fs.existsSync(path.join(this.rootDir, 'tests'));
    if (!hasTests) {
      gaps.push('Missing comprehensive test suite');
    }

    const hasArchDocs = fs.existsSync(path.join(this.rootDir, 'docs/ARCHITECTURE'));
    if (!hasArchDocs) {
      gaps.push('Missing architecture documentation');
    }

    return gaps;
  }

  // Helper methods
  fileExists(filePath) {
    return fs.existsSync(path.join(this.rootDir, filePath));
  }

  shouldExclude(name) {
    return this.excludePatterns.some(pattern => pattern.test(name));
  }

  scanDirectory(dir, basePath) {
    const files = [];

    const scan = (currentDir, currentBase) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          if (this.shouldExclude(entry.name)) continue;

          const fullPath = path.join(currentDir, entry.name);
          const relativePath = path.join(currentBase, entry.name);

          if (entry.isDirectory()) {
            scan(fullPath, relativePath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            try {
              const stats = fs.statSync(fullPath);
              const content = fs.readFileSync(fullPath, 'utf-8');
              
              files.push({
                path: relativePath,
                size: stats.size,
                lines: content.split('\n').length,
                lastModified: stats.mtime,
              });
            } catch (error) {
              // Skip if can't read
            }
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    scan(dir, basePath);
    return files;
  }

  countFiles(dir) {
    let count = 0;

    const scan = (currentDir) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          if (this.shouldExclude(entry.name)) continue;

          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            scan(fullPath);
          } else {
            count++;
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    try {
      scan(dir);
    } catch (error) {
      // Ignore permission errors
    }

    return count;
  }

  extractExportedFunctions(content) {
    const functions = [];
    const functionRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    const arrowFunctionRegex = /export\s+(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    while ((match = arrowFunctionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    return [...new Set(functions)].slice(0, 20);
  }

  extractDependencies(content) {
    const imports = [];
    const importRegex = /from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        imports.push(importPath.split('/')[0]);
      }
    }

    return [...new Set(imports)].slice(0, 10);
  }

  formatAsMarkdown(index) {
    const { metadata, architecture, modules, services, apiEndpoints, types, components, pages, dependencies, fileStructure, keyFiles, gaps } = index;

    let md = `# 📚 BlueDXP Platform - Codebase Index for Claude AI\n\n`;
    md += `**Generated:** ${metadata.generatedAt}\n`;
    md += `**Project:** ${metadata.name} v${metadata.version}\n`;
    md += `**Root Directory:** ${metadata.rootDirectory}\n\n`;
    md += `---\n\n`;

    // Architecture
    md += `## 🏗️ Architecture\n\n`;
    md += `### Core Principles:\n`;
    architecture.principles.forEach((p) => {
      md += `- ${p}\n`;
    });
    md += `\n### Architecture Documentation:\n`;
    architecture.documentationFiles.forEach((f) => {
      md += `- \`${f}\`\n`;
    });
    md += `\n---\n\n`;

    // Modules
    md += `## 📦 Modules (${modules.length})\n\n`;
    modules.forEach((module) => {
      md += `### ${module.name}\n`;
      md += `- **Path:** \`${module.path}\`\n`;
      md += `- **Files:** ${module.files.length}\n`;
      md += `\n`;
    });
    md += `\n---\n\n`;

    // Services
    md += `## 🔧 Services (${services.length})\n\n`;
    services.forEach((service) => {
      md += `### ${service.name}\n`;
      md += `- **Path:** \`${service.path}\`\n`;
      md += `- **Functions:** ${service.functions.length}\n`;
      if (service.functions.length > 0) {
        md += `  - ${service.functions.slice(0, 5).join(', ')}${service.functions.length > 5 ? '...' : ''}\n`;
      }
      md += `\n`;
    });
    md += `\n---\n\n`;

    // API Endpoints
    md += `## 🌐 API Endpoints (${apiEndpoints.length})\n\n`;
    apiEndpoints.forEach((endpoint) => {
      md += `- \`${endpoint}\`\n`;
    });
    md += `\n---\n\n`;

    // Types
    md += `## 📝 Type Definitions (${types.length})\n\n`;
    types.forEach((type) => {
      md += `- \`types/${type}.ts\`\n`;
    });
    md += `\n---\n\n`;

    // Pages
    md += `## 📄 Pages (${pages.length})\n\n`;
    pages.slice(0, 30).forEach((page) => {
      md += `- \`${page.path}\` (${page.lines} lines)\n`;
    });
    if (pages.length > 30) {
      md += `\n... and ${pages.length - 30} more pages\n`;
    }
    md += `\n---\n\n`;

    // Components
    md += `## 🧩 Components (${components.length} shown)\n\n`;
    components.slice(0, 30).forEach((comp) => {
      md += `- \`${comp.path}\` (${comp.lines} lines)\n`;
    });
    if (components.length > 30) {
      md += `\n... and ${components.length - 30} more components\n`;
    }
    md += `\n---\n\n`;

    // Dependencies
    md += `## 📚 Dependencies\n\n`;
    md += `- **Production:** ${dependencies.production.length}\n`;
    md += `- **Development:** ${dependencies.development.length}\n`;
    md += `- **Total:** ${dependencies.total}\n\n`;
    md += `### Key Dependencies:\n`;
    dependencies.production.slice(0, 20).forEach((dep) => {
      md += `- \`${dep}\`\n`;
    });
    md += `\n---\n\n`;

    // Key Files
    md += `## 🔑 Key Files\n\n`;
    keyFiles.forEach((file) => {
      md += `- \`${file}\`\n`;
    });
    md += `\n---\n\n`;

    // File Structure
    md += `## 📁 File Structure\n\n`;
    md += `\`\`\`\n`;
    Object.entries(fileStructure)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 50)
      .forEach(([dir, count]) => {
        md += `${dir}/ (${count} files)\n`;
      });
    md += `\`\`\`\n\n`;
    md += `\n---\n\n`;

    // Gaps
    if (gaps.length > 0) {
      md += `## ⚠️ Identified Gaps\n\n`;
      gaps.forEach((gap) => {
        md += `- ${gap}\n`;
      });
      md += `\n---\n\n`;
    }

    md += `## 📖 How to Use This Index\n\n`;
    md += `This index provides Claude AI with a comprehensive overview of your codebase.\n\n`;
    md += `### For Claude Desktop:\n`;
    md += `1. Open Claude Desktop\n`;
    md += `2. Attach this file (\`${this.outputPath}\`) to your conversation\n`;
    md += `3. Ask Claude to analyze your codebase, identify gaps, or suggest improvements\n\n`;
    md += `### For Claude Web:\n`;
    md += `1. Copy the contents of this file\n`;
    md += `2. Paste it into Claude's chat\n`;
    md += `3. Ask Claude to analyze your codebase\n\n`;
    md += `### For GitHub Integration:\n`;
    md += `1. Commit this file to your repository\n`;
    md += `2. Grant Claude access to your GitHub repository\n`;
    md += `3. Claude can analyze your codebase directly\n\n`;

    return md;
  }
}

// Run if executed directly
if (require.main === module) {
  const generator = new CodebaseIndexGenerator();
  generator.generate().catch(console.error);
}

module.exports = CodebaseIndexGenerator;





