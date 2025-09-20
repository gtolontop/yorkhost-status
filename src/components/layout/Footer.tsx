import Link from 'next/link'
// import styles from './Footer.module.scss' // Converted to Tailwind
const styles = {
  footer: "bg-gray-50 border-t border-gray-200 mt-auto",
  container: "py-8",
  content: "grid md:grid-cols-4 gap-8",
  brand: "md:col-span-1",
  brandTitle: "text-lg font-semibold text-gray-900 mb-2",
  brandDescription: "text-gray-600 text-sm",
  section: "space-y-3",
  sectionTitle: "font-medium text-gray-900 mb-3",
  linkList: "space-y-2",
  link: "text-gray-600 hover:text-gray-900 transition-colors text-sm",
  bottom: "border-t border-gray-200 pt-6 mt-6 text-center text-gray-500 text-sm"
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <h3 className={styles.brandTitle}>Yorkhost Status</h3>
            <p className={styles.brandDescription}>
              Real-time monitoring and status updates for all Yorkhost services.
            </p>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkGroupTitle}>Status</h4>
              <ul className={styles.linkList}>
                <li>
                  <Link href="/" className={styles.link}>
                    Current Status
                  </Link>
                </li>
                <li>
                  <Link href="/incidents" className={styles.link}>
                    Incident History
                  </Link>
                </li>
                <li>
                  <Link href="/api/status" className={styles.link}>
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4 className={styles.linkGroupTitle}>Resources</h4>
              <ul className={styles.linkList}>
                <li>
                  <a 
                    href="https://yorkhost.fr" 
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Main Website
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.yorkhost.fr" 
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://support.yorkhost.fr" 
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4 className={styles.linkGroupTitle}>Connect</h4>
              <ul className={styles.linkList}>
                <li>
                  <a 
                    href="https://discord.gg/yorkhost" 
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a 
                    href="https://twitter.com/yorkhost" 
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/yorkhost" 
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} Yorkhost. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/privacy" className={styles.bottomLink}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={styles.bottomLink}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}