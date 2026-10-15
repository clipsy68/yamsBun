import { useState, type FormEvent, type ReactNode } from 'react'
import './PasswordGate.css'

const PASSWORD = 'yamsBun0'
const STORAGE_KEY = 'yamsbun.unlocked.v1'

function isUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value === PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* private browsing or storage disabled — still unlock for this session */
      }
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className="pwg-screen">
      <div className="pwg-card">
        <img className="pwg-icon" src={`${import.meta.env.BASE_URL}icon.png`} alt="Yams Bun" />
        <div className="pwg-title">Yams Bun</div>
        <form className="pwg-form" onSubmit={handleSubmit}>
          <input
            className={`pwg-input ${error ? 'pwg-input-error' : ''}`}
            type="password"
            inputMode="text"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(false)
            }}
            placeholder="Parolă"
          />
          {error && <div className="pwg-error">Parolă greșită</div>}
          <button type="submit" className="pwg-submit">
            Intră
          </button>
        </form>
      </div>
    </div>
  )
}
