import { Link } from '@/i18n/navigation'

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(127,99,21,0.1)] bg-bg mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">🚀 AAIGC</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              AI-powered tools and applications.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Products</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li><a href="https://cookmate.aaigc.online" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">CookMate</a></li>
              <li><a href="https://aihub.aaigc.online" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">AIHub</a></li>
              <li>Short Drama</li>
              <li>Resume Optimizer</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Tools</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li><Link href="/tools/json-formatter" className="hover:text-accent transition-colors">JSON Formatter</Link></li>
              <li><Link href="/tools/timestamp" className="hover:text-accent transition-colors">Timestamp</Link></li>
              <li><Link href="/tools/qrcode" className="hover:text-accent transition-colors">QR Code</Link></li>
              <li><Link href="/tools" className="hover:text-accent transition-colors">More...</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Connect</h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li><a href="https://github.com/CHEN-AI-Lab" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">GitHub</a></li>
              <li><a href="mailto:phoebe.yanxi@gmail.com" className="hover:text-accent transition-colors">Email</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[rgba(127,99,21,0.1)] mt-8 pt-8 text-center text-xs text-text-secondary">
          &copy; {new Date().getFullYear()} AAIGC. All rights reserved.
        </div>
      </div>
    </footer>
  )
}