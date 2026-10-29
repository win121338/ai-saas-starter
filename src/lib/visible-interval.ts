/** Pause browser-only work while hidden; dispose both the timer and listener. */
export function visibleInterval(
  callback: () => void,
  delay: number,
  immediate = false,
) {
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    clearInterval(timer);
    timer = undefined;
  };
  const start = (run: boolean) => {
    stop();
    if (document.hidden) return;
    if (run) callback();
    timer = setInterval(callback, delay);
  };
  const visibility = () => start(true);
  document.addEventListener("visibilitychange", visibility);
  start(immediate);
  return () => {
    stop();
    document.removeEventListener("visibilitychange", visibility);
  };
}
