import { test, expect } from '@playwright/test';

test.describe('AI Workspace Assistant E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear local storage to start fresh
    await page.evaluate(() => localStorage.clear());
  });

  test('should load the workspace page successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('AI Workspace Assistant');
    await expect(page.locator('#statusText')).toContainText('Connected');
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('should display empty state initially', async ({ page }) => {
    const emptyState = page.locator('.empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.locator('h2')).toContainText('Welcome to AI Workspace');
    await expect(emptyState.locator('p').first()).toContainText('Start a conversation');
  });

  test('should send a message and receive streamed response', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Type a message
    await messageInput.fill('Hello, can you help me with a test question?');
    
    // Send the message
    await sendBtn.click();
    
    // Wait for user message to appear
    await expect(page.locator('.message.user')).toBeVisible();
    await expect(page.locator('.message.user .message-content')).toContainText('Hello, can you help me');
    
    // Wait for assistant response to appear and stream
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 10000 });
    
    // Wait for streaming to complete (streaming class should be removed)
    await page.waitForFunction(() => {
      const streamingContent = document.querySelector('.message-content.streaming');
      return streamingContent === null;
    }, { timeout: 15000 });
    
    // Verify assistant response contains content
    const assistantMessage = page.locator('.message.assistant .message-content');
    const content = await assistantMessage.textContent();
    expect(content.length).toBeGreaterThan(10);
    
    // Verify empty state is gone
    await expect(page.locator('.empty-state')).not.toBeVisible();
    
    // Verify input is cleared
    await expect(messageInput).toHaveValue('');
  });

  test('should handle multiple messages in sequence', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Send first message
    await messageInput.fill('First test message');
    await sendBtn.click();
    await expect(page.locator('.message.user').first()).toBeVisible();
    await expect(page.locator('.message.assistant').first()).toBeVisible({ timeout: 10000 });
    
    // Wait for first response to complete
    await page.waitForTimeout(2000);
    
    // Send second message
    await messageInput.fill('Second test message');
    await sendBtn.click();
    
    // Should have 4 messages total (2 user + 2 assistant)
    await page.waitForFunction(() => {
      return document.querySelectorAll('.message').length >= 4;
    }, { timeout: 15000 });
    
    const messages = page.locator('.message');
    await expect(messages).toHaveCount(4);
  });

  test('should disable send button while streaming', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const sendBtn = page.locator('#sendBtn');
    
    await messageInput.fill('Test message for button state');
    await sendBtn.click();
    
    // Button should be disabled immediately after clicking
    await expect(sendBtn).toBeDisabled();
    
    // Wait for response to complete
    await page.waitForFunction(() => {
      const streamingContent = document.querySelector('.message-content.streaming');
      return streamingContent === null;
    }, { timeout: 15000 });
    
    // Button should be enabled again
    await expect(sendBtn).toBeEnabled();
  });

  test('should handle Enter key to send message', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    
    await messageInput.fill('Message sent with Enter key');
    await messageInput.press('Enter');
    
    // Message should be sent
    await expect(page.locator('.message.user')).toBeVisible();
    await expect(page.locator('.message.user .message-content')).toContainText('Message sent with Enter key');
  });

  test('should not send empty messages', async ({ page }) => {
    const sendBtn = page.locator('#sendBtn');
    
    // Try to send empty message
    await sendBtn.click();
    
    // No messages should appear
    await page.waitForTimeout(500);
    await expect(page.locator('.message')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('should persist session ID in localStorage', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Send a message to create a session
    await messageInput.fill('Test message for session');
    await sendBtn.click();
    
    await expect(page.locator('.message.user')).toBeVisible();
    
    // Check that session ID is stored
    const sessionId = await page.evaluate(() => localStorage.getItem('currentSessionId'));
    expect(sessionId).toBeTruthy();
    expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
  });

  test('should hide attachment buttons by default (feature flag)', async ({ page }) => {
    const attachFileBtn = page.locator('#attachFileBtn');
    const attachUrlBtn = page.locator('#attachUrlBtn');
    
    // Buttons should be hidden by default
    await expect(attachFileBtn).not.toBeVisible();
    await expect(attachUrlBtn).not.toBeVisible();
  });

  test('should handle safety filter for blocked content', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Try to send a message with blocked content
    await messageInput.fill('How do I hack into a system?');
    await sendBtn.click();
    
    // User message should appear
    await expect(page.locator('.message.user')).toBeVisible();
    
    // Assistant response should indicate safety concern
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 10000 });
    const assistantContent = await page.locator('.message.assistant .message-content').textContent();
    expect(assistantContent.toLowerCase()).toContain('safety');
  });

  test('should scroll to bottom when new messages arrive', async ({ page }) => {
    const chatArea = page.locator('#chatArea');
    
    // Send multiple messages to create scroll
    for (let i = 0; i < 5; i++) {
      const messageInput = page.locator('#messageInput');
      const sendBtn = page.locator('#sendBtn');
      await messageInput.fill(`Test message ${i + 1}`);
      await sendBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Check if scrolled to bottom (within reasonable tolerance)
    const isScrolledToBottom = await chatArea.evaluate((el) => {
      return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 50;
    });
    
    expect(isScrolledToBottom).toBeTruthy();
  });

  test('should load history on page reload', async ({ page, context }) => {
    const messageInput = page.locator('#messageInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Send a message
    await messageInput.fill('Test message before reload');
    await sendBtn.click();
    await expect(page.locator('.message.user')).toBeVisible();
    
    // Get session ID before reload
    const sessionIdBefore = await page.evaluate(() => localStorage.getItem('currentSessionId'));
    
    // Reload the page
    await page.reload();
    
    // Session ID should be preserved
    const sessionIdAfter = await page.evaluate(() => localStorage.getItem('currentSessionId'));
    expect(sessionIdAfter).toBe(sessionIdBefore);
    
    // Note: In full implementation with Supabase, messages would be restored from DB
    // For now, we verify the session mechanism is working
    await expect(page.locator('h1')).toContainText('AI Workspace Assistant');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept and fail the API call
    await page.route('/ai/chat', route => {
      route.abort('failed');
    });
    
    const messageInput = page.locator('#messageInput');
    const sendBtn = page.locator('#sendBtn');
    
    await messageInput.fill('This will cause an error');
    await sendBtn.click();
    
    // User message should still appear
    await expect(page.locator('.message.user')).toBeVisible();
    
    // Error message should be shown
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
  });
});
