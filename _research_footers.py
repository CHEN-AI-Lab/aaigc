#!/usr/bin/env python3
"""Visit major websites and extract footer/copyright text."""
import asyncio
from playwright.async_api import async_playwright

SITES = [
    ("GitHub", "https://github.com"),
    ("Apple", "https://www.apple.com"),
    ("Baidu", "https://www.baidu.com"),
    ("Alibaba", "https://www.alibaba.com"),
    ("Microsoft", "https://www.microsoft.com/en-us"),
    ("Google", "https://www.google.com"),
    ("Tencent", "https://www.tencent.com"),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        for name, url in SITES:
            page = await context.new_page()
            try:
                print(f"\n{'='*60}")
                print(f"=== {name} ({url}) ===")
                print(f"{'='*60}")
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(2000)

                # Scroll to bottom to trigger lazy-loaded footers
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(1000)

                # Get page text and find copyright-related lines
                all_text = await page.evaluate("document.body.innerText")
                lines = [l.strip() for l in all_text.split("\n") if l.strip()]
                
                # Find copyright-related lines
                copyright_lines = [l for l in lines if any(
                    kw in l.lower() for kw in ["©", "copyright", "all rights reserved", 
                                               "保留所有权利", "保留一切权利", "版权所有",
                                               "all rights"])
                ]
                
                print("Copyright-related lines:")
                for cl in copyright_lines:
                    print(f"  -> {cl}")

                # Also try to get the actual footer element text
                footer_text = await page.evaluate("""() => {
                    const sel = document.querySelector('footer') || 
                               document.querySelector('[class*=\"footer\"]') ||
                               document.querySelector('[id*=\"footer\"]') ||
                               document.querySelector('[class*=\"Footer\"]') ||
                               document.querySelector('[id*=\"Footer\"]');
                    return sel ? sel.innerText.trim() : 'NO FOOTER TAG';
                }""")
                print(f"\nFooter element text (first 500 chars):")
                print(f"  {footer_text[:500]}")

            except Exception as e:
                print(f"  ERROR: {e}")
            finally:
                await page.close()

        await browser.close()

asyncio.run(main())