#!/usr/bin/env ts-node

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.log('Warning: .env file not found. Using defaults.');
}

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-key-change-in-production';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function viewDatabaseStats() {
  try {
    console.log('\nFetching database statistics...\n');
    const response = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
      headers: {
        'X-Admin-Key': ADMIN_KEY
      }
    });

    console.log('Database Statistics:');
    console.log('===================');
    console.log(`Users: ${response.data.users}`);
    console.log(`Papers: ${response.data.papers}`);
    console.log(`Votes: ${response.data.votes}`);
    console.log(`Tags: ${response.data.tags}`);
    console.log(`\nLast updated: ${response.data.timestamp}`);
  } catch (error: any) {
    if (error.response) {
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function resetDatabase() {
  const confirm = await question('\nWARNING: This will delete ALL data!\nAre you sure? Type \'yes\' to confirm: ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('Database reset cancelled.');
    return;
  }

  try {
    console.log('Resetting database...');
    const response = await axios.post(`${API_BASE_URL}/api/admin/reset-database`, {}, {
      headers: {
        'X-Admin-Key': ADMIN_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✓ Success!');
    console.log(response.data.message);
  } catch (error: any) {
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function viewRecentPapers() {
  try {
    console.log('\nFetching recent papers...\n');
    const response = await axios.get(`${API_BASE_URL}/api/papers?limit=10`);

    if (response.data.papers && response.data.papers.length > 0) {
      console.log('Recent Papers:');
      console.log('==============');
      response.data.papers.forEach((paper: any, index: number) => {
        console.log(`\n${index + 1}. ${paper.title}`);
        console.log(`   URL: ${paper.url}`);
        console.log(`   Authors: ${paper.authors || 'N/A'}`);
        console.log(`   Submitted: ${paper.created_at}`);
      });
    } else {
      console.log('No papers found in the database.');
    }
  } catch (error: any) {
    console.error('Error fetching papers:', error.message);
  }
}

async function viewConfiguration() {
  console.log('\nCurrent Configuration (.env):');
  console.log('============================');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    lines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          // Mask sensitive values
          if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
            console.log(`${key}=${'*'.repeat(value.length)}`);
          } else {
            console.log(`${key}=${value}`);
          }
        }
      }
    });
  } else {
    console.log('.env file not found!');
    console.log('\nDefault values being used:');
    console.log(`PORT=${process.env.PORT || '3001'}`);
    console.log(`ADMIN_KEY=${'*'.repeat(ADMIN_KEY.length)}`);
  }
}

async function generateSecureAdminKey() {
  const newKey = crypto.randomBytes(32).toString('hex');

  console.log('\nGenerated Secure Admin Key:');
  console.log('===========================');
  console.log(newKey);
  console.log('\nAdd this to your .env file:');
  console.log(`ADMIN_KEY=${newKey}`);

  const save = await question('\nDo you want to save this to .env now? (yes/no): ');

  if (save.toLowerCase() === 'yes') {
    try {
      let envContent = '';

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');

        // Update existing ADMIN_KEY or add new one
        if (envContent.includes('ADMIN_KEY=')) {
          envContent = envContent.replace(/ADMIN_KEY=.*/g, `ADMIN_KEY=${newKey}`);
        } else {
          envContent += `\nADMIN_KEY=${newKey}\n`;
        }
      } else {
        // Create new .env file
        const examplePath = path.join(__dirname, '../../.env.example');
        if (fs.existsSync(examplePath)) {
          envContent = fs.readFileSync(examplePath, 'utf-8');
          envContent = envContent.replace(/ADMIN_KEY=.*/g, `ADMIN_KEY=${newKey}`);
        } else {
          envContent = `PORT=3001\nJWT_SECRET=your-secret-key-change-in-production\nADMIN_KEY=${newKey}\n`;
        }
      }

      fs.writeFileSync(envPath, envContent);
      console.log('\n✓ Admin key saved to .env file!');
      console.log('Please restart the server for changes to take effect.');
    } catch (error: any) {
      console.error('Error saving to .env:', error.message);
    }
  }
}

async function backupDatabase() {
  try {
    const dbPath = path.join(__dirname, '../../database.sqlite');

    if (!fs.existsSync(dbPath)) {
      console.log('Database file not found!');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../../database.backup.${timestamp}.sqlite`);

    fs.copyFileSync(dbPath, backupPath);

    console.log('\n✓ Database backed up successfully!');
    console.log(`Backup location: ${backupPath}`);

    const stats = fs.statSync(backupPath);
    console.log(`Backup size: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error: any) {
    console.error('Error creating backup:', error.message);
  }
}

async function testAdminAPI() {
  console.log('\nTesting Admin API...\n');

  // Test 1: Check if server is running
  console.log('1. Testing server connection...');
  try {
    await axios.get(`${API_BASE_URL}/api/papers`);
    console.log('   ✓ Server is responding');
  } catch (error) {
    console.log('   ✗ Server is not responding');
    console.log('   Make sure the backend server is running!');
    return;
  }

  // Test 2: Test admin authentication
  console.log('\n2. Testing admin authentication...');
  try {
    await axios.get(`${API_BASE_URL}/api/admin/stats`, {
      headers: {
        'X-Admin-Key': ADMIN_KEY
      }
    });
    console.log('   ✓ Admin authentication successful');
    console.log(`   Using admin key: ${ADMIN_KEY.substring(0, 10)}...`);
  } catch (error: any) {
    console.log('   ✗ Admin authentication failed');
    if (error.response) {
      console.log(`   Error: ${JSON.stringify(error.response.data)}`);
    }
    return;
  }

  // Test 3: Test stats endpoint
  console.log('\n3. Testing /api/admin/stats endpoint...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
      headers: {
        'X-Admin-Key': ADMIN_KEY
      }
    });
    console.log('   ✓ Stats endpoint working');
    console.log(`   Current stats: ${JSON.stringify(response.data, null, 2).split('\n').join('\n   ')}`);
  } catch (error) {
    console.log('   ✗ Stats endpoint failed');
  }

  console.log('\n✓ Admin API tests complete!');
}

async function configureEmailWhitelist() {
  console.log('\nEmail Whitelist Configuration');
  console.log('============================');
  console.log('This feature allows you to restrict registration to specific email domains.');
  console.log('\nNote: This feature is not yet implemented in the backend.');
  console.log('Add EMAIL_WHITELIST to your .env file when ready:');
  console.log('Example: EMAIL_WHITELIST=example.com,university.edu');
}

async function showMenu() {
  console.clear();
  console.log('=========================================');
  console.log('Snark Express - Admin Mode');
  console.log('=========================================');
  console.log('');
  console.log('1. View Database Statistics');
  console.log('2. Reset Database (WARNING: Deletes all data!)');
  console.log('3. View Recent Papers');
  console.log('4. View Configuration (.env)');
  console.log('5. Generate Secure Admin Key');
  console.log('6. Backup Database');
  console.log('7. Test Admin API');
  console.log('8. Configure Email Whitelist');
  console.log('9. Exit Admin Mode');
  console.log('');
}

async function main() {
  let running = true;

  while (running) {
    await showMenu();
    const choice = await question('Choose an option (1-9): ');

    console.log('');

    switch (choice) {
      case '1':
        await viewDatabaseStats();
        break;
      case '2':
        await resetDatabase();
        break;
      case '3':
        await viewRecentPapers();
        break;
      case '4':
        await viewConfiguration();
        break;
      case '5':
        await generateSecureAdminKey();
        break;
      case '6':
        await backupDatabase();
        break;
      case '7':
        await testAdminAPI();
        break;
      case '8':
        await configureEmailWhitelist();
        break;
      case '9':
        console.log('Exiting Admin Mode. Goodbye!');
        running = false;
        break;
      default:
        console.log('Invalid option. Please choose 1-9.');
    }

    if (running) {
      console.log('');
      await question('Press Enter to continue...');
    }
  }

  rl.close();
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    rl.close();
    process.exit(1);
  });
}

export { main };
