
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

// DEBUG LOGS
console.log('--- SQS Service Initialized ---');
console.log('Region:', process.env.AWS_REGION || 'us-east-1 (DEFAULT)');
console.log('Queue URL:', QUEUE_URL);
console.log('-------------------------------');

export const sendMessageToQueue = async (body) => {
    try {
        const command = new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify(body),
        });
        const response = await sqsClient.send(command);
        console.log("Message sent to SQS:", response.MessageId);
        return response.MessageId;
    } catch (error) {
        console.error("Error sending message to SQS:", error);
        throw error;
    }
};

export const receiveMessagesFromQueue = async () => {
    try {
        // console.log(`Polling SQS (${QUEUE_URL})...`);
        const command = new ReceiveMessageCommand({
            QueueUrl: QUEUE_URL,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
            VisibilityTimeout: 300
        });
        const response = await sqsClient.send(command);
        if (response.Messages?.length) {
            console.log(`📦 Received ${response.Messages.length} messages.`);
        }
        return response.Messages || [];
    } catch (error) {
        console.error("Error receiving messages from SQS:", error);
        return [];
    }
};

export const deleteMessageFromQueue = async (receiptHandle) => {
    try {
        const command = new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: receiptHandle,
        });
        await sqsClient.send(command);
        console.log("Message deleted from SQS");
    } catch (error) {
        console.error("Error deleting message from SQS:", error);
    }
};
