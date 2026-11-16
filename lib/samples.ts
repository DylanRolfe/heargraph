/**
 * Built-in example worksheets. Every number here is invented for demonstration.
 */
import type { Sample } from './types';

const SYNTHETIC_NOTE = '(Synthetic data, made up for this example.)';

export const samples: Sample[] = [
  {
    id: 'cart',
    synthetic: true,
    context: `A cart is pushed up a gentle ramp, slows down, stops, and rolls back down. ${SYNTHETIC_NOTE}`,
    worksheet: {
      title: 'Cart on a track: velocity vs time',
      x: { label: 'Time', unit: 's', values: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      series: [{ label: 'Velocity', unit: 'm/s', values: [6, 4.5, 3, 1.5, 0, -1.5, -3, -4.5, -6] }],
      questions: [
        {
          kind: 'number',
          prompt: 'At what time does the cart stop?',
          answer: 4,
          tolerance: 0.05,
          unit: 's',
          explanation:
            'The cart stops when its velocity is 0 m/s. Press Z in the graph to jump to the zero crossing, or look for 0 in the velocity column of the table. That is at 4 s.',
        },
        {
          kind: 'choice',
          prompt: 'Is the cart speeding up or slowing down between 0 and 4 s?',
          choices: ['Speeding up', 'Slowing down', 'Staying at the same speed'],
          answer: 'Slowing down',
          explanation:
            'The velocity goes from 6 m/s down to 0 m/s, so the speed gets smaller. You can hear the pitch fall.',
        },
        {
          kind: 'number',
          prompt: 'What is the velocity at 6 s?',
          answer: -3,
          tolerance: 0.05,
          unit: 'm/s',
          explanation:
            'Move to the point where time is 6 s. The velocity there is -3 m/s. The negative sign means the cart is moving backward.',
        },
      ],
    },
  },
  {
    id: 'temperature',
    synthetic: true,
    context: `The temperature outside on a cold day, noted every two hours from midnight to midnight. ${SYNTHETIC_NOTE}`,
    worksheet: {
      title: 'Outdoor temperature over one day',
      x: { label: 'Time', unit: 'h', values: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] },
      series: [
        {
          label: 'Temperature',
          unit: '°C',
          values: [-3, -4.5, -5.5, -4, 1, 6, 10, 12.5, 11, 7, 3, -1, -2.5],
        },
      ],
      questions: [],
    },
  },
  {
    id: 'population',
    synthetic: true,
    context: `Two dishes of bacteria are counted once an hour for ten hours. ${SYNTHETIC_NOTE}`,
    worksheet: {
      title: 'Bacteria colony growth in two dishes',
      x: { label: 'Time', unit: 'h', values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      series: [
        { label: 'Dish A', unit: 'thousand cells', values: [2, 4, 8, 15, 26, 38, 47, 53, 56, 58, 59] },
        { label: 'Dish B', unit: 'thousand cells', values: [2, 3, 4.5, 6.5, 9, 12.5, 17, 22, 28, 34, 40] },
      ],
      questions: [
        {
          kind: 'number',
          prompt: 'How many thousand cells are in Dish A at 5 h?',
          answer: 38,
          tolerance: 0.5,
          unit: 'thousand cells',
          explanation:
            'Move to the point where time is 5 h with the arrow keys, or find the row for 5 h in the data table. Dish A has 38 thousand cells there.',
        },
        {
          kind: 'choice',
          prompt: 'Which dish has more cells at 10 h?',
          choices: ['Dish A', 'Dish B', 'They are the same'],
          answer: 'Dish A',
          explanation:
            'Press End to go to 10 h, then press the Up or Down arrow to switch between the two lines. Dish A has 59 thousand cells and Dish B has 40 thousand cells.',
        },
        {
          kind: 'choice',
          prompt: 'Between 6 and 10 h, which dish is growing faster?',
          choices: ['Dish A', 'Dish B', 'They grow at the same rate'],
          answer: 'Dish B',
          explanation:
            'From 6 to 10 h, Dish A goes from 47 to 59 thousand cells, a gain of 12. Dish B goes from 17 to 40 thousand cells, a gain of 23. You can also hear it: the pitch of Dish A levels off while the pitch of Dish B keeps rising.',
        },
      ],
    },
  },
];

export function getSample(id: string): Sample | undefined {
  return samples.find((s) => s.id === id);
}
