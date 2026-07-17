export default function Footer() {
  return (
    <footer className="border-t border-[rgba(127,99,21,0.1)] bg-bg mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>🚀 AAIGC</span>
            <span className="mx-2">·</span>
            <span>AI-Powered Tools</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <a href="https://github.com/CHEN-AI-Lab" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
              GitHub
            </a>
            <a href="mailto:phoebe.yanxi@gmail.com" className="hover:text-text-primary transition-colors">
              Email
            </a>
          </div>
        </div>
        <p className="text-center text-xs text-text-secondary mt-6">
          &copy; {new Date().getFullYear()} AAIGC. All rights reserved.
        </p>
      </div>
    </footer>
  )
}