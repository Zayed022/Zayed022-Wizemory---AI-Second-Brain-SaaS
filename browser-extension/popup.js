const API_BASE = 'https://wizemory.com'
let selectedType = 'ARTICLE'
let currentTab = null

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  currentTab = tab

  const token = await getStoredToken()

  if (!token) {
    showState('auth')
    document.getElementById('status-dot').classList.add('offline')
    return
  }

  // Populate page info
  document.getElementById('page-url').textContent  = hostname(tab.url)
  document.getElementById('page-title').textContent = tab.title || tab.url

  // Wire up type buttons
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      selectedType = btn.dataset.type

      const noteEl = document.getElementById('note-input')
      noteEl.style.display = selectedType === 'NOTE' ? 'block' : 'none'
      if (selectedType === 'NOTE') noteEl.focus()
    })
  })

  // Save button
  document.getElementById('save-btn').addEventListener('click', saveItem)

  showState('main')
})

// ── Save ─────────────────────────────────────────────────────────────────────
async function saveItem() {
  const btn       = document.getElementById('save-btn')
  const labelEl   = document.getElementById('save-label')
  const iconEl    = document.getElementById('save-icon')
  const noteInput = document.getElementById('note-input')

  btn.disabled = true
  iconEl.innerHTML = '<div class="spinner"></div>'
  labelEl.textContent = 'Saving…'

  try {
    const token = await getStoredToken()
    if (!token) { showState('auth'); return }

    const form = new FormData()
    form.append('type', selectedType)
    form.append('url',  currentTab.url)
    form.append('title', currentTab.title ?? '')

    if (selectedType === 'NOTE' && noteInput.value.trim()) {
      form.append('content', noteInput.value.trim())
    }

    const res = await fetch(`${API_BASE}/api/items`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    form,
    })

    if (res.status === 403) {
      showError('Plan limit reached', 'Upgrade to Pro for unlimited items.')
      return
    }

    if (res.status === 429) {
      showError('Too many saves', 'Please wait a moment before saving again.')
      return
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    // Success — show notification
    chrome.notifications?.create({
      type:    'basic',
      iconUrl: 'icons/icon48.png',
      title:   'Saved to WizeMory!',
      message: `"${(currentTab.title ?? '').slice(0, 60)}" is being processed.`,
    })

    showState('saved')
  } catch (err) {
    console.error('[wizemory] save failed:', err)
    showError('Something went wrong', 'Check your connection and try again.')
  }
}

// ── Auth token helpers ────────────────────────────────────────────────────────
async function getStoredToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(['wizemory_token'], result => {
      resolve(result.wizemory_token ?? null)
    })
  })
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function showState(state) {
  const states = ['auth', 'main', 'saved', 'error']
  states.forEach(s => {
    const el = document.getElementById(`state-${s}`)
    if (el) el.style.display = s === state ? '' : 'none'
  })
}

function showError(title, sub) {
  document.getElementById('error-title').textContent = title
  document.getElementById('error-sub').textContent   = sub
  showState('error')
}

function resetToMain() {
  const btn     = document.getElementById('save-btn')
  const labelEl = document.getElementById('save-label')
  const iconEl  = document.getElementById('save-icon')
  if (btn)     btn.disabled        = false
  if (labelEl) labelEl.textContent = 'Save to WizeMory'
  if (iconEl)  iconEl.textContent  = '✦'
  showState('main')
}

function hostname(url) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}
