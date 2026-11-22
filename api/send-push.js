import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({
    credential: cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokens, title, body, isAlarm } = req.body;
    const validTokens = (tokens || []).filter(Boolean);

    if (validTokens.length === 0) {
      return res.status(200).json({ message: 'No valid tokens to send' });
    }

    const message = {
      notification: { title, body },
      data: {
        isAlarm: isAlarm ? 'true' : 'false',
        url: '/'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'redpulse_urgent',
          priority: 'max'
        }
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          requireInteraction: isAlarm ? true : false,
          vibrate: isAlarm ? [800, 300, 800, 300, 1000] : [300, 100, 300]
        }
      },
      tokens: validTokens
    };

    const response = await getMessaging().sendEachForMulticast(message);
    return res.status(200).json({ success: true, sentCount: response.successCount });
  } catch (error) {
    console.error('Push error:', error);
    return res.status(500).json({ error: error.message });
  }
}