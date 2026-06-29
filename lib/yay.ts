type YaySendSmsInput = {
  to: string;
  body: string;
};

type YaySendSmsResult = {
  messageId: string | null;
  deliveryStatus: string;
};

export async function sendYaySms({ to, body }: YaySendSmsInput): Promise<YaySendSmsResult> {
  const apiKey = process.env.YAY_API_KEY;
  const senderId = process.env.YAY_SENDER_ID;

  if (!apiKey || !senderId) {
    throw new Error('Yay.com SMS is not configured. Set YAY_API_KEY and YAY_SENDER_ID.');
  }

  const endpoint = process.env.YAY_SMS_ENDPOINT ?? 'https://api.yay.com/sms/send';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: senderId,
      to,
      message: body
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Yay.com rejected the SMS request.');
  }

  return {
    messageId: payload?.id ?? payload?.message_id ?? null,
    deliveryStatus: payload?.status ?? 'sent'
  };
}
