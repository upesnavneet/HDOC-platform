export const EVENT_START_ISO = '2026-05-25T09:00:00+05:30';

export const getDefaultSystemConfig = () => ({
  currentDay: 8,
  simulatedTime: '2026-06-01T09:00:00+05:30',
  completedWeeks: [1],
  challengesLocked: false,
  debuggingLocked: true,
});

export const normalizeSystemConfig = (config) => {
  const defaults = getDefaultSystemConfig();

  if (!config) {
    return { ...defaults, needsRepair: true };
  }

  const parsedDay = Number(config.currentDay);
  const currentDay = Number.isFinite(parsedDay) && parsedDay >= 1 ? parsedDay : defaults.currentDay;

  let simulatedTime = config.simulatedTime;
  if (!simulatedTime || Number.isNaN(new Date(simulatedTime).getTime())) {
    simulatedTime = defaults.simulatedTime;
  }

  const completedWeeks = Array.isArray(config.completedWeeks)
    ? config.completedWeeks.filter((w) => Number.isFinite(Number(w)))
    : [];

  const challengesLocked = typeof config.challengesLocked === 'boolean' ? config.challengesLocked : defaults.challengesLocked;
  const debuggingLocked = typeof config.debuggingLocked === 'boolean' ? config.debuggingLocked : defaults.debuggingLocked;

  const needsRepair =
    !Number.isFinite(parsedDay) ||
    parsedDay < 1 ||
    !config.simulatedTime ||
    Number.isNaN(new Date(config.simulatedTime).getTime()) ||
    !Array.isArray(config.completedWeeks) ||
    typeof config.challengesLocked !== 'boolean' ||
    typeof config.debuggingLocked !== 'boolean';

  return { currentDay, simulatedTime, completedWeeks, challengesLocked, debuggingLocked, needsRepair };
};
