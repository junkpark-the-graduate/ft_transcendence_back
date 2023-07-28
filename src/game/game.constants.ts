const PADDLE_WIDTH = 8;
const PADDLE_HEIGHT = 1;
const PADDLE_SPEED = 1;
const BALL_SIZE = 1;
const BALL_SPEED = 0.5;
const PLANE_WIDTH = 50;
const PLANE_HEIGHT = 100;
const WIN_SCORE = 10;
const MMR_K = 32;

export {
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  BALL_SIZE,
  BALL_SPEED,
  PLANE_WIDTH,
  PLANE_HEIGHT,
  WIN_SCORE,
  // MMR 상수
  MMR_K,
};

export enum GameType {
  NORMAL = 'normal',
  LADDER = 'ladder',
  FRIENDLY = 'friendly',
  ALL = 'all',
}
