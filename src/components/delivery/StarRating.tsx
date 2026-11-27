"use client";

type StarRatingProps = {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
};

export function StarRating({ label, value, onChange }: StarRatingProps) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-1 text-sm font-medium text-foreground">{label}</legend>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={`min-h-10 min-w-10 rounded-lg text-lg ${
              value != null && n <= value
                ? "bg-amber-100 text-amber-600"
                : "bg-background text-muted border border-line"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </fieldset>
  );
}