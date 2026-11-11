import { defineType, defineField } from 'sanity';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const dayHoursFields = (day: string) => [
  defineField({
    name: `${day}Open`,
    title: `${day.charAt(0).toUpperCase() + day.slice(1)} open`,
    type: 'string',
    description: 'HH:MM 24-hour format e.g. "07:00"',
    validation: (rule) => rule.regex(/^\d{2}:\d{2}$/).error('Use HH:MM format'),
  }),
  defineField({
    name: `${day}Close`,
    title: `${day.charAt(0).toUpperCase() + day.slice(1)} close`,
    type: 'string',
    description: 'HH:MM 24-hour format e.g. "22:00"',
    validation: (rule) => rule.regex(/^\d{2}:\d{2}$/).error('Use HH:MM format'),
  }),
  defineField({
    name: `${day}Closed`,
    title: `Closed on ${day}?`,
    type: 'boolean',
    initialValue: false,
  }),
];

/**
 * Opening hours object — one slot per day.
 * Times are stored as HH:MM strings in Asia/Dubai local time.
 * Display logic converts to locale-aware format in the web app.
 */
export const openingHours = defineType({
  name: 'openingHours',
  title: 'Opening Hours',
  type: 'object',
  fields: DAYS_OF_WEEK.flatMap(dayHoursFields),
});
