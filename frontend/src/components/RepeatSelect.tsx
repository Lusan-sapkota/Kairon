import {REPEAT_OPTIONS} from '../types';

type Props = {
    value: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    className?: string;
};

export function RepeatSelect({value, disabled, onChange, className}: Props) {
    return (
        <select className={className ?? 'input input-sm'} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
            {REPEAT_OPTIONS.map((opt) => (
                <option key={opt.value || 'none'} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
