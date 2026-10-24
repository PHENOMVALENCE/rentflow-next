export type PaymentInitiation = {
  providerReference: string;
  providerStatus: string;
  rawResponseReference: string;
};

export type ProviderEvent = {
  internalReference: string;
  providerReference: string;
  receivedAmount: number;
  currency: string;
  providerStatus: string;
  eventId: string | null;
  controlNumber: string | null;
};

export type PaymentObligationInput = {
  internalReference: string;
  amount: number;
  currency: "TZS";
  tenantName: string;
  tenantEmail: string;
};

export interface PaymentGateway {
  readonly code: string;
  initiatePayment(input: PaymentObligationInput, payerPhone: string): Promise<PaymentInitiation>;
  verifyWebhook(rawBody: string, signature: string | null, timestamp: string | null): boolean;
  paymentEvent(rawBody: string): ProviderEvent | null;
}

export class PaymentProviderError extends Error {}
export class PaymentConfigurationError extends PaymentProviderError {}
export class PaymentNotPayableError extends PaymentProviderError {}
