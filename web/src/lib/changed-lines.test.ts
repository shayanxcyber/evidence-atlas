import { expect, it } from "vitest";
import { changedLines } from "./changed-lines";

it("keeps unchanged lines aligned when the other version inserts a line", () => {
  expect([
    ...changedLines("Heading\nOriginal\nEnd", "Heading\nAdded\nOriginal\nEnd"),
  ]).toEqual([]);
  expect([
    ...changedLines("Heading\nAdded\nOriginal\nEnd", "Heading\nOriginal\nEnd"),
  ]).toEqual([1]);
});

it("marks replacements and deletions, including repeated blank lines", () => {
  expect([
    ...changedLines("Heading\n\n10,000\n\nEnd", "Heading\n\n8,000\n\nEnd"),
  ]).toEqual([2]);
  expect([...changedLines("Heading\nRemoved\nEnd", "Heading\nEnd")]).toEqual([
    1,
  ]);
  expect([...changedLines("Same\n\ntext", "Same\n\ntext")]).toEqual([]);
});
