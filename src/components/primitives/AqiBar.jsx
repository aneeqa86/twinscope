import { AQI_LEVELS } from '@/config/legends'

/** Five segments; the current level is full opacity, the rest 28%. Level word + n / 5 alongside. */
const AqiBar = ({ index, className }) => (
  <div className={className}>
    <div className="flex gap-[3px]" role="img" aria-label={`Air quality ${index} of 5`}>
      {AQI_LEVELS.map((l) => (
        <span
          key={l.index}
          className="h-1.5 flex-1 rounded-full"
          style={{ background: `var(${l.token})`, opacity: l.index === index ? 1 : 0.28 }}
        />
      ))}
    </div>
  </div>
)

export default AqiBar
