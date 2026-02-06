const puppeteer = require('puppeteer');

const getTargetUrl = () => {
  const arg = process.argv.find((item) => item.startsWith('--url='));
  if (arg) {
    return arg.replace('--url=', '');
  }
  return process.env.FRONT_URL || 'http://localhost:3000';
};

describe('Life Protocol UI', () => {
  let browser;
  let page;
  const logs = [];

  beforeAll(async () => {
    const url = getTargetUrl();
    console.log(`[E2E] Target URL: ${url}`);

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    page = await browser.newPage();

    page.on('console', (msg) => {
      const text = `[Browser Console] ${msg.type()}: ${msg.text()}`;
      logs.push(text);
      console.log(text);
    });

    page.on('pageerror', (error) => {
      const text = `[Browser Error] ${error.message}`;
      logs.push(text);
      console.error(text);
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        const text = `[Network Error] ${response.status()} ${response.url()}`;
        logs.push(text);
        console.error(text);
      }
    });

    await page.goto(url, { waitUntil: 'networkidle0' });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('renders core UI elements without browser errors', async () => {
    await page.waitForSelector('h1');
    const title = await page.$eval('h1', (el) => el.textContent);
    console.log(`[E2E] H1 text: ${title}`);

    const ritualCards = await page.$$eval('.ritual', (items) => items.length);
    console.log(`[E2E] Ritual cards count: ${ritualCards}`);

    if (ritualCards < 3) {
      throw new Error('Expected at least 3 ritual cards');
    }

    const hasPrimaryButton = await page.$('.primary');
    expect(hasPrimaryButton).not.toBeNull();

    const browserErrors = logs.filter((entry) => entry.startsWith('[Browser Error]'));
    if (browserErrors.length > 0) {
      throw new Error(`Browser errors detected: ${browserErrors.join(' | ')}`);
    }
  });
});
