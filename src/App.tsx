import { useEffect, useMemo, useState } from 'react'
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
  sort: 'latest' | 'match' | 'salary'
}

const SAVED_STORAGE_KEY = 'job-notification-tracker:savedJobIds'
const PREFERENCES_STORAGE_KEY = 'jobTrackerPreferences'
const DIGEST_STORAGE_PREFIX = 'jobTrackerDigest_'

type Preferences = {
  roleKeywords: string
  preferredLocations: string[]
  preferredMode: string[]
  experienceLevel: string
  skills: string
  minMatchScore: number
}

const defaultPreferences: Preferences = {
  roleKeywords: '',
  preferredLocations: [],
  preferredMode: [],
  experienceLevel: '',
  skills: '',
  minMatchScore: 40,
}

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

function getInitialPreferences(): Preferences {
  if (typeof window === 'undefined') {
    return defaultPreferences
  }

  try {
    const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!stored) return defaultPreferences
    const parsed = JSON.parse(stored) as Partial<Preferences>
    return {
      ...defaultPreferences,
      ...parsed,
      preferredLocations: Array.isArray(parsed.preferredLocations)
        ? parsed.preferredLocations.filter((value) => typeof value === 'string')
        : [],
      preferredMode: Array.isArray(parsed.preferredMode)
        ? parsed.preferredMode.filter((value) => typeof value === 'string')
        : [],
      minMatchScore:
        typeof parsed.minMatchScore === 'number' && parsed.minMatchScore >= 0
          ? Math.min(100, Math.max(0, parsed.minMatchScore))
          : defaultPreferences.minMatchScore,
    }
  } catch {
    return defaultPreferences
  }
}

type PreferencesState = {
  preferences: Preferences
  setPreferences: (updater: (current: Preferences) => Preferences) => void
}

function usePreferences(): PreferencesState {
  const [preferences, setPreferencesState] = useState<Preferences>(() => getInitialPreferences())

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // ignore storage errors
    }
  }, [preferences])

  const setPreferences = (updater: (current: Preferences) => Preferences) => {
    setPreferencesState((current) => updater(current))
  }

  return { preferences, setPreferences }
}

function computeMatchScore(job: Job, preferences: Preferences): number {
  let score = 0

  const rawRoleKeywords = preferences.roleKeywords
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  const rawSkills = preferences.skills
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const title = job.title.toLowerCase()
  const description = job.description.toLowerCase()

  if (
    rawRoleKeywords.length > 0 &&
    rawRoleKeywords.some((keyword) => title.includes(keyword))
  ) {
    score += 25
  }

  if (
    rawRoleKeywords.length > 0 &&
    rawRoleKeywords.some((keyword) => description.includes(keyword))
  ) {
    score += 15
  }

  if (
    preferences.preferredLocations.length > 0 &&
    preferences.preferredLocations.includes(job.location)
  ) {
    score += 15
  }

  if (
    preferences.preferredMode.length > 0 &&
    preferences.preferredMode.includes(job.mode)
  ) {
    score += 10
  }

  if (preferences.experienceLevel && job.experience === preferences.experienceLevel) {
    score += 10
  }

  if (rawSkills.length > 0) {
    const jobSkills = job.skills.map((skill) => skill.toLowerCase())
    const overlap = rawSkills.some((skill) => jobSkills.includes(skill))
    if (overlap) {
      score += 15
    }
  }

  if (job.postedDaysAgo <= 2) {
    score += 5
  }

  if (job.source === 'LinkedIn') {
    score += 5
  }

  if (score > 100) {
    return 100
  }

  return score
}

function parseSalaryValue(salaryRange: string): number {
  const numericMatches = salaryRange.match(/\d+/g)
  if (!numericMatches || numericMatches.length === 0) {
    return 0
  }

  const base = Number(numericMatches[0])
  if (Number.isNaN(base)) return 0

  return base
}

function getTodayKey(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${DIGEST_STORAGE_PREFIX}${year}-${month}-${day}`
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

type SettingsPageProps = {
  preferences: Preferences
  setPreferences: (updater: (current: Preferences) => Preferences) => void
}

function SettingsPage({ preferences, setPreferences }: SettingsPageProps) {
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
              value={preferences.roleKeywords}
              onChange={(event) =>
                setPreferences((current) => ({ ...current, roleKeywords: event.target.value }))
              }
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="preferred-locations">
              Preferred locations
            </label>
            <select
              id="preferred-locations"
              className="text-input"
              multiple
              value={preferences.preferredLocations}
              onChange={(event) => {
                const options = Array.from(event.target.selectedOptions).map(
                  (option) => option.value,
                )
                setPreferences((current) => ({ ...current, preferredLocations: options }))
              }}
            >
              <option value="Bengaluru, Karnataka">Bengaluru, Karnataka</option>
              <option value="Hyderabad, Telangana">Hyderabad, Telangana</option>
              <option value="Chennai, Tamil Nadu">Chennai, Tamil Nadu</option>
              <option value="Pune, Maharashtra">Pune, Maharashtra</option>
              <option value="Mumbai, Maharashtra">Mumbai, Maharashtra</option>
              <option value="Noida, Uttar Pradesh">Noida, Uttar Pradesh</option>
              <option value="Gurugram, Haryana">Gurugram, Haryana</option>
              <option value="Mysuru, Karnataka">Mysuru, Karnataka</option>
              <option value="Kochi, Kerala">Kochi, Kerala</option>
              <option value="Coimbatore, Tamil Nadu">Coimbatore, Tamil Nadu</option>
              <option value="Remote, India">Remote, India</option>
            </select>
          </div>

          <div className="field">
            <span className="field-label">Mode</span>
            <div className="settings-options">
              {['Remote', 'Hybrid', 'Onsite'].map((mode) => {
                const checked = preferences.preferredMode.includes(mode)
                return (
                  <label key={mode} className="settings-option">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setPreferences((current) => {
                          const exists = current.preferredMode.includes(mode)
                          return {
                            ...current,
                            preferredMode: exists
                              ? current.preferredMode.filter((value) => value !== mode)
                              : [...current.preferredMode, mode],
                          }
                        })
                      }
                    />
                    <span>{mode}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="experience-level">
              Experience level
            </label>
            <select
              id="experience-level"
              className="text-input"
              value={preferences.experienceLevel}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  experienceLevel: event.target.value,
                }))
              }
            >
              <option value="">Any</option>
              <option value="Fresher">Fresher</option>
              <option value="0-1">0-1</option>
              <option value="1-3">1-3</option>
              <option value="3-5">3-5</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="skills-input">
              Skills
            </label>
            <input
              id="skills-input"
              className="text-input"
              placeholder="e.g. React, Java, SQL"
              value={preferences.skills}
              onChange={(event) =>
                setPreferences((current) => ({ ...current, skills: event.target.value }))
              }
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="min-match-score">
              Minimum match score
            </label>
            <input
              id="min-match-score"
              type="range"
              min={0}
              max={100}
              value={preferences.minMatchScore}
              onChange={(event) => {
                const value = Number(event.target.value)
                setPreferences((current) => ({
                  ...current,
                  minMatchScore: Number.isNaN(value) ? current.minMatchScore : value,
                }))
              }}
            />
            <p className="placeholder-subtext">Current threshold: {preferences.minMatchScore}</p>
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

type DashboardWithPreferencesProps = DashboardProps & {
  preferences: Preferences
  hasPreferences: boolean
}

function DashboardPage({
  jobs,
  savedIds,
  onToggleSaved,
  preferences,
  hasPreferences,
}: DashboardWithPreferencesProps) {
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    location: '',
    mode: '',
    experience: '',
    source: '',
    sort: 'latest',
  })
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showOnlyMatches, setShowOnlyMatches] = useState(false)

  const handleChangeFilter = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const scoredJobs = useMemo(
    () =>
      jobs.map((job) => ({
        job,
        matchScore: computeMatchScore(job, preferences),
      })),
    [jobs, preferences],
  )

  const filteredJobs = scoredJobs
    .filter(({ job, matchScore }) => {
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

      if (showOnlyMatches && matchScore < preferences.minMatchScore) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      if (filters.sort === 'match') {
        return b.matchScore - a.matchScore
      }

      if (filters.sort === 'salary') {
        const aSalary = parseSalaryValue(a.job.salaryRange)
        const bSalary = parseSalaryValue(b.job.salaryRange)
        return bSalary - aSalary
      }

      // latest
      return a.job.postedDaysAgo - b.job.postedDaysAgo
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

        {!hasPreferences ? (
          <p className="placeholder-subtext">
            Set your preferences to activate intelligent matching.
          </p>
        ) : null}

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
                  handleChangeFilter(
                    'sort',
                    event.target.value === 'match'
                      ? 'match'
                      : event.target.value === 'salary'
                        ? 'salary'
                        : 'latest',
                  )
                }
              >
                <option value="latest">Latest</option>
                <option value="match">Match score</option>
                <option value="salary">Salary</option>
              </select>
            </div>
          </div>

          <div className="filter-bar__row">
            <label className="settings-option">
              <input
                type="checkbox"
                checked={showOnlyMatches}
                onChange={(event) => setShowOnlyMatches(event.target.checked)}
              />
              <span>Show only jobs above my threshold</span>
            </label>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <p className="placeholder-subtext">
            {hasPreferences
              ? 'No roles match your criteria. Adjust filters or lower threshold.'
              : 'No jobs match your search.'}
          </p>
        ) : (
          <div className="job-list">
            {filteredJobs.map(({ job, matchScore }) => {
              const isSaved = savedIds.includes(job.id)
              const postedLabel =
                job.postedDaysAgo === 0
                  ? 'Today'
                  : job.postedDaysAgo === 1
                    ? '1 day ago'
                    : `${job.postedDaysAgo} days ago`

              let matchClass = 'match-badge--low'
              if (matchScore >= 80) {
                matchClass = 'match-badge--high'
              } else if (matchScore >= 60) {
                matchClass = 'match-badge--medium'
              } else if (matchScore >= 40) {
                matchClass = 'match-badge--base'
              }

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
                      <span className={`match-badge ${matchClass}`}>Match {matchScore}</span>
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

type DigestPageProps = {
  jobs: Job[]
  preferences: Preferences
  hasPreferences: boolean
}

type DigestItem = {
  id: string
  matchScore: number
}

function DigestPage({ jobs, preferences, hasPreferences }: DigestPageProps) {
  const [digest, setDigest] = useState<DigestItem[] | null>(null)
  const [loading, setLoading] = useState(false)

  const todayKey = getTodayKey()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(todayKey)
      if (!stored) return
      const parsed = JSON.parse(stored) as DigestItem[]
      if (Array.isArray(parsed)) {
        setDigest(
          parsed
            .filter((item) => typeof item.id === 'string' && typeof item.matchScore === 'number')
            .map((item) => ({
              id: item.id,
              matchScore: Math.max(0, Math.min(100, Math.round(item.matchScore))),
            })),
        )
      }
    } catch {
      // ignore parse errors
    }
  }, [todayKey])

  const scoredJobs = useMemo(
    () =>
      jobs.map((job) => ({
        job,
        matchScore: computeMatchScore(job, preferences),
      })),
    [jobs, preferences],
  )

  const digestJobs =
    digest === null
      ? null
      : digest
          .map((item) => {
            const match = scoredJobs.find((scored) => scored.job.id === item.id)
            return match ? { job: match.job, matchScore: item.matchScore } : null
          })
          .filter((value): value is { job: Job; matchScore: number } => value !== null)

  const handleGenerate = () => {
    if (!hasPreferences) return
    setLoading(true)
    try {
      const sorted = [...scoredJobs]
        .filter((entry) => entry.matchScore > 0)
        .sort((a, b) => {
          if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore
          }
          return a.job.postedDaysAgo - b.job.postedDaysAgo
        })
        .slice(0, 10)

      if (sorted.length === 0) {
        setDigest([])
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(todayKey, JSON.stringify([]))
        }
        return
      }

      const compact: DigestItem[] = sorted.map((entry) => ({
        id: entry.job.id,
        matchScore: entry.matchScore,
      }))

      setDigest(compact)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(todayKey, JSON.stringify(compact))
      }
    } catch {
      // ignore errors in demo mode
    } finally {
      setLoading(false)
    }
  }

  const readableDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const digestAsText = useMemo(() => {
    if (!digestJobs || digestJobs.length === 0) {
      return ''
    }
    const lines: string[] = []
    lines.push(`Top 10 Jobs For You — 9AM Digest`)
    lines.push(readableDate)
    lines.push('')
    digestJobs.forEach(({ job, matchScore }, index) => {
      lines.push(
        `${index + 1}. ${job.title} — ${job.company} (${job.location}, ${job.experience} yrs) [Match ${matchScore}]`,
      )
      lines.push(`   Apply: ${job.applyUrl}`)
      lines.push('')
    })
    lines.push('This digest was generated based on your preferences.')
    lines.push('Demo Mode: Daily 9AM trigger simulated manually.')
    return lines.join('\n')
  }, [digestJobs, readableDate])

  const handleCopyDigest = () => {
    if (!digestAsText) return
    try {
      void navigator.clipboard.writeText(digestAsText)
    } catch {
      // ignore clipboard errors in demo mode
    }
  }

  const handleEmailDraft = () => {
    if (!digestAsText) return
    const subject = encodeURIComponent('My 9AM Job Digest')
    const body = encodeURIComponent(digestAsText)
    const href = `mailto:?subject=${subject}&body=${body}`
    try {
      window.location.href = href
    } catch {
      // ignore navigation errors
    }
  }

  return (
    <main className="layout-columns">
      <section className="primary-workspace">
        <h2 className="section-title">Primary workspace</h2>
        <h1 className="placeholder-title">Digest</h1>
        <p className="placeholder-subtext">
          Daily 9AM-style summary of roles that align with your preferences. This is a simulated
          demo inside the browser.
        </p>
        <p className="placeholder-subtext">Demo Mode: Daily 9AM trigger simulated manually.</p>

        {!hasPreferences ? (
          <p className="placeholder-subtext">
            Set preferences to generate a personalized digest.
          </p>
        ) : (
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={loading}
            >
              Generate Today&apos;s 9AM Digest (Simulated)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyDigest}
              disabled={!digestJobs || digestJobs.length === 0}
            >
              Copy Digest to Clipboard
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleEmailDraft}
              disabled={!digestJobs || digestJobs.length === 0}
            >
              Create Email Draft
            </button>
          </div>
        )}

        <div className="digest-wrapper">
          <div className="digest-card">
            <h2 className="digest-title">Top 10 Jobs For You — 9AM Digest</h2>
            <p className="digest-subtext">{readableDate}</p>

            {!hasPreferences ? (
              <p className="placeholder-subtext">
                Set preferences in the Settings page to see a personalized digest here.
              </p>
            ) : !digestJobs ? (
              <p className="placeholder-subtext">No digest generated yet for today.</p>
            ) : digestJobs.length === 0 ? (
              <p className="placeholder-subtext">
                No matching roles today. Check again tomorrow.
              </p>
            ) : (
              <ol className="digest-list">
                {digestJobs.map(({ job, matchScore }) => (
                  <li key={job.id} className="digest-item">
                    <div className="digest-item-header">
                      <div>
                        <div className="digest-item-title">{job.title}</div>
                        <div className="digest-item-meta">
                          <span>{job.company}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <span>{job.experience} yrs</span>
                        </div>
                      </div>
                      <div className="digest-item-score">Match {matchScore}</div>
                    </div>
                    <div className="digest-item-actions">
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
                  </li>
                ))}
              </ol>
            )}

            <p className="digest-footer-note">
              This digest was generated based on your preferences.
            </p>
          </div>
        </div>
      </section>

      <aside className="secondary-panel">
        <h2 className="section-title">Secondary panel</h2>
        <p className="placeholder-subtext">
          In a production system this panel could show how today&apos;s digest compares to previous
          days. For now it simply mirrors the calm, structured design.
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
  const { preferences, setPreferences } = usePreferences()
  const { savedIds, toggleSaved } = useSavedJobs()

  const hasPreferences =
    preferences.roleKeywords.trim().length > 0 ||
    preferences.skills.trim().length > 0 ||
    preferences.preferredLocations.length > 0 ||
    preferences.preferredMode.length > 0 ||
    Boolean(preferences.experienceLevel)

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
          element={
            <DashboardPage
              jobs={allJobs}
              savedIds={savedIds}
              onToggleSaved={toggleSaved}
              preferences={preferences}
              hasPreferences={hasPreferences}
            />
          }
        />
        <Route
          path="/saved"
          element={<SavedPage jobs={allJobs} savedIds={savedIds} onToggleSaved={toggleSaved} />}
        />
        <Route
          path="/digest"
          element={<DigestPage jobs={allJobs} preferences={preferences} hasPreferences={hasPreferences} />}
        />
        <Route
          path="/settings"
          element={<SettingsPage preferences={preferences} setPreferences={setPreferences} />}
        />
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

