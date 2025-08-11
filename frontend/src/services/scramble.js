import { generateScramble } from 'react-rubiks-cube-utils'

export const getScramble = () => {
  const scramble = generateScramble({ type: '3x3' });
  return scramble;
};
