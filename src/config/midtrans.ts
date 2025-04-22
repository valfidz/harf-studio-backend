// import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';
import { MidtransConfig } from '../types/midtrans-client';

dotenv.config();

// export const snap = new midtransClient.Snap({
//     isProduction: false,
//     serverKey: process.env.MIDTRANS_SERVER_KEY || '',
//     clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
//   });
  
//   export const coreApi = new midtransClient.CoreApi({
//     isProduction: false,
//     serverKey: process.env.MIDTRANS_SERVER_KEY || '',
//     clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
//   });

const midtransConfig: MidtransConfig = {
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    merchantId: process.env.MIDTRANS_MERCHANT_ID || '',
    isProduction: process.env.NODE_ENV === 'production',
}

export default midtransConfig