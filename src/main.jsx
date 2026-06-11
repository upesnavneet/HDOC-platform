import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'

/* ── CSS: all imports centralized here for deterministic ordering ── */
/* 1. Base application styles */
import './index.css'

/* 2. Component-level styles (loaded AFTER base, so they can override base) */
import './components/Aurora.css'
import './components/BorderGlow.css'
import './components/CardNav.css'
import './components/GlassSurface.css'
import './components/GradientBlinds.css'
import './components/MagicBento.css'
import './components/MagicRings.css'
import './components/PillNav.css'
import './components/Shuffle.css'
import './components/ui/MagicButton.css'
import './components/AppFooter.css'

/* 3. Override / polish layers (loaded LAST, highest priority) */
import './styles/design-polish.css'
import './styles/accessibility.css'

/* ── App ── */
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ReactLenis root>
        <App />
      </ReactLenis>
    </BrowserRouter>
  </StrictMode>,
)
