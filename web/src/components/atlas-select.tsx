import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export type SelectChoice = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

// A single selector for modes, retained versions, ranking limits and relations.
// Radix owns focus, typeahead and popup positioning; local styles own the surface.
export function AtlasSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectChoice[];
  disabled?: boolean;
}) {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger className="atlas-select-trigger" aria-label={label}>
        <Select.Value placeholder="Choose…" />
        <Select.Icon>
          <ChevronDown size={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="atlas-select-content"
          position="popper"
          sideOffset={7}
          collisionPadding={16}
        >
          <Select.ScrollUpButton className="atlas-select-scroll">
            <ChevronUp size={14} />
          </Select.ScrollUpButton>
          <Select.Viewport className="atlas-select-viewport">
            <Select.Group>
              <Select.Label className="atlas-select-label">
                {label}
              </Select.Label>
              {options.map((option) => (
                <Select.Item
                  className="atlas-select-item"
                  value={option.value}
                  key={option.value}
                  disabled={option.disabled}
                >
                  <span>
                    <Select.ItemText>{option.label}</Select.ItemText>
                    {option.description && <small>{option.description}</small>}
                  </span>
                  <Select.ItemIndicator>
                    <Check size={15} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Viewport>
          <Select.ScrollDownButton className="atlas-select-scroll">
            <ChevronDown size={14} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
