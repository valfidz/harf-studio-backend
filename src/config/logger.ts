import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = 'logs';
const date = new Date();
const dateFormat = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Create custom loggers for different functions
const createCustomLogger = (filename: string) => {
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({
                filename: path.join(logDir, `${filename}${dateFormat}.log`)
            }),
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ],
        exitOnError: false
    })
}

// Create specific loggers
export const paymentNotificationLogger = createCustomLogger('paymentNotification');
export const subscriptionNotificationLogger = createCustomLogger('subscriptionNotification');
export const snapTokenLogger = createCustomLogger('snapToken');
export const subscriptionLogger = createCustomLogger('subscription');

// Default logger for general use
const defaultLogger = createCustomLogger('midtrans');

export default defaultLogger;

// const logger = winston.createLogger({
//     level: 'info',
//     format: winston.format.combine(
//         winston.format.timestamp({
//             format: 'YYYY-MM-DD HH:mm:ss'
//         }),
//         winston.format.json()
//     ),
//     transports: [
//         // Write all logs to separate files
//         new winston.transports.File({
//             filename: path.join(logDir, 'error.log'),
//             level: 'error'
//         }),
//         new winston.transports.File({
//             filename: path.join(logDir, 'combined.log')
//         }),
//         // Console logging for development
//         new winston.transports.Console({
//             format: winston.format.combine(
//                 winston.format.colorize(),
//                 winston.format.simple()
//             )
//         })
//     ],
//     exitOnError: false
// });

// // Add error handling for file writing
// logger.transports.forEach((transport) => {
//     if (transport instanceof winston.transports.File) {
//         transport.on('error', (error) => {
//             console.error('Error writing to log file:', error);
//         })
//     }
// });

