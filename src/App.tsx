import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import type { Job } from './data/jobs'
import { jobs as allJobs } from './data/jobs'

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

type Filters = {
  keyword: string
  location: string
  mode: string
  experience: string
  source: string
  sort: 'latest' | 'oldest'
}

const SAVED_STORAGE_KEY = 'job-notification-tracker:savedJobIds'

function getInitialSavedIds(): string[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const stored = window.localStorage.getItem(SAVED_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => typeof id === 'string')
    }
  } catch {
    // ignore parse errors
  }
  return []
}

type SavedState = {
  savedIds: string[]
  toggleSaved: (id: string) => void
}

function useSavedJobs(): SavedState {
  const [savedIds, setSavedIds] = useState<string[]>(() => getInitialSavedIds())

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedIds))
    } catch {
      // ignore storage errors
    }
  }, [savedIds])

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return { savedIds, toggleSaved }
}

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

function LandingPage() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/settings')
  }

  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">Stop Missing The Right Jobs.</h1>
        <p className="placeholder-subtext">
          Precision-matched job discovery delivered daily at 9AM.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={handleStart}>
            Start Tracking
          </button>
        </div>
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">
          Configure your preferences in Settings to prepare this workspace for the next steps.
        </p>
      </aside>
    </main>
  )
}

function SettingsPage() {
  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">Settings</h1>
        <p className="placeholder-subtext">
          Define how you want this tracker to think about your placement readiness. Nothing is saved
          yet — these fields are placeholders.
        </p>

        <div className="stack">
          <div className="field">
            <label className="field-label" htmlFor="role-keywords">
              Role keywords
            </label>
            <input
              id="role-keywords"
              className="text-input"
              placeholder="e.g. Frontend Engineer, Data Analyst, SDE 1"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="preferred-locations">
              Preferred locations
            </label>
            <input
              id="preferred-locations"
              className="text-input"
              placeholder="e.g. Bengaluru, Remote within India"
            />
          </div>

          <div className="field">
            <span className="field-label">Mode</span>
            <div className="settings-options">
              <button type="button" className="btn btn-secondary">
                Remote
              </button>
              <button type="button" className="btn btn-secondary">
                Hybrid
              </button>
              <button type="button" className="btn btn-secondary">
                Onsite
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="experience-level">
              Experience level
            </label>
            <input
              id="experience-level"
              className="text-input"
              placeholder="e.g. Final year, 0–2 years, 3–5 years"
            />
          </div>
        </div>
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">
          In a later step, this panel will explain how preferences translate into concrete job
          signals. For now, treat it as a design placeholder.
        </p>
      </aside>
    </main>
  )
}

type DashboardProps = {
  jobs: Job[]
  savedIds: string[]
  onToggleSaved: (id: string) => void
}

function DashboardPage({ jobs, savedIds, onToggleSaved }: DashboardProps) {
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    location: '',
    mode: '',
    experience: '',
    source: '',
    sort: 'latest',
  })
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const handleChangeFilter = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const filteredJobs = jobs
    .filter((job) => {
      const keyword = filters.keyword.trim().toLowerCase()
      if (keyword) {
        const inTitle = job.title.toLowerCase().includes(keyword)
        const inCompany = job.company.toLowerCase().includes(keyword)
        if (!inTitle && !inCompany) return false
      }

      if (filters.location && job.location !== filters.location) return false
      if (filters.mode && job.mode !== filters.mode) return false
      if (filters.experience && job.experience !== filters.experience) return false
      if (filters.source && job.source !== filters.source) return false

      return true
    })
    .sort((a, b) => {
      if (filters.sort === 'latest') {
        return a.postedDaysAgo - b.postedDaysAgo
      }
      return b.postedDaysAgo - a.postedDaysAgo
    })

  const locations = Array.from(new Set(jobs.map((job) => job.location))).sort()
  const modes = Array.from(new Set(jobs.map((job) => job.mode))).sort()
  const experiences = Array.from(new Set(jobs.map((job) => job.experience))).sort()
  const sources = Array.from(new Set(jobs.map((job) => job.source))).sort()

  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">Dashboard</h1>
        <p className="placeholder-subtext">
          Browse realistic, placement-ready roles sourced from Indian tech companies. Filters are
          local to this page and do not affect future steps.
        </p>

        <div className="filter-bar">
          <div className="filter-bar__row">
            <div className="filter-field">
              <label className="filter-label" htmlFor="filter-keyword">
                Keyword
              </label>
              <input
                id="filter-keyword"
                className="filter-input"
                placeholder="Search title or company"
                value={filters.keyword}
                onChange={(event) => handleChangeFilter('keyword', event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="filter-location">
                Location
              </label>
              <select
                id="filter-location"
                className="filter-select"
                value={filters.location}
                onChange={(event) => handleChangeFilter('location', event.target.value)}
              >
                <option value="">All</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="filter-mode">
                Mode
              </label>
              <select
                id="filter-mode"
                className="filter-select"
                value={filters.mode}
                onChange={(event) => handleChangeFilter('mode', event.target.value)}
              >
                <option value="">All</option>
                {modes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="filter-experience">
                Experience
              </label>
              <select
                id="filter-experience"
                className="filter-select"
                value={filters.experience}
                onChange={(event) => handleChangeFilter('experience', event.target.value)}
              >
                <option value="">All</option>
                {experiences.map((experience) => (
                  <option key={experience} value={experience}>
                    {experience}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="filter-source">
                Source
              </label>
              <select
                id="filter-source"
                className="filter-select"
                value={filters.source}
                onChange={(event) => handleChangeFilter('source', event.target.value)}
              >
                <option value="">All</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label" htmlFor="filter-sort">
                Sort
              </label>
              <select
                id="filter-sort"
                className="filter-select"
                value={filters.sort}
                onChange={(event) =>
                  handleChangeFilter('sort', event.target.value === 'oldest' ? 'oldest' : 'latest')
                }
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <p className="placeholder-subtext">No jobs match your search.</p>
        ) : (
          <div className="job-list">
            {filteredJobs.map((job) => {
              const isSaved = savedIds.includes(job.id)
              const postedLabel =
                job.postedDaysAgo === 0
                  ? 'Today'
                  : job.postedDaysAgo === 1
                    ? '1 day ago'
                    : `${job.postedDaysAgo} days ago`

              return (
                <article key={job.id} className="job-card">
                  <div className="job-card__header">
                    <div>
                      <div className="job-card__title">{job.title}</div>
                      <div className="job-card__meta">
                        <span>{job.company}</span>
                        <span>•</span>
                        <span>
                          {job.location} · {job.mode}
                        </span>
                      </div>
                    </div>
                    <div className="job-card__meta">
                      <span className="meta-pill">{job.experience} years</span>
                      <span className="meta-pill">{job.salaryRange}</span>
                      <span className="source-badge">{job.source}</span>
                      <span>{postedLabel}</span>
                    </div>
                  </div>

                  <div className="job-card__footer">
                    <div className="job-card__actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelectedJob(job)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onToggleSaved(job.id)}
                      >
                        {isSaved ? 'Unsave' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          try {
                            window.open(job.applyUrl, '_blank', 'noopener,noreferrer')
                          } catch {
                            // ignore window errors
                          }
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">
          This panel can later summarise counts by company, source or location. For now it remains a
          calm placeholder while you validate the dataset.
        </p>
      </aside>

      {selectedJob ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <div className="modal-title">{selectedJob.title}</div>
                <div className="job-card__meta">
                  <span>{selectedJob.company}</span>
                  <span>•</span>
                  <span>
                    {selectedJob.location} · {selectedJob.mode}
                  </span>
                  <span>•</span>
                  <span>{selectedJob.experience} years</span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedJob(null)}
              >
                Close
              </button>
            </div>

            <div>
              <p>{selectedJob.description}</p>
            </div>

            <div className="tag-row">
              {selectedJob.skills.map((skill) => (
                <span key={skill} className="tag-pill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

type SavedPageProps = {
  jobs: Job[]
  savedIds: string[]
  onToggleSaved: (id: string) => void
}

function SavedPage({ jobs, savedIds, onToggleSaved }: SavedPageProps) {
  const savedJobs = jobs.filter((job) => savedIds.includes(job.id))

  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">Saved</h1>
        {savedJobs.length === 0 ? (
          <p className="placeholder-subtext">
            You have no saved jobs yet. As you review roles on the dashboard, you can mark calm,
            high-signal opportunities to revisit here.
          </p>
        ) : (
          <div className="job-list">
            {savedJobs.map((job) => (
              <article key={job.id} className="job-card">
                <div className="job-card__header">
                  <div>
                    <div className="job-card__title">{job.title}</div>
                    <div className="job-card__meta">
                      <span>{job.company}</span>
                      <span>•</span>
                      <span>
                        {job.location} · {job.mode}
                      </span>
                    </div>
                  </div>
                  <div className="job-card__meta">
                    <span className="meta-pill">{job.experience} years</span>
                    <span className="meta-pill">{job.salaryRange}</span>
                    <span className="source-badge">{job.source}</span>
                  </div>
                </div>
                <div className="job-card__footer">
                  <div className="job-card__actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onToggleSaved(job.id)}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        try {
                          window.open(job.applyUrl, '_blank', 'noopener,noreferrer')
                        } catch {
                          // ignore window errors
                        }
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">
          Over time this panel can summarise saved roles by company, location or skill. For now it
          stays intentionally simple.
        </p>
      </aside>
    </main>
  )
}

function DigestPage() {
  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">Digest</h1>
        <p className="placeholder-subtext">
          No digests yet. A daily 9AM summary of relevant roles will be introduced in a later step.
        </p>
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">
          Use this section later to review patterns across your job notifications over time.
        </p>
      </aside>
    </main>
  )
}

function ProofPage() {
  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">Proof</h1>
        <p className="placeholder-subtext">
          This page will collect proof artifacts for the Job Notification Tracker in later steps.
        </p>
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">
          Use this space later to store links, screenshots, and explanations that demonstrate how
          the system behaves.
        </p>
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
  const { savedIds, toggleSaved } = useSavedJobs()

  const handleToggleMenu = () => {
    setMenuOpen((open) => !open)
  }

  const handleCloseMenu = () => {
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__left">Job Notification Tracker</div>
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
          <h1 className="context-header__title">Job Notification Tracker</h1>
        </div>
        <p className="context-header__subtitle">
          A calm, premium workspace for tracking placement-ready job opportunities without noise or
          distraction.
        </p>
      </section>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={<DashboardPage jobs={allJobs} savedIds={savedIds} onToggleSaved={toggleSaved} />}
        />
        <Route
          path="/saved"
          element={<SavedPage jobs={allJobs} savedIds={savedIds} onToggleSaved={toggleSaved} />}
        />
        <Route path="/digest" element={<DigestPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/proof" element={<ProofPage />} />
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
