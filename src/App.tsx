import './App.css'

const stepTotal = 4
const currentStep = 1

const designPrompt = `You are designing a calm, premium B2C job notification experience.

- Use off-white background and deep red accents only.
- Favour clear hierarchy over decoration.
- Assume users are busy professionals, not students.
- Every screen must have a clear next action.`

function App() {
  const handleCopy = () => {
    try {
      void navigator.clipboard.writeText(designPrompt)
    } catch {
      // Clipboard may not be available; fail silently.
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__left">Job Notification App</div>
        <div className="top-bar__center">
          Step {currentStep} / {stepTotal}
        </div>
        <div className="top-bar__right">
          <span className="status-badge status-badge--in-progress">In Progress</span>
        </div>
      </header>

      <section className="context-header">
        <div>
          <h1 className="context-header__title">Design System Foundation</h1>
        </div>
        <p className="context-header__subtitle">
          A calm, production-grade baseline for building a serious job notification experience —
          before any product features are added.
        </p>
      </section>

      <main className="layout-columns">
        <section className="primary-workspace">
          <h2 className="section-title">Primary workspace</h2>

          <div className="card">
            <div className="card__title">Tokens and typography</div>
            <div className="card__body">
              <p>
                This system uses a very small, intentional set of decisions: a single serif heading
                family, a single sans-serif body family, one spacing scale, and four core colors for
                the entire interface.
              </p>
              <div className="stack stack--horizontal">
                <span className="pill pill--success">Serif headings</span>
                <span className="pill pill--warning">Sans body</span>
                <span className="pill">Spacing: 8 / 16 / 24 / 40 / 64</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__title">Core controls</div>
            <div className="card__body">
              <div className="btn-row">
                <button className="btn btn-primary" type="button">
                  Primary action
                </button>
                <button className="btn btn-secondary" type="button">
                  Secondary action
                </button>
              </div>

              <div className="stack">
                <div className="field">
                  <label className="field-label" htmlFor="sample-title">
                    Input label
                  </label>
                  <input
                    id="sample-title"
                    className="text-input"
                    placeholder="Short, neutral placeholder text"
                  />
                  <p className="field-description">
                    Use clear labels and calm helper text. Avoid instructions that blame the user.
                  </p>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="sample-notes">
                    Additional context
                  </label>
                  <textarea
                    id="sample-notes"
                    className="text-area"
                    placeholder="Capture any constraints or background that will affect notifications."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__title">States: error and empty</div>
            <div className="card__body">
              <div className="stack">
                <div className="state-card state-card--error">
                  <div className="state-card__title">We could not save these settings</div>
                  <div className="state-card__body">
                    <p>
                      Something went wrong while updating the design configuration. Please review
                      the fields above and try again. If this continues, you can safely reload this
                      page — your previous work remains unchanged.
                    </p>
                  </div>
                </div>

                <div className="state-card state-card--empty">
                  <div className="state-card__title">No notification flows defined yet</div>
                  <div className="state-card__body">
                    <p>
                      Start by agreeing on the visual language: colors, type, spacing, and layout.
                      Once this foundation feels right, you can introduce specific job alerts and
                      user journeys on top, without revisiting these decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="secondary-panel">
          <h2 className="section-title">Secondary panel</h2>

          <div className="stack">
            <p>
              Use this panel to keep the current step clear and to provide copy that explains why
              decisions are being made — not just what to click next.
            </p>

            <div className="copy-box">
              <div className="copy-box__label">Copyable prompt</div>
              <div className="copy-box__content">{designPrompt}</div>
            </div>

            <div className="btn-row">
              <button className="btn btn-secondary" type="button" onClick={handleCopy}>
                Copy prompt
              </button>
              <button className="btn btn-primary" type="button">
                Continue to next step
              </button>
            </div>
          </div>
        </aside>
      </main>

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

export default App
