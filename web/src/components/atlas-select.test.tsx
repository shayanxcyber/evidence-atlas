import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";
import { AtlasSelect } from "./atlas-select";

function Fixture() {
  const [value, setValue] = useState("three");
  return (
    <AtlasSelect
      label="Retrieval depth"
      value={value}
      onChange={setValue}
      options={[
        { value: "one", label: "Top 1" },
        { value: "three", label: "Top 3" },
        { value: "model", label: "Unavailable", disabled: true },
        { value: "five", label: "Top 5" },
      ]}
    />
  );
}

it("selects with the keyboard, skips a disabled option and restores trigger focus", async () => {
  const user = userEvent.setup();
  render(<Fixture />);
  const trigger = screen.getByRole("combobox", { name: "Retrieval depth" });
  trigger.focus();
  await user.keyboard("{Enter}");
  await screen.findByRole("listbox");
  await user.keyboard("{ArrowDown}{Enter}");
  await waitFor(() => expect(trigger.textContent).toContain("Top 5"));
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

it("closes on Escape without changing the selection", async () => {
  const user = userEvent.setup();
  render(<Fixture />);
  const trigger = screen.getByRole("combobox", { name: "Retrieval depth" });
  trigger.focus();
  await user.keyboard("{Enter}{ArrowDown}{Escape}");
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  expect(trigger.textContent).toContain("Top 3");
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
