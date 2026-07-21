import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotifications(tokens, { title, body, data }) {
  const messages = [];
  for (const token of tokens) {
    if (!Expo.isExpoPushToken(token)) continue;
    messages.push({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
    });
  }
  if (!messages.length) return [];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      console.error('Push error', err);
    }
  }
  return tickets;
}
