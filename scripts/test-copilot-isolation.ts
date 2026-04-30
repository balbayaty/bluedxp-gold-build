import { resolve } from 'path';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';

// Load environment variables using dotenv
const envPath = resolve(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);

if (existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.warn('Error loading .env.local:', result.error);
    } else {
        console.log('Loaded .env.local successfully');
        // Debug: Print loaded keys (masked)
        const keys = Object.keys(result.parsed || {});
        console.log('Keys found in .env.local:', keys.length);
        keys.filter(k => k.includes('KEY') || k.includes('SECRET')).forEach(k => {
            const val = process.env[k] || '';
            console.log(`- ${k}: ${val.substring(0, 5)}... (${val.length} chars)`);
        });
    }
} else {
    console.warn('.env.local file not found at:', envPath);
}

// Mock request context if needed (Copilot might rely on headers/cookies which we don't have here, 
// but the service level should ideally be agnostic).

async function testCopilot() {
    console.log('--- Starting Copilot Isolation Test ---');
    console.log('Current working directory:', process.cwd());

    try {
        // Dynamic import to ensure env vars are loaded first
        const { copilotService } = await import('@/lib/services/copilot/copilotService');

        console.log('Copilot Service imported successfully.');

        const tenantId = 'test-tenant';
        const userId = 'test-user-1';
        const message = 'Hello, system check.';

        console.log(`Sending message: "${message}"`);

        const response = await copilotService.processMessage(tenantId, userId, { message });

        console.log('--- Test Success ---');
        console.log('Response:', JSON.stringify(response, null, 2));

    } catch (error) {
        console.error('--- Test Failed ---');
        console.error(error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

testCopilot();
