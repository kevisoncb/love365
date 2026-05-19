import { Resend } from 'resend';

// Use apenas process.env sem condicionais que travam o código
export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;