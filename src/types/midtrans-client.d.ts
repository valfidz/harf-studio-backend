// declare module 'midtrans-client' {
//     const midtransClient: any;
//     export = midtransClient;
//   }

export interface MidtransConfig {
    serverKey: string;
    clientKey: string;
    isProduction: boolean;
    merchantId: string;
  }
  
  export interface CardDetails {
    card_number: string;
    card_exp_month: string;
    card_exp_year: string;
    card_cvv: string;
  }
  
  export interface CustomerDetails {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  }

  export interface SnapTransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface SnapRequest {
    transaction_details: SnapTransactionDetails;
    credit_card?: {
      secure?: boolean;
      save_card?: boolean;
      authentication?: boolean;
    };
    customer_details?: CustomerDetails;
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }>;
    callbacks?: {
      finish?: string;
    };
    user_id: string;
    recurring?: {
      required: boolean;
      start_time: string;
      interval_unit: string;
      max_interval?: number;
    }
  }
  
  export interface SubscriptionRequest {
    name: string;
    amount: string;
    currency: string;
    payment_type: string;
    token: string;
    schedule: {
      interval: number;
      interval_unit: string;
      max_interval?: number;
      start_time: string;
    };
    retry_schedule?: {
      interval: number;
      interval_unit: string;
      max_interval?: number;
    };
    customer_details: CustomerDetails;
    metadata?: Record<string, any>;
  }