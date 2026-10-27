// Exclusive tools. Order = rail order; `group` draws a divider between Measure and Analyse.
export const TOOLS = [
  { id: 'sun',     icon: 'sun',        label: 'Sun',     title: 'Sun simulation',            group: 'measure' },
  { id: 'measure', icon: 'ruler',      label: 'Measure', title: 'Measure', group: 'measure' },
  { id: 'los',     icon: 'eye',        label: 'Sight',   title: 'Line of sight',             group: 'measure' },
  { id: 'hist',    icon: 'chart',      label: 'Heights', title: 'Height distribution',       group: 'measure' },
  { id: 'plan',    icon: 'cube',       label: 'Build',   title: 'Development scenario',      group: 'analyse' },
  { id: 'solar',   icon: 'panel',      label: 'Solar',   title: 'Rooftop solar potential',   group: 'analyse' },
  { id: 'access',  icon: 'rings',      label: '15-min',  title: '15-minute city',            group: 'analyse' },
  { id: 'heat',    icon: 'flame',      label: 'Heat',    title: 'Heat and shade',            group: 'analyse' },
  { id: 'views',   icon: 'binoculars', label: 'Views',   title: 'View score',                group: 'analyse' },
]

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]))

// Tools that show a control dock (bottom centre)
export const DOCK_TOOLS = ['sun', 'measure', 'los', 'plan', 'solar', 'access', 'heat', 'views']
// Tools that show a results card in the inspector (bottom right)
export const REPORT_TOOLS = ['hist', 'plan', 'solar', 'access', 'heat', 'views']
// Tools that take map clicks, so clicking must not select buildings
export const PICK_TOOLS = ['measure', 'los', 'plan', 'access', 'views']
