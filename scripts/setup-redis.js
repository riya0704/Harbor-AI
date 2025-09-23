#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

console.log('Setting up Redis for development...');

const platform = os.platform();

try {
  if (platform === 'darwin') {
    // macOS
    console.log('Detected macOS. Installing Redis via Homebrew...');
    try {
      execSync('brew --version', { stdio: 'ignore' });
      execSync('brew install redis', { stdio: 'inherit' });
      console.log('Redis installed successfully!');
      console.log('To start Redis: brew services start redis');
      console.log('To stop Redis: brew services stop redis');
    } catch (error) {
      console.log('Homebrew not found. Please install Homebrew first: https://brew.sh/');
    }
  } else if (platform === 'linux') {
    // Linux
    console.log('Detected Linux. Please install Redis manually:');
    console.log('Ubuntu/Debian: sudo apt-get install redis-server');
    console.log('CentOS/RHEL: sudo yum install redis');
    console.log('Arch: sudo pacman -S redis');
  } else if (platform === 'win32') {
    // Windows
    console.log('Detected Windows. Redis installation options:');
    console.log('1. Use Docker: docker run -d -p 6379:6379 redis:alpine');
    console.log('2. Use WSL2 and install Redis in Linux subsystem');
    console.log('3. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases');
  }

  console.log('\nAfter installing Redis:');
  console.log('1. Start Redis server');
  console.log('2. Update REDIS_URL in your .env file if needed');
  console.log('3. Run: npm run dev');

} catch (error) {
  console.error('Error setting up Redis:', error.message);
  process.exit(1);
}