import BitPaySDK from "bitpay-sdk";

export function getBitPayClient() {
  const token = process.env.BITPAY_TOKEN ?? "";
  // Placeholder client creation; configure as needed
  return new (BitPaySDK as any)(token);
}


