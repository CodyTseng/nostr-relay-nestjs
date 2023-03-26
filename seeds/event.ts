export const REGULAR_EVENT = {
  id: 'f2c611fb04e2586703ccc13a6ddcbfe7ac5026ace1e0cf2ab79337b3ff73ac70',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1679816105,
  kind: 1,
  tags: [],
  content: 'hello world!',
  sig: 'fa6418a8a9cc2ed336fad1ee971c5e352ad81f2fb642121705eb2a2053a410f6addb225e3684d6aa3a20f6b24731cc6f25fe191f7e937c6d580fe684df41ad8a',
};

export const REPLACEABLE_EVENT = {
  id: '475511d5d231fd0209ff1f03ec74695b05fef16b33206efe15280c69b953e769',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1679816038,
  kind: 0,
  tags: [],
  content:
    '{"display_name":"Cody Tseng","website":"","name":"cody","about":"","lud06":""}',
  sig: '825a5e943b11ed85210cfcfef1894f51459391d7e531a502e4a1c53c2b6a523409063a4b2b15c226f3a0dd44dab93dea20aea2c46cac3464decb4ed617013d27',
};

export const REPLACEABLE_EVENT_NEW = {
  id: '50e1264bcca1e12ccd56e99e4b99d755aa993d5fb420489e25ecfa2cebb0f4da',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1679816105,
  kind: 0,
  tags: [],
  content:
    '{"display_name":"Cody Tseng","website":"","name":"cody","about":"","lud06":""}',
  sig: 'f94af45f6539a78480f96ca71e3ac55a29967f654c30f2ad5dd968fdb4f54cde6a0c0ce0741f9f89785dbf8afd4c377ffc4a9bb38eb1f02fb7e30c6781a138dc',
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

export const PARAMETERIZED_REPLACEABLE_EVENT = {
  id: '3af892aeb1dee9a711891d03d31f27ed11fb97fc965e5586022dfde254ada8ac',
  pubkey: '43fa6380631860e67ba87677872c42b3a74482b04d07ca9b1dd70d1a4e6775ef',
  created_at: 1679582827,
  kind: 30000,
  tags: [
    ['d', 'test'],
    ['p', '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0'],
    ['p', 'bd338e052dacfe55ff6d8cca8624df6ec9293ff3dc6c6f1dbf4b2388e9fb20fa'],
  ],
  content: '',
  sig: 'f652c9a5b5750cdde39a593a0e74507fcceb4a2fd38de02ad5c843515b1b22ee2d577a723db840f2d8f93913a73ff23fcd6ceb9f4eb62c8f523b0e56a228b88e',
};

export const CAUSE_ERROR_EVENT = {
  id: '7e8b1ecd5e1bd8e49e0a1f7b350b289ad4553c35e570e44c6a11d727ade74b19',
  pubkey: '601ac81a5bbd42cec83d8564ab6b1b145e61dd95689b11b6a67d37bf420c6268',
  created_at: 1679744985,
  kind: 1,
  tags: [],
  content: 'error',
  sig: '2a4ed22c281140cbb530833df12f36edb5bd9330d0fad48f149c0fee849288c54385c1cca3983dd70af4a89401c8236562239ba360cc4544bbb31fac4ff117af',
};
