import { Event } from '../src/nostr/entities';

export const REGULAR_EVENT_SCHEMA = {
  id: 'f2c611fb04e2586703ccc13a6ddcbfe7ac5026ace1e0cf2ab79337b3ff73ac70',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1679816105,
  kind: 1,
  tags: [],
  content: 'hello world!',
  sig: 'fa6418a8a9cc2ed336fad1ee971c5e352ad81f2fb642121705eb2a2053a410f6addb225e3684d6aa3a20f6b24731cc6f25fe191f7e937c6d580fe684df41ad8a',
};

export const REPLACEABLE_EVENT_SCHEMA = {
  id: '475511d5d231fd0209ff1f03ec74695b05fef16b33206efe15280c69b953e769',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1679816038,
  kind: 0,
  tags: [],
  content:
    '{"display_name":"Cody Tseng","website":"","name":"cody","about":"","lud06":""}',
  sig: '825a5e943b11ed85210cfcfef1894f51459391d7e531a502e4a1c53c2b6a523409063a4b2b15c226f3a0dd44dab93dea20aea2c46cac3464decb4ed617013d27',
};

export const CAUSE_ERROR_EVENT_SCHEMA = {
  id: '7e8b1ecd5e1bd8e49e0a1f7b350b289ad4553c35e570e44c6a11d727ade74b19',
  pubkey: '601ac81a5bbd42cec83d8564ab6b1b145e61dd95689b11b6a67d37bf420c6268',
  created_at: 1679744985,
  kind: 1,
  tags: [],
  content: 'error',
  sig: '2a4ed22c281140cbb530833df12f36edb5bd9330d0fad48f149c0fee849288c54385c1cca3983dd70af4a89401c8236562239ba360cc4544bbb31fac4ff117af',
};

export const REGULAR_EVENT = Event.fromEventDto({
  id: 'f2c611fb04e2586703ccc13a6ddcbfe7ac5026ace1e0cf2ab79337b3ff73ac70',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1679816105,
  kind: 1,
  tags: [],
  content: 'hello world!',
  sig: 'fa6418a8a9cc2ed336fad1ee971c5e352ad81f2fb642121705eb2a2053a410f6addb225e3684d6aa3a20f6b24731cc6f25fe191f7e937c6d580fe684df41ad8a',
});

export const REPLACEABLE_EVENT = Event.fromEventDto({
  id: '475511d5d231fd0209ff1f03ec74695b05fef16b33206efe15280c69b953e769',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1679816038,
  kind: 0,
  tags: [],
  content:
    '{"display_name":"Cody Tseng","website":"","name":"cody","about":"","lud06":""}',
  sig: '825a5e943b11ed85210cfcfef1894f51459391d7e531a502e4a1c53c2b6a523409063a4b2b15c226f3a0dd44dab93dea20aea2c46cac3464decb4ed617013d27',
});

export const REPLACEABLE_EVENT_NEW = Event.fromEventDto({
  id: '50e1264bcca1e12ccd56e99e4b99d755aa993d5fb420489e25ecfa2cebb0f4da',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1679816105,
  kind: 0,
  tags: [],
  content:
    '{"display_name":"Cody Tseng","website":"","name":"cody","about":"","lud06":""}',
  sig: 'f94af45f6539a78480f96ca71e3ac55a29967f654c30f2ad5dd968fdb4f54cde6a0c0ce0741f9f89785dbf8afd4c377ffc4a9bb38eb1f02fb7e30c6781a138dc',
});

export const EPHEMERAL_EVENT = Event.fromEventDto({
  id: '1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56',
  pubkey: 'd090a3d7ae3411a76b9de086c1aab39fc184084936f6b2a3053c26a6a0215d17',
  created_at: 1679489551,
  kind: 20000,
  tags: [],
  content: 'hello world!',
  sig: '07c044fb29fdd418a9949d4b9d1908f8f4f0909db99eceed652af3fd917fe50aa02537ef9a4de6e8367153edbf54933e75c1d5b2d7f240358cff5b8550893ebd',
});

export const DELETION_EVENT = Event.fromEventDto({
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
});
export const EVENT_IDS_TO_BE_DELETED = [
  '1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56',
  '9cca98e4f6814e4efacec09d04f32dadeaba2cda9c492e63372fa171ca31012d',
];

export const PARAMETERIZED_REPLACEABLE_EVENT = Event.fromEventDto({
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
});

export const FUTURE_REGULAR_EVENT = Event.fromEventDto({
  id: 'ef45d21874ed132de29274d5ebafce77292120aa1599b33d6123c9e6feb20ac7',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 43019827200,
  kind: 1,
  tags: [],
  content: 'from the future',
  sig: 'f0e28991ac6a69e0b0993a4073e5750f37206f2b40f7c9b5d9d091558e481e4121d755a99bef8c5b5d170114e80f5f6da63ffc8270688abacea1d7b467b934c2',
});

export const LEADING_8_ZERO_BITS_REGULAR_EVENT = Event.fromEventDto({
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  kind: 1,
  content: 'hello world!',
  tags: [['nonce', '270', '8']],
  created_at: 1680570950,
  id: '00cb6fcaeb76d8a88a7744890c6750002eac2a3e633f8d55d9355eb0843bd3f2',
  sig: '8dd183d868ea7c691e230e4526eb5290e6889d0a3ee0a937caddc9b0f1430fd94e8634a2fa4b4c2e5328285e7efea3f4e9c881e512d926c617f0020bb0524d6e',
});

export const LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT =
  Event.fromEventDto({
    pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
    kind: 1,
    tags: [],
    content: 'hello world!',
    created_at: 1680572659,
    id: '03ce214162a49910ab7d0837e4b6951d0aaa5b16e9c60f28d31c334a0dedf210',
    sig: '0e21dedd377f7ef24d5d8075c5e30d70de79953df26e4aff1eefc005dde6d6fe4fa73c32de21772e1da42becdc2678039447897651bf41cfdb2965e71432ca3c',
  });

export const LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT = Event.fromEventDto({
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  kind: 1,
  content: 'hello world!',
  tags: [['nonce', '82742', '8']],
  created_at: 1680573114,
  id: '0000883357a4c2adcd7374ef32e05be72146ce76b5e71bf6e08e20b982ccba94',
  sig: 'e83f033333a36a9def543ba367c748008a69e6298cd73e2410f9bd752361b69b810f45db41648db7ee27473913aafefb4b7f59572f7882594b5fbaba16a1d041',
});

export const EXPIRED_EVENT = Event.fromEventDto({
  id: '6c61bbfa615e4fb8ea5a4cfc21b83712780bc2f260d3f777221c06287a1419c4',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1681223538,
  kind: 1,
  tags: [['expiration', '1681223568']],
  content: 'hello',
  sig: 'd1029be23ad06079f7091b75cc23e26d2bcab3fb17c4da685bdcb56ce647713750214734f5c9c2e1f53c64ebe03d91abf2d77427fa0f2f297acf28972fc916b6',
});

export const NON_EXPIRED_EVENT = Event.fromEventDto({
  id: '4946dbd9772b4cd6252346d0f05fe5c36e7b16080fa0229b6de3f6ec168df79d',
  pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
  created_at: 1681223538,
  kind: 1,
  tags: [['expiration', '9999999999']],
  content: 'hello',
  sig: 'dcadbf6d8fd3568c90d504a58b8f977ef829546254ff0d14c4b6386ccbcea9e7f271307ba0939f55d5b08c21e633da997b33d0512e8c4808fc9664d8811aea5f',
});
