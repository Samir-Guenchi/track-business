import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';

/** One desk, already worded in the reader's language by the app. */
export interface StopDeskOption {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  /** "Bab Ezzouar · Yalidine". */
  readonly place: string;
  readonly hours: string | null;
  /** "1.2 km", or null when the distance is unknown. */
  readonly distance: string | null;
  readonly mapUrl: string | null;
}

export interface StopDeskPickerLabels {
  readonly legend: string;
  readonly empty: string;
  readonly openMap: string;
}

export interface StopDeskPickerProps {
  readonly options: readonly StopDeskOption[];
  readonly value: string | null;
  readonly onChange: (id: string) => void;
  readonly labels: StopDeskPickerLabels;
  /** Shown next to the legend, e.g. a "near me" button. */
  readonly action?: ReactNode;
  /** Shown under the chosen desk, e.g. a small map. */
  readonly preview?: ReactNode;
  readonly required?: boolean;
}

function DeskDetails({
  option,
  openMap,
}: {
  readonly option: StopDeskOption;
  readonly openMap: string;
}) {
  return (
    <span className="flex flex-1 flex-col gap-0.5 text-sm">
      <span className="flex justify-between gap-2 font-medium">
        <span>{option.name}</span>
        {option.distance && (
          <span className="shrink-0 text-muted" dir="ltr">
            {option.distance}
          </span>
        )}
      </span>
      <span>{option.address}</span>
      <span className="text-muted">{option.place}</span>
      {option.hours && (
        <span className="text-muted" dir="ltr">
          {option.hours}
        </span>
      )}
      {option.mapUrl && (
        <a
          href={option.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-tape underline"
        >
          <MapPin size={14} aria-hidden />
          {openMap}
        </a>
      )}
    </span>
  );
}

function DeskCard({
  option,
  checked,
  onChange,
  labels,
  required,
}: {
  readonly option: StopDeskOption;
  readonly checked: boolean;
  readonly onChange: (id: string) => void;
  readonly labels: StopDeskPickerLabels;
  readonly required: boolean;
}) {
  return (
    <label
      data-checked={checked}
      className="flex cursor-pointer gap-3 rounded-panel border border-border bg-surface p-3 data-[checked=true]:border-tape"
    >
      <input
        type="radio"
        name="stopDesk"
        value={option.id}
        checked={checked}
        required={required}
        onChange={() => onChange(option.id)}
        className="mt-1"
      />
      <DeskDetails option={option} openMap={labels.openMap} />
    </label>
  );
}

/** Stop-desk chooser (#137): a list of nearby desks with hours, distance and a map link. */
export function StopDeskPicker(props: StopDeskPickerProps) {
  const { options, value, onChange, labels, action, preview, required = false } = props;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="flex w-full items-center justify-between gap-2 pb-2 text-sm font-medium">
        <span>{labels.legend}</span>
        {action}
      </legend>
      {options.length === 0 && <p className="text-sm text-muted">{labels.empty}</p>}
      {options.map((option) => (
        <div key={option.id} className="flex flex-col gap-2">
          <DeskCard
            option={option}
            checked={option.id === value}
            onChange={onChange}
            labels={labels}
            required={required}
          />
          {option.id === value && preview}
        </div>
      ))}
    </fieldset>
  );
}
