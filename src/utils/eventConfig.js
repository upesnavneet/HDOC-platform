export const EVENT_START_ISO = '2026-05-25T09:00:00+05:30';

export const getDefaultSystemConfig = () => ({
  currentDay: 8,
  simulatedTime: '2026-06-01T09:00:00+05:30',
  completedWeeks: [1],
});

export const normalizeSystemConfig = (config) => {
  const defaults = getDefaultSystemConfig();

  if (!config) {
    return { ...defaults, needsRepair: true };
  }

  const parsedDay = Number(config.currentDay);
  const currentDay =
    Number.isFinite(parsedDay) && parsedDay >= 1 ? parsedDay : defaults.currentDay;

  let simulatedTime = config.simulatedTime;
  if (!simulatedTime || Number.isNaN(new Date(simulatedTime).getTime())) {
    simulatedTime = defaults.simulatedTime;
  }

  const completedWeeks = Array.isArray(config.completedWeeks)
    ? config.completedWeeks.filter((w) => Number.isFinite(Number(w)))
    : [];

  const needsRepair =
    !Number.isFinite(parsedDay) ||
    parsedDay < 1 ||
    !config.simulatedTime ||
    Number.isNaN(new Date(config.simulatedTime).getTime()) ||
    !Array.isArray(config.completedWeeks);

  return { currentDay, simulatedTime, completedWeeks, needsRepair };
};
