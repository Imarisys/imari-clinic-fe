#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('🔍 Verifying package versions and environment...\n');

// Check Node.js version
const nodeVersion = process.version;
const requiredNodeVersion = packageJson.engines?.node;
console.log(`Node.js version: ${nodeVersion}`);
if (requiredNodeVersion) {
  console.log(`Required Node.js version: ${requiredNodeVersion}`);
}

// Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  const requiredNpmVersion = packageJson.engines?.npm;
  console.log(`npm version: ${npmVersion}`);
  if (requiredNpmVersion) {
    console.log(`Required npm version: ${requiredNpmVersion}`);
  }
} catch (error) {
  console.error('❌ Could not determine npm version');
}

// Check if package-lock.json exists
const lockFilePath = path.join(__dirname, '..', 'package-lock.json');
if (fs.existsSync(lockFilePath)) {
  console.log('✅ package-lock.json exists');

  // Check if package-lock.json is up to date
  const lockFile = JSON.parse(fs.readFileSync(lockFilePath, 'utf8'));
  if (lockFile.version !== packageJson.version) {
    console.log('⚠️  package-lock.json version mismatch with package.json');
  } else {
    console.log('✅ package-lock.json version matches package.json');
  }
} else {
  console.log('❌ package-lock.json not found - run npm install');
}

// Check for node_modules
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules directory exists');
} else {
  console.log('❌ node_modules directory not found - run npm install');
}

// Check critical dependencies
const criticalDeps = ['react', 'react-dom', 'typescript'];
console.log('\n📦 Critical dependencies:');
criticalDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`  ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`  ❌ ${dep}: not found`);
  }
});

console.log('\n🎯 Deployment recommendations:');
console.log('1. Use "npm ci" instead of "npm install" in production');
console.log('2. Commit package-lock.json to version control');
console.log('3. Use the same Node.js version across all environments');
console.log('4. Run "npm run build:prod" for production builds');
