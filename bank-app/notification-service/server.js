const express = require('express');
const cors = require('cors');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || 'kongalaraghu406@gmail.com';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

const sesClient = new SESClient({ region: AWS_REGION });

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'bank-notification-service' }));

app.post('/api/notifications/transaction', async (req, res) => {
  try {
    const { fromAccount, toAccount, amount, transactionId } = req.body;

    const command = new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: { ToAddresses: [SES_FROM_EMAIL] },
      Message: {
        Subject: { Data: `Bank Transfer Alert - ₹${amount}` },
        Body: {
          Html: {
            Data: `
              <h2>Transaction Alert</h2>
              <p>A transfer of <strong>₹${amount}</strong> has been processed.</p>
              <p>From: ${fromAccount}</p>
              <p>To: ${toAccount}</p>
              <p>Transaction ID: ${transactionId}</p>
            `
          }
        }
      }
    });

    await sesClient.send(command);
    res.json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Notification error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Bank notification service running on port ${PORT}`));
