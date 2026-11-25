import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokens, title, body, isAlarm, data = {} } = req.body;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(200).json({ success: true, message: 'No tokens provided' });
    }

    const message = {
      tokens,
      notification: { title, body },
      data: {
        ...data,
        title: String(title || ''),
        body: String(body || ''),
        isAlarm: isAlarm ? 'true' : 'false'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: isAlarm ? 'emergency_alarm_channel' : 'default_channel',
          defaultVibrateTimings: false,
          vibrateTimingsMillis: isAlarm ? [800, 200, 800, 200, 1000] : [250, 100, 250]
        }
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          requireInteraction: Boolean(isAlarm),
          renotify: true
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return res.status(200).json({ success: true, response });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}