describe('Authentication smoke test', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('renders the login screen on launch', async () => {
    await expect(element(by.id('login-title'))).toBeVisible();
    await expect(element(by.id('login-email'))).toBeVisible();
    await expect(element(by.id('login-password'))).toBeVisible();
  });
});
