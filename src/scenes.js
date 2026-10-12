// -----------------------------------------------------------------------------
// Scene actions (manifest `scene_actions`). "Check a date" answers for today,
// tomorrow or any day of the coming year; the following steps of the scene
// read its outputs ({{<column>.<row>.is_workday}}) and test them with a
// "Condition on variables". The yes/no outputs are numbers (1 = yes, 0 = no,
// -1 = unknown): that condition compares strictly, a number typed in it is
// stored as a number, and nothing typed there can equal a boolean.
// -----------------------------------------------------------------------------

import { addDays } from './dates.js';
import { holidayName } from './service.js';

export const MAX_DAYS_AHEAD = 366;

const yesNo = (value) => (value === undefined ? -1 : value ? 1 : 0);

export const SCENE_ACTIONS = {
  check_date: async (service, { fields = {} }) => {
    const raw = Math.trunc(Number(fields.days_ahead ?? 0));
    const daysAhead = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), MAX_DAYS_AHEAD) : 0;
    const day = service.day(addDays(service.today(), daysAhead));
    return {
      date: day.date,
      is_workday: yesNo(day.workday),
      is_holiday: yesNo(day.holiday),
      holiday_name: holidayName(day.holidays),
      is_school_holiday: yesNo(day.school),
      school_holiday_name: day.period?.name ?? '',
    };
  },
};
