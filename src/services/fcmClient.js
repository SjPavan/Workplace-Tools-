export class FCMClient {
  constructor({ projectId, credentials } = {}) {
    this.projectId = projectId;
    this.credentials = credentials;
  }

  send(notification) {
    // In a real integration, this would call the FCM REST API or admin SDK.
    // For this simulation we simply return a payload that mimics success.
    return {
      success: true,
      projectId: this.projectId,
      messageId: `${notification.id}-fcm`,
      detail: `Simulated FCM push to user ${notification.userId}`
    };
  }
}
