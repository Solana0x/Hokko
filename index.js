const fetch = require('node-fetch');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const chalk = require('chalk');
const { faker } = require('@faker-js/faker');
const readline = require('readline');
const colors = {
  success: chalk.green,
  error: chalk.red,
  info: chalk.blue,
  warning: chalk.yellow,
  highlight: chalk.cyan,
  divider: chalk.magenta,
  progress: chalk.white
};
const bold = {
  success: chalk.green.bold,
  error: chalk.red.bold,
  info: chalk.blue.bold,
  warning: chalk.yellow.bold,
  highlight: chalk.cyan.bold,
  divider: chalk.magenta.bold,
  progress: chalk.white.bold
};
function readLines(file) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('File is empty');
    return lines;
  } catch (err) {
    console.log(bold.error(`✖ Error reading ${file}: ${err.message}`));
    process.exit(1);
  }
}
const proxies = readLines('proxy.txt');
const wallets = readLines('address.txt');
const emails = readLines('email.txt');
console.log(bold.divider('─────────────────────────────────────────────────────────────'));
console.log(bold.info(`ℹ Total Wallets: ${wallets.length}`));
console.log(bold.info(`ℹ Total Proxies: ${proxies.length}`));
console.log(bold.info(`ℹ Total Emails: ${emails.length}`));
console.log(bold.divider('─────────────────────────────────────────────────────────────'));
console.log('');
function generateTwitter() {
  return faker.internet.userName()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 15);
}

async function processWallet(wallet, email, proxy, index) {
  const url = "https://hokko-locked-production.up.railway.app/whitelist";
  
  const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "content-type": "application/json",
    "priority": "u=1, i",
    "sec-ch-ua": `"Chromium";v="${Math.floor(Math.random() * 20) + 100}", "Google Chrome";v="${Math.floor(Math.random() * 20) + 100}", "Not=A?Brand";v="${Math.floor(Math.random() * 10) + 10}"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": `"${Math.random() > 0.5 ? 'Windows' : 'macOS'}"`,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent": faker.internet.userAgent()
  };

  const body = JSON.stringify({
    "email": email.trim(),
    "walletAddress": wallet.trim(),
    "twitter": generateTwitter()
  });

  const options = {
    method: "POST",
    headers: headers,
    body: body,
    agent: new HttpsProxyAgent(proxy.trim()),
    referrer: "https://www.hokko.io/",
    referrerPolicy: "strict-origin-when-cross-origin",
    mode: "cors",
    credentials: "omit"
  };

  let attempts = 3;
  while (attempts > 0) {
    try {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(colors.progress(`⌛ Processing Wallet ${index + 1}/${wallets.length}: ${wallet.substring(0, 6)}...${wallet.slice(-4)} (Attempt ${4 - attempts}/3)`));
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      console.log(bold.success(`✓ Success: Wallet ${index + 1}/${wallets.length}`));
      console.log(colors.highlight(`  Address: ${wallet.substring(0, 6)}...${wallet.slice(-4)}`));
      console.log(colors.highlight(`  Response: ${JSON.stringify(data)}`));
      return true;
    } catch (error) {
      attempts--;
      if (attempts === 0) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.log(bold.error(`✖ Failed: Wallet ${index + 1}/${wallets.length}`));
        console.log(colors.warning(`  Address: ${wallet.substring(0, 6)}...${wallet.slice(-4)}`));
        console.log(colors.warning(`  Error: ${error.message}`));
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function main() {
  console.log(bold.info('🚀 Starting Whitelist Process...'));
  console.log(bold.divider('─────────────────────────────────────────────────────────────'));

  for (let i = 0; i < Math.min(wallets.length, emails.length); i++) {
    const proxy = proxies[i % proxies.length];
    await processWallet(wallets[i], emails[i], proxy, i);
    
    if (i < Math.min(wallets.length, emails.length) - 1) {
      console.log(bold.divider('─────────────────────────────────────────────────────────────'));
      const delay = Math.floor(Math.random() * 1000) + 3000;
      console.log(colors.info(`⏳ Waiting ${(delay/1000).toFixed(1)} seconds...\n`));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log(bold.divider('─────────────────────────────────────────────────────────────'));
  console.log(bold.success('🎉 All wallets processed!'));
  console.log(bold.divider('─────────────────────────────────────────────────────────────'));
}

main().catch(err => {
  console.log(bold.error('⚠ Critical Error:'));
  console.log(colors.error(err.message));
  process.exit(1);
});
