import { Link } from 'react-router-dom'
import logo from '@/assets/logo.svg'

const Navbar = ({ cameraPos }) => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#0a1628]/80 to-transparent">
      <Link to="/" className="flex items-center">
        <img src={logo} alt="TwinScope" className="h-8" />
      </Link>
      <div className="flex items-center gap-6 text-sm font-mono">
        {cameraPos ? (
          <span className="text-cyan-400">
            {cameraPos.lat}° N &nbsp; {cameraPos.lng}° E &nbsp;
            <span className="text-slate-400">{cameraPos.alt} km</span>
          </span>
        ) : (
          <span className="text-slate-500">Initializing...</span>
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