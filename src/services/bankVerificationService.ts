/**
 * Nigerian Bank Account Verification Service
 * Endpoint: https://api.wtproject.space/vrf/verify.php
 * Method: POST
 * Content-Type: application/x-www-form-urlencoded
 * Parameters: bank_code, account_number
 */

export interface BankVerificationResult {
  success: boolean;
  accountName?: string;
  errorMessage?: string;
  rawResponse?: string;
  cached?: boolean;
}

// In-memory cache to prevent redundant network requests for identical bank_code + account_number
const verificationCache = new Map<string, BankVerificationResult>();

// Track currently active verification key and controller to cancel previous/duplicate requests
let activeAbortController: AbortController | null = null;
let activeRequestKey: string | null = null;

export async function verifyBankAccount(
  bankCode: string,
  accountNumber: string
): Promise<BankVerificationResult> {
  const cleanBankCode = bankCode.trim();
  const cleanAccountNumber = accountNumber.replace(/\D/g, '').trim();

  // Validate parameters before sending
  if (!cleanBankCode || !cleanAccountNumber) {
    return {
      success: false,
      errorMessage: 'Error: Missing bank code or account number'
    };
  }

  if (cleanAccountNumber.length !== 10) {
    return {
      success: false,
      errorMessage: 'Account number must be exactly 10 digits'
    };
  }

  const cacheKey = `${cleanBankCode}:${cleanAccountNumber}`;

  // Return cached result if already resolved
  if (verificationCache.has(cacheKey)) {
    return {
      ...verificationCache.get(cacheKey)!,
      cached: true
    };
  }

  // Cancel prior in-flight verification request to prevent race conditions & duplicate loads
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  activeAbortController = new AbortController();
  activeRequestKey = cacheKey;

  const bodyParams = new URLSearchParams();
  bodyParams.append('bank_code', cleanBankCode);
  bodyParams.append('account_number', cleanAccountNumber);

  // Candidate endpoints in order of reliability:
  // 1. Vercel Serverless Function (/api/verify-bank) or Vite dev middleware
  // 2. Vercel Serverless Function alias (/api/verify)
  // 3. Vercel external proxy rewrite (/api/proxy-verify)
  // 4. Direct endpoint (https://api.wtproject.space/vrf/verify.php)
  const candidateEndpoints = [
    '/api/verify-bank',
    '/api/verify',
    '/api/proxy-verify',
    'https://api.wtproject.space/vrf/verify.php'
  ];

  let result: BankVerificationResult | null = null;
  let lastError = '';

  for (const endpoint of candidateEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString(),
        signal: activeAbortController.signal
      });

      // If endpoint not found or server error (e.g. 404 on static host), try next candidate
      if (!response.ok && response.status === 404) {
        lastError = `Endpoint ${endpoint} returned 404`;
        continue;
      }

      const rawText = (await response.text()).trim();

      // If returned text is HTML (e.g. Vercel 404/SPA index.html fallback), this endpoint didn't handle the request
      if (rawText.includes('<html') || rawText.includes('<!DOCTYPE') || rawText.includes('404: NOT_FOUND')) {
        lastError = `Endpoint ${endpoint} returned HTML instead of API response`;
        continue;
      }

      // Check if API returned an official error response
      const isError =
        rawText.toLowerCase().startsWith('error:') ||
        rawText.toLowerCase().includes('invalid account') ||
        rawText.toLowerCase().includes('missing bank code') ||
        rawText.toLowerCase().includes('invalid request');

      if (isError) {
        result = {
          success: false,
          errorMessage: rawText || 'Error: Invalid Account',
          rawResponse: rawText
        };
        break;
      }

      // Valid account name returned (e.g., "John Doe")
      if (rawText.length > 0) {
        result = {
          success: true,
          accountName: rawText,
          rawResponse: rawText
        };
        break;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was aborted due to duplicate / newer request
        return {
          success: false,
          errorMessage: 'Verification cancelled'
        };
      }
      lastError = err.message || 'Network error';
      // Attempt next candidate endpoint
    }
  }

  if (!result) {
    result = {
      success: false,
      errorMessage: lastError ? `Error: ${lastError}` : 'Error: Verification service unreachable'
    };
  }

  // Cache successful verification results
  if (result.success) {
    verificationCache.set(cacheKey, result);
  }

  if (activeRequestKey === cacheKey) {
    activeAbortController = null;
    activeRequestKey = null;
  }

  return result;
}

export function clearVerificationCache(): void {
  verificationCache.clear();
}
