const { chromium } = require('playwright');

const sites = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Apple', url: 'https://www.apple.com' },
  { name: 'Baidu', url: 'https://www.baidu.com' },
  { name: 'Alibaba', url: 'https://www.alibaba.com' },
  { name: 'Microsoft', url: 'https://www.microsoft.com/en-us' },
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'Tencent', url: 'https://www.tencent.com' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  for (const site of sites) {
    const page = await context.newPage();
    try {
      console.log(`\n=== ${site.name} (${site.url}) ===`);
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Try to get the footer text content
      const footerText = await page.evaluate(() => {
        // Try multiple selectors
        const footer = document.querySelector('footer') || 
                       document.querySelector('[class*="footer"]') ||
                       document.querySelector('[id*="footer"]') ||
                       document.querySelector('[class*="Footer"]') ||
                       document.querySelector('[id*="Footer"]');
        if (footer) return footer.textContent.trim();
        return 'NO FOOTER TAG FOUND';
      });
      
      // Also find copyright-specific text
      const copyrightText = await page.evaluate(() => {
        const body = document.body.innerText;
        const lines = body.split('\n').filter(l => 
          l.toLowerCase().includes('©') || 
          l.toLowerCase().includes('copyright') || 
          l.toLowerCase().includes('all rights reserved') ||
          l.toLowerCase().includes('保留所有权利') ||
          l.toLowerCase().includes('保留一切权利') ||
          l.toLowerCase().includes('版权所有')
        );
        return lines.filter(l => l.trim()).slice(0, 5);
      });

      console.log('Footer text:', footerText.substring(0, 500));
      console.log('Copyright lines:', JSON.stringify(copyrightText, null, 2));
    } catch (err) {
      console.log(`Error for ${site.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})();