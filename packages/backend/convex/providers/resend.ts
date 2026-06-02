// Resend webhooks are Svix-signed. See svixBase for the scheme.

import { createSvixAdapter } from './svixBase';

export const resendAdapter = createSvixAdapter('resend');
