import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

type NavItem = {
  label: string
  path: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Saved', path: '/saved' },
  { label: 'Digest', path: '/digest' },
  { label: 'Settings', path: '/settings' },
  { label: 'Proof', path: '/proof' },
]

type PageProps = {
  title: string
}

function PlaceholderPage({ title }: PageProps) {
  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">{title}</h1>
        <p className="placeholder-subtext">This section will be built in the next step.</p>
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">This section will be built in the next step.</p>
      </aside>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">Page Not Found</h1>
        <p className="placeholder-subtext">
          The page you are looking for does not exist.
        </p>
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">Use the navigation bar to move to a valid section.</p>
      </aside>
    </main>
  )
}

function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const stepTotal = 4
  const currentStep = 2

  const handleToggleMenu = () => {
    setMenuOpen((open) => !open)
  }

  const handleCloseMenu = () => {
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__left">Job Notification App</div>
        <div className="top-bar__center">
          Step {currentStep} / {stepTotal}
        </div>
        <div className="top-bar__right">
          <nav className="top-nav">
            <div className="top-nav__links top-nav__links--desktop">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? 'top-nav__link top-nav__link--active' : 'top-nav__link'
                  }
                  onClick={handleCloseMenu}
                  end
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <button
              type="button"
              className="top-nav__menu-button"
              onClick={handleToggleMenu}
              aria-label="Toggle navigation"
            >
              <span className="top-nav__menu-icon" />
            </button>
          </nav>
          <span className="status-badge status-badge--in-progress">In Progress</span>
        </div>
      </header>

      {menuOpen ? (
        <div className="top-nav__mobile-panel">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'top-nav__mobile-link top-nav__mobile-link--active' : 'top-nav__mobile-link'
              }
              onClick={handleCloseMenu}
              end
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}

      <section className="context-header">
        <div>
          <h1 className="context-header__title">Placement Readiness</h1>
        </div>
        <p className="context-header__subtitle">
          Structured steps for building a serious job notification experience. Each section will be
          developed in turn.
        </p>
      </section>

      <Routes>
        <Route path="/" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/saved" element={<PlaceholderPage title="Saved" />} />
        <Route path="/digest" element={<PlaceholderPage title="Digest" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="/proof" element={<PlaceholderPage title="Proof" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <footer className="proof-footer">
        <div className="proof-footer__label">Proof checklist</div>
        <div className="proof-footer__items">
          <div className="checklist-item">
            <span className="checklist-box" />
            <span>UI Built</span>
          </div>
          <div className="checklist-item">
            <span className="checklist-box" />
            <span>Logic Working</span>
          </div>
          <div className="checklist-item">
            <span className="checklist-box" />
            <span>Test Passed</span>
          </div>
          <div className="checklist-item">
            <span className="checklist-box" />
            <span>Deployed</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return <AppShell />
}

export default App
