const detox = require('detox');
const config = require('../detox.config');

beforeAll(async () => {
  await detox.init(config);
}, 120000);

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await detox.cleanup();
});
