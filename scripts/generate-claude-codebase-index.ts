/**
 * Codebase Index Generator for Claude AI
 * 
 * This script generates a comprehensive index of your codebase that Claude can analyze.
 * It creates structured documentation about:
 * - Architecture and modules
 * - Key files and their purposes
 * - API endpoints
 * - Services and their functions
 * - Types and interfaces
 * - Missing features and gaps
 * 
 * Usage: npm run generate-claude-index
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  path: string;
  size: number;
  lines: number;
  lastModified: Date;
}

interface ModuleInfo {
  name: string;
  path: string;
  files: FileInfo[];
  description?: string;
}

interface ServiceInfo {
  name: string;
  path: string;
  functions: string[];
  dependencies: string[];
}

class CodebaseIndexGenerator {
  private rootDir: string;
  private outputPath: string;
  private excludePatterns: RegExp[] = [
    /node_modules/,
    /\.next/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.cache/,
    /\.env/,
  ];

  constructor(rootDir: string = process.cwd(), outputPath: string = 'CLAUDE_CODEBASE_INDEX.md') {
    this.rootDir = rootDir;
    this.outputPath = outputPath;
  }

  /**
   * Generate comprehensive codebase index
   */
  async generate(): Promise<void> {
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

  private getMetadata() {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf-8')
    );

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || 'BlueDXP Platform - Enterprise Intelligence Operating System',
      generatedAt: new Date().toISOString(),
      rootDirectory: this.rootDir,
    };
  }

  private getArchitecture() {
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

  private getModules(): ModuleInfo[] {
    const modulesDir = path.join(this.rootDir, 'lib/modules');
    const modules: ModuleInfo[] = [];

    if (!fs.existsSync(modulesDir)) return modules;

    const moduleFiles = fs.readdirSync(modulesDir)
      .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'registry.ts')
      .map(f => ({
        name: f.replace('.ts', ''),
        path: `lib/modules/${f}`,
        files: this.getFilesInModule(f.replace('.ts', '')),
      }));

    return moduleFiles;
  }

  private getFilesInModule(moduleName: string): FileInfo[] {
    const moduleDirs = [
      `app/${moduleName}`,
      `components/${moduleName}`,
      `lib/services/${moduleName}`,
    ];

    const files: FileInfo[] = [];

    for (const dir of moduleDirs) {
      const fullPath = path.join(this.rootDir, dir);
      if (fs.existsSync(fullPath)) {
        files.push(...this.scanDirectory(fullPath, dir));
      }
    }

    return files.slice(0, 20); // Limit to 20 files per module
  }

  private getServices(): ServiceInfo[] {
    const servicesDir = path.join(this.rootDir, 'lib/services');
    const services: ServiceInfo[] = [];

    if (!fs.existsSync(servicesDir)) return services;

    const serviceDirs = fs.readdirSync(servicesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const serviceName of serviceDirs) {
      const servicePath = path.join(servicesDir, serviceName);
      const indexFile = path.join(servicePath, 'index.ts');
      
      if (fs.existsSync(indexFile)) {
        const content = fs.readFileSync(indexFile, 'utf-8');
        const functions = this.extractExportedFunctions(content);
        const dependencies = this.extractDependencies(content);

        services.push({
          name: serviceName,
          path: `lib/services/${serviceName}`,
          functions,
          dependencies,
        });
      }
    }

    return services;
  }

  private getAPIEndpoints(): string[] {
    const apiDir = path.join(this.rootDir, 'app/api');
    const endpoints: string[] = [];

    if (!fs.existsSync(apiDir)) return endpoints;

    const scanApiDir = (dir: string, prefix: string = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanApiDir(fullPath, `${prefix}/${entry.name}`);
        } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
          endpoints.push(`/api${prefix}`);
        }
      }
    };

    scanApiDir(apiDir);
    return endpoints.sort();
  }

  private getTypes(): string[] {
    const typesDir = path.join(this.rootDir, 'types');
    const types: string[] = [];

    if (!fs.existsSync(typesDir)) return types;

    const typeFiles = fs.readdirSync(typesDir)
      .filter(f => f.endsWith('.ts'))
      .map(f => f.replace('.ts', ''));

    return typeFiles.sort();
  }

  private getComponents(): FileInfo[] {
    const componentsDir = path.join(this.rootDir, 'components');
    const components: FileInfo[] = [];

    if (!fs.existsSync(componentsDir)) return components;

    return this.scanDirectory(componentsDir, 'components')
      .filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.ts'))
      .slice(0, 50); // Limit to 50 components
  }

  private getPages(): FileInfo[] {
    const appDir = path.join(this.rootDir, 'app');
    const pages: FileInfo[] = [];

    if (!fs.existsSync(appDir)) return pages;

    const scanPages = (dir: string, prefix: string = ''): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'api') {
          scanPages(fullPath, `${prefix}/${entry.name}`);
        } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
          pages.push({
            path: `app${prefix}/page.tsx`,
            size: fs.statSync(fullPath).size,
            lines: fs.readFileSync(fullPath, 'utf-8').split('\n').length,
            lastModified: fs.statSync(fullPath).mtime,
          });
        }
      }
    };

    scanPages(appDir);
    return pages.sort((a, b) => a.path.localeCompare(b.path));
  }

  private getDependencies() {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf-8')
    );

    return {
      production: Object.keys(packageJson.dependencies || {}),
      development: Object.keys(packageJson.devDependencies || {}),
      total: (Object.keys(packageJson.dependencies || {}).length + 
              Object.keys(packageJson.devDependencies || {}).length),
    };
  }

  private getFileStructure(): { [key: string]: number } {
    const structure: { [key: string]: number } = {};

    const scanDir = (dir: string, depth: number = 0): void => {
      if (depth > 3) return; // Limit depth

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
    };

    scanDir(this.rootDir);
    return structure;
  }

  private getKeyFiles(): string[] {
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
    ];

    return keyFiles.filter(f => this.fileExists(f));
  }

  private identifyGaps(): string[] {
    // This is a placeholder - you can enhance this with actual gap analysis
    const gaps: string[] = [];

    // Check for missing test files
    const hasTests = fs.existsSync(path.join(this.rootDir, '__tests__')) ||
                     fs.existsSync(path.join(this.rootDir, 'tests'));
    if (!hasTests) {
      gaps.push('Missing comprehensive test suite');
    }

    // Check for missing documentation
    const hasArchDocs = fs.existsSync(path.join(this.rootDir, 'docs/ARCHITECTURE'));
    if (!hasArchDocs) {
      gaps.push('Missing architecture documentation');
    }

    return gaps;
  }

  // Helper methods
  private fileExists(filePath: string): boolean {
    return fs.existsSync(path.join(this.rootDir, filePath));
  }

  private shouldExclude(name: string): boolean {
    return this.excludePatterns.some(pattern => pattern.test(name));
  }

  private scanDirectory(dir: string, basePath: string): FileInfo[] {
    const files: FileInfo[] = [];

    const scan = (currentDir: string, currentBase: string): void => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (this.shouldExclude(entry.name)) continue;

        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.join(currentBase, entry.name);

        if (entry.isDirectory()) {
          scan(fullPath, relativePath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const stats = fs.statSync(fullPath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          files.push({
            path: relativePath,
            size: stats.size,
            lines: content.split('\n').length,
            lastModified: stats.mtime,
          });
        }
      }
    };

    scan(dir, basePath);
    return files;
  }

  private countFiles(dir: string): number {
    let count = 0;

    const scan = (currentDir: string): void => {
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
    };

    try {
      scan(dir);
    } catch (error) {
      // Ignore permission errors
    }

    return count;
  }

  private extractExportedFunctions(content: string): string[] {
    const functions: string[] = [];
    const functionRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    const arrowFunctionRegex = /export\s+(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
    const classMethodRegex = /export\s+class\s+\w+\s*\{[\s\S]*?(\w+)\s*\(/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    while ((match = arrowFunctionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    return [...new Set(functions)].slice(0, 20); // Limit to 20 functions
  }

  private extractDependencies(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        imports.push(importPath.split('/')[0]);
      }
    }

    return [...new Set(imports)].slice(0, 10); // Limit to 10 dependencies
  }

  private formatAsMarkdown(index: any): string {
    const { metadata, architecture, modules, services, apiEndpoints, types, components, pages, dependencies, fileStructure, keyFiles, gaps } = index;

    let md = `# 📚 BlueDXP Platform - Codebase Index for Claude AI\n\n`;
    md += `**Generated:** ${metadata.generatedAt}\n`;
    md += `**Project:** ${metadata.name} v${metadata.version}\n`;
    md += `**Root Directory:** ${metadata.rootDirectory}\n\n`;
    md += `---\n\n`;

    // Architecture
    md += `## 🏗️ Architecture\n\n`;
    md += `### Core Principles:\n`;
    architecture.principles.forEach((p: string) => {
      md += `- ${p}\n`;
    });
    md += `\n### Architecture Documentation:\n`;
    architecture.documentationFiles.forEach((f: string) => {
      md += `- \`${f}\`\n`;
    });
    md += `\n---\n\n`;

    // Modules
    md += `## 📦 Modules (${modules.length})\n\n`;
    modules.forEach((module: ModuleInfo) => {
      md += `### ${module.name}\n`;
      md += `- **Path:** \`${module.path}\`\n`;
      md += `- **Files:** ${module.files.length}\n`;
      md += `\n`;
    });
    md += `\n---\n\n`;

    // Services
    md += `## 🔧 Services (${services.length})\n\n`;
    services.forEach((service: ServiceInfo) => {
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
    apiEndpoints.forEach((endpoint: string) => {
      md += `- \`${endpoint}\`\n`;
    });
    md += `\n---\n\n`;

    // Types
    md += `## 📝 Type Definitions (${types.length})\n\n`;
    types.forEach((type: string) => {
      md += `- \`types/${type}.ts\`\n`;
    });
    md += `\n---\n\n`;

    // Pages
    md += `## 📄 Pages (${pages.length})\n\n`;
    pages.slice(0, 30).forEach((page: FileInfo) => {
      md += `- \`${page.path}\` (${page.lines} lines)\n`;
    });
    if (pages.length > 30) {
      md += `\n... and ${pages.length - 30} more pages\n`;
    }
    md += `\n---\n\n`;

    // Components
    md += `## 🧩 Components (${components.length} shown)\n\n`;
    components.slice(0, 30).forEach((comp: FileInfo) => {
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
    dependencies.production.slice(0, 20).forEach((dep: string) => {
      md += `- \`${dep}\`\n`;
    });
    md += `\n---\n\n`;

    // Key Files
    md += `## 🔑 Key Files\n\n`;
    keyFiles.forEach((file: string) => {
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
      gaps.forEach((gap: string) => {
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

export default CodebaseIndexGenerator;





