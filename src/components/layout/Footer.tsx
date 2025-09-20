import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Yorkhost Status</h3>
            <p className="text-gray-600 text-sm">
              Real-time monitoring and status updates for all Yorkhost services.
            </p>
          </div>

          {/* Status Links */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Status</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Current Status
                </Link>
              </li>
              <li>
                <Link href="/incidents" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Incident History
                </Link>
              </li>
              <li>
                <Link href="/maintenance" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">
                  Maintenance
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://yorkhost.fr" 
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Main Website
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.yorkhost.fr" 
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://support.yorkhost.fr" 
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Connect Links */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://discord.gg/yorkhost" 
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/yorkhost" 
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/yorkhost" 
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © {currentYear} Yorkhost. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}