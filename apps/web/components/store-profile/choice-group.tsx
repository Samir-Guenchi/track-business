interface ChoiceGroupProps<T extends string> {
  readonly legend: string;
  readonly name: string;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly value: T | undefined;
  readonly onChange: (value: T) => void;
}

/** A row of radio buttons; the native inputs keep keyboard and screen reader support. */
export function ChoiceGroup<T extends string>(props: ChoiceGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{props.legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {props.options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 rounded-control border border-border bg-surface p-2 text-sm"
          >
            <input
              type="radio"
              name={props.name}
              checked={props.value === option.value}
              onChange={() => props.onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
