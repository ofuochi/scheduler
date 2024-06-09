import { addMilliseconds } from 'date-fns';
import { parseExpression } from 'cron-parser';

export const calculateNextExecutionTime = (
  cronExpression: string,
  delay = 0,
) => {
  const interval = parseExpression(cronExpression, {
    currentDate: new Date(),
  });
  const nextScheduledTime = interval.next().toDate();
  return addMilliseconds(nextScheduledTime, delay);
};
