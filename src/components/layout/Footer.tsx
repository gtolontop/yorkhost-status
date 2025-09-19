import Link from 'next/link'
import styles from './Footer.module.scss'

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
                    href="https://yorkhost.com" 
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Main Website
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.yorkhost.com" 
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://support.yorkhost.com" 
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