import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokens, title, body, isAlarm } = req.body;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(200).json({ success: false, message: 'No target tokens' });
    }

    const validTokens = [...new Set(tokens.filter(Boolean))];
    if (validTokens.length === 0) {
      return res.status(200).json({ success: false, message: 'No valid tokens' });
    }

    const message = {
      tokens: validTokens,
      notification: {
        title: title || '🚨 RedPulse Emergency Alert!',
        body: body || 'জরুরি রক্তের প্রয়োজন বা নতুন মেসেজ এসেছে!'
      },
      data: {
        isAlarm: isAlarm ? 'true' : 'false',
        title: title || '🚨 RedPulse Emergency Alert!',
        body: body || 'জরুরি রক্তের প্রয়োজন!'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'redpulse_urgent',
          priority: 'max',
          defaultVibrateTimings: false,
          vibrateTimingsMillis: [500, 200, 500, 200, 800]
        }
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
          badge: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
          vibrate: [500, 200, 500, 200, 800],
          requireInteraction: true,
          silent: false
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return res.status(200).json({ success: true, sentCount: response.successCount });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}