import { useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import Icon from '@/components/icons/Icon'
import { Presence } from '@/components/primitives'
import { LANDMARKS } from '@/config/cities'

/** Curated landmark search for the active city. "/" focuses, arrows + Enter pick, Escape closes. */
const LandmarkSearch = ({ cityName, onPick, mobile = false, className }) => {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const rootRef = useRef(null)
  const listId = useId()

  const landmarks = LANDMARKS[cityName] ?? []
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return landmarks
    return landmarks.filter((l) => l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q))
  }, [query, landmarks])

  useEffect(() => { setQuery(''); setCursor(0) }, [cityName])
  useEffect(() => { setCursor(0) }, [query])

  // "/" focuses the search from anywhere except another text field
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setFocused(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const pick = (landmark) => {
    onPick(landmark)
    setQuery(landmark.name)
    setFocused(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocused(true)
      setCursor((c) => Math.min(results.length - 1, c + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(0, c - 1))
    } else if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault()
      pick(results[cursor])
    } else if (e.key === 'Escape') {
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  const open = focused

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <div
        className={clsx(
          'ts-panel flex items-center gap-2.5 !rounded-pill px-3.5 focus-within:border-line-strong',
          mobile ? 'h-12' : 'h-11'
        )}
      >
        <Icon name="search" size={18} className="text-ink-3" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[cursor] ? `${listId}-${cursor}` : undefined}
          aria-label={`Search ${cityName} landmarks`}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocused(true) }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={`Search ${cityName} landmarks`}
          className={clsx(
            'h-full min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-3 focus:outline-none',
            mobile ? 'text-[16px]' : 'text-[14px]'
          )}
          style={{ outline: 'none' }}
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            aria-label="Clear search"
            className="ts-transition -mr-1 flex h-8 w-8 items-center justify-center rounded-control text-ink-3 hover:bg-hover hover:text-ink"
          >
            <Icon name="close" size={15} />
          </button>
        ) : (
          !mobile && (
            <kbd className="rounded-[6px] border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-3">/</kbd>
          )
        )}
      </div>

      <Presence show={open} motion="down" className="ts-pop absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden p-1.5">
        <p className="ts-label px-2.5 pb-1.5 pt-1.5">Landmarks · {cityName}</p>
        <ul id={listId} role="listbox" aria-label={`${cityName} landmarks`} className="ts-scroll max-h-[min(400px,60vh)] overflow-y-auto">
          {results.length === 0 && (
            <li className="px-2.5 py-3 text-[13px] text-ink-3">No landmarks match “{query}”</li>
          )}
          {results.map((l, i) => (
            <li
              key={l.name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === cursor}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(l)}
              onMouseEnter={() => setCursor(i)}
              className={clsx(
                'flex h-11 cursor-pointer items-center gap-3 rounded-[10px] px-2.5',
                i === cursor && 'bg-hover'
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-subtle text-ink-2">
                <Icon name="pin" size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-ink">{l.name}</span>
                <span className="block truncate text-[12px] text-ink-3">{l.area}</span>
              </span>
              {i === cursor && <Icon name="up" size={14} className="text-ink-3" />}
            </li>
          ))}
        </ul>
      </Presence>
    </div>
  )
}

export default LandmarkSearch
