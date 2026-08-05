type PersonalitySliderProps = {
  id: string
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}

function PersonalitySlider({
  id,
  label,
  description,
  value,
  onChange,
}: PersonalitySliderProps) {
  return (
    <div className="personality-slider">
      <div className="personality-slider-header">
        <div>
          <label htmlFor={id}>{label}</label>
          <p>{description}</p>
        </div>

        <output htmlFor={id}>{value}</output>
      </div>

      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      />

      <div className="personality-slider-scale">
        <span>Low</span>
        <span>Balanced</span>
        <span>High</span>
      </div>
    </div>
  )
}

export default PersonalitySlider