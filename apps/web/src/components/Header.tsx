import { Link } from '@/i18n/navigation'
import LanguageSwitcher from './LanguageSwitcher'

export default function Header() {
  return (
    <header className="border-b border-[rgba(127,99,21,0.1)] bg-bg/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="text-lg font-semibold text-text-primary">AAIGC</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/products" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Products
          </Link>
          <Link href="/tools" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Tools
          </Link>
          <Link href="/about" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            About
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  )
}