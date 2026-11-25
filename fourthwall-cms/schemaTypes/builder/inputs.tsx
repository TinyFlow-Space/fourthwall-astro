import { useCallback } from "react";
import {
  set,
  setIfMissing,
  unset,
  type NumberInputProps,
  type ObjectInputProps,
} from "sanity";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { DesktopIcon } from "@sanity/icons/Desktop";
import { MobileDeviceIcon } from "@sanity/icons/MobileDevice";
import { TabletDeviceIcon } from "@sanity/icons/TabletDevice";

export interface SliderOptions {
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  /** Show an "Auto"-style button that clears the value. */
  allowUnset?: boolean;
  unsetLabel?: string;
}

const rangeStyle = { width: "100%", accentColor: "var(--card-focus-ring-color)" };

/** A number field edited with a drag slider (max width, padding, gaps, radius…). */
export function RangeSliderInput(props: NumberInputProps) {
  const { onChange, value, schemaType, elementProps } = props;
  const options = (schemaType.options ?? {}) as SliderOptions;
  const min = options.min ?? 0;
  const max = options.max ?? 100;
  const step = options.step ?? 1;
  const suffix = options.suffix ?? "";
  const isUnset = typeof value !== "number";
  const shown = isUnset ? min : value;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Number(event.currentTarget.value);
      onChange(Number.isNaN(next) ? unset() : set(next));
    },
    [onChange],
  );

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Flex align="center" gap={3}>
        <Box flex={1}>
          <input
            id={elementProps.id}
            ref={elementProps.ref as React.Ref<HTMLInputElement>}
            onFocus={elementProps.onFocus}
            onBlur={elementProps.onBlur}
            type="range"
            min={min}
            max={max}
            step={step}
            value={shown}
            onChange={handleChange}
            style={{ ...rangeStyle, opacity: isUnset && options.allowUnset ? 0.45 : 1 }}
          />
        </Box>
        <Box style={{ minWidth: "4.5em", textAlign: "right" }}>
          <Text size={1} weight="semibold">
            {isUnset && options.allowUnset ? options.unsetLabel ?? "Auto" : `${shown}${suffix}`}
          </Text>
        </Box>
        {options.allowUnset && !isUnset && (
          <Button
            mode="ghost"
            fontSize={1}
            padding={2}
            text={options.unsetLabel ?? "Auto"}
            onClick={() => onChange(unset())}
          />
        )}
      </Flex>
    </Card>
  );
}

const BREAKPOINTS = [
  { key: "mobile", label: "Mobile", Icon: MobileDeviceIcon },
  { key: "tablet", label: "Tablet", Icon: TabletDeviceIcon },
  { key: "desktop", label: "Desktop", Icon: DesktopIcon },
] as const;

/** `{ mobile, tablet, desktop }` edited with one drag slider per breakpoint. */
export function ResponsiveNumberInput(props: ObjectInputProps) {
  const { onChange, schemaType } = props;
  const value = props.value as Record<string, number | undefined> | undefined;
  const options = (schemaType.options ?? {}) as SliderOptions;
  const min = options.min ?? 1;
  const max = options.max ?? 6;
  const step = options.step ?? 1;
  const suffix = options.suffix ?? "";

  const handleChange = useCallback(
    (key: string, raw: string) => {
      const next = Number(raw);
      onChange(Number.isNaN(next) ? unset([key]) : [setIfMissing({}), set(next, [key])]);
    },
    [onChange],
  );

  return (
    <Stack gap={2}>
      {BREAKPOINTS.map(({ key, label, Icon }) => {
        const current: number = value?.[key] ?? min;
        return (
          <Card key={key} padding={3} radius={2} border tone="transparent">
            <Flex align="center" gap={3}>
              <Text size={2} muted>
                <Icon />
              </Text>
              <Box flex={1}>
                <Flex align="center" justify="space-between">
                  <Text size={1} weight="semibold" muted>
                    {label}
                  </Text>
                  <Text size={1} weight="semibold">
                    {current}
                    {suffix}
                  </Text>
                </Flex>
                <Box marginTop={2}>
                  <input
                    type="range"
                    aria-label={`${schemaType.title ?? "Value"} — ${label}`}
                    min={min}
                    max={max}
                    step={step}
                    value={current}
                    onChange={(event) => handleChange(key, event.currentTarget.value)}
                    style={rangeStyle}
                  />
                </Box>
              </Box>
            </Flex>
          </Card>
        );
      })}
    </Stack>
  );
}
