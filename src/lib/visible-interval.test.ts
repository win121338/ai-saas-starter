import { afterEach, expect, it, vi } from "vitest";
import { visibleInterval } from "./visible-interval";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("pauses work while hidden, resumes once, and releases timers/listeners on disposal", () => {
  vi.useFakeTimers();
  const document = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal("document", document);
  const callback = vi.fn();
  const dispose = visibleInterval(callback, 1000, true);
  expect(callback).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(2000);
  expect(callback).toHaveBeenCalledTimes(3);
  document.hidden = true;
  document.dispatchEvent(new Event("visibilitychange"));
  expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(10000);
  expect(callback).toHaveBeenCalledTimes(3);
  document.hidden = false;
  document.dispatchEvent(new Event("visibilitychange"));
  expect(callback).toHaveBeenCalledTimes(4);
  expect(vi.getTimerCount()).toBe(1);
  dispose();
  document.dispatchEvent(new Event("visibilitychange"));
  vi.advanceTimersByTime(2000);
  expect(callback).toHaveBeenCalledTimes(4);
  expect(vi.getTimerCount()).toBe(0);
});

it("does not start a timer when mounted in a hidden tab", () => {
  vi.useFakeTimers();
  vi.stubGlobal("document", Object.assign(new EventTarget(), { hidden: true }));
  const callback = vi.fn();
  const dispose = visibleInterval(callback, 1000, true);
  expect(callback).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
  dispose();
});
