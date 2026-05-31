import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Boilerplate. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link to="/"      className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Home</Link>
            <Link to="/about" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
