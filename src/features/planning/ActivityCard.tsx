type Props = {
  error?: string;
  helperText: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function ActivityCard({ error, helperText, label, name, onChange, placeholder, value }: Props) {
  return (
    <label className="activity-card">
      <span>{label}</span>
      <input
        inputMode="numeric"
        name={name}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        pattern="\d*"
        placeholder={placeholder}
        type="text"
        value={value}
      />
      <span className="helper-text">{helperText}</span>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export default ActivityCard;
