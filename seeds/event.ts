export const REGULAR_EVENT = {
  id: 'e5055648849a5eb964a9cd9a43a375ea8082a54167e2913ba0654e79fd611990',
  pubkey: 'e439e14accbb5bd6b615a5d3b18bc135fb525f4f594946b72ebe8fa1ec2e5d9a',
  created_at: 1679496449,
  kind: 1,
  tags: [],
  content: 'hello world!',
  sig: '16d63a9143a86e4eadce11c1d6e371e2c695ae212432346a7039a096f067d0e6d60b9191dde95b6f0354b43851b06e6203f5637289db6f5d75a7b48058061426',
};

export const REPLACEABLE_EVENT = {
  id: '1fb2161b27b2fba2ed3dc1b4131357994888bd68a6a4dc60ddb148ce6dcbaf0d',
  pubkey: 'e439e14accbb5bd6b615a5d3b18bc135fb525f4f594946b72ebe8fa1ec2e5d9a',
  created_at: 1679496449,
  kind: 0,
  tags: [],
  content:
    '{"display_name":"Cody Tseng","website":"","name":"cody","about":"","lud06":""}',
  sig: '55844eac40161bbef079ab38da02dcaff9d64ed498fbb15ea8b349fb1dcb428f1144f5747abfdb180dd3f5ac98ff3b6c47428ca36113da73d0a1943a9a712232',
};

export const EPHEMERAL_EVENT = {
  id: '1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56',
  pubkey: 'd090a3d7ae3411a76b9de086c1aab39fc184084936f6b2a3053c26a6a0215d17',
  created_at: 1679489551,
  kind: 20000,
  tags: [],
  content: 'hello world!',
  sig: '07c044fb29fdd418a9949d4b9d1908f8f4f0909db99eceed652af3fd917fe50aa02537ef9a4de6e8367153edbf54933e75c1d5b2d7f240358cff5b8550893ebd',
};

export const DELETION_EVENT = {
  id: '75c81dc727794f7c924ea5f96fabb138556817a46240e217613d161cd4b0c5fa',
  pubkey: 'd090a3d7ae3411a76b9de086c1aab39fc184084936f6b2a3053c26a6a0215d17',
  created_at: 1679489551,
  kind: 5,
  tags: [
    ['e', '1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56'],
    ['e', '9cca98e4f6814e4efacec09d04f32dadeaba2cda9c492e63372fa171ca31012d'],
    ['e', '9cca98e4f6814e4efacec09d04f32dadeaba2cda9c492e63372fa171ca31012d'],
    ['e', '9cca98e4f6814e'],
    ['p', 'd090a3d7ae3411a76b9de086c1aab39fc184084936f6b2a3053c26a6a0215d17'],
  ],
  content: '',
  sig: '9d26cd4e47317faf5d2600ee226d7665841f8c072a845de2942b6e6117be31d3ecd70d64989ebaf4a17900d3e8cac568386f38f1a9d45e86a78822a2c8d5bbcd',
};
export const EVENT_IDS_TO_BE_DELETED = [
  '1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56',
  '9cca98e4f6814e4efacec09d04f32dadeaba2cda9c492e63372fa171ca31012d',
];
