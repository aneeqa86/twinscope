import { Link } from 'react-router-dom'
import logo from '@/assets/logo.svg'

const Navbar = ({ cameraPos, onMenuToggle, panelOpen }) => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-[#0a1628]/80 to-transparent">

      {/* Left: hamburger (mobile) + logo */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="sm:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Toggle panel"
        >
          <span
            className={`block w-5 h-0.5 bg-cyan-400 transition-all duration-200 ${panelOpen ? 'rotate-45 translate-y-2' : ''}`}
          />
          <span
            className={`block w-5 h-0.5 bg-cyan-400 transition-all duration-200 ${panelOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`block w-5 h-0.5 bg-cyan-400 transition-all duration-200 ${panelOpen ? '-rotate-45 -translate-y-2' : ''}`}
          />
        </button>

        <Link to="/" className="flex items-center">
          <img src={logo} alt="TwinScope" className="h-7 sm:h-8" />
        </Link>
      </div>

      {/* Right: coordinates + about */}
      <div className="flex items-center gap-4 sm:gap-6 text-sm font-mono">
        {/* Coordinates — hidden on xs, shown sm+ */}
        <span className="hidden sm:block text-cyan-400">
          {cameraPos ? (
            <>
              {cameraPos.lat}° N &nbsp; {cameraPos.lng}° E &nbsp;
              <span className="text-slate-400">{cameraPos.alt} km</span>
            </>
          ) : (
            <span className="text-slate-500">Initializing...</span>
          )}
        </span>

        {/* Altitude only on mobile when we have a fix */}
        {cameraPos && (
          <span className="sm:hidden text-slate-400 font-mono text-xs">
            {cameraPos.alt} km
          </span>
        )}

        <Link
          to="/about"
          className="text-slate-400 hover:text-cyan-400 transition-colors text-xs tracking-widest"
        >
          ABOUT
        </Link>
      </div>
    </nav>
  )
}

export default Navbar