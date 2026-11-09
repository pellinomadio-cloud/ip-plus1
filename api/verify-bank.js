// Vercel Serverless Function (ES Module): /api/verify-bank
// Handles Nigerian Bank account verification and resolves CORS issues on Vercel.

import https from 'node:https';

export default async function handler(req, res) {
  // Set CORS headers for all incoming requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle browser CORS preflight
  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.statusCode = 200;
    return res.end();
  }

  // Parse parameters from POST body or GET query
  let bankCode = '';
  let accountNumber = '';

  // 1. Try body object (if parsed by Vercel / Express body-parser)
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    bankCode = req.body.bank_code || req.body.bankCode || '';
    accountNumber = req.body.account_number || req.body.accountNumber || '';
  }

  // 2. Try raw string body (URL-encoded or JSON)
  if (!bankCode || !accountNumber) {
    if (typeof req.body === 'string') {
      try {
        const json = JSON.parse(req.body);
        bankCode = json.bank_code || json.bankCode || '';
        accountNumber = json.account_number || json.accountNumber || '';
      } catch {
        const params = new URLSearchParams(req.body);
        bankCode = params.get('bank_code') || params.get('bankCode') || '';
        accountNumber = params.get('account_number') || params.get('accountNumber') || '';
      }
    }
  }

  // 3. If body was not parsed, buffer incoming stream
  if (!bankCode || !accountNumber) {
    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      if (rawBody) {
        try {
          const json = JSON.parse(rawBody);
          bankCode = json.bank_code || json.bankCode || '';
          accountNumber = json.account_number || json.accountNumber || '';
        } catch {
          const params = new URLSearchParams(rawBody);
          bankCode = params.get('bank_code') || params.get('bankCode') || '';
          accountNumber = params.get('account_number') || params.get('accountNumber') || '';
        }
      }
    }
  }

  // 4. Fallback to query params
  if (!bankCode || !accountNumber) {
    if (req.query) {
      bankCode = req.query.bank_code || req.query.bankCode || '';
      accountNumber = req.query.account_number || req.query.accountNumber || '';
    }
  }

  bankCode = (bankCode || '').trim();
  accountNumber = (accountNumber || '').replace(/\D/g, '').trim();

  if (!bankCode || !accountNumber) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    if (typeof res.status === 'function') {
      return res.status(400).send('Error: Missing bank code or account number');
    }
    res.statusCode = 400;
    return res.end('Error: Missing bank code or account number');
  }

  // Forward request server-side to remote verification API
  const postData = new URLSearchParams({
    bank_code: bankCode,
    account_number: accountNumber
  }).toString();

  try {
    const apiResult = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.wtproject.space',
        port: 443,
        path: '/vrf/verify.php',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      };

      const remoteReq = https.request(options, (remoteRes) => {
        let responseBody = '';
        remoteRes.setEncoding('utf8');
        remoteRes.on('data', (chunk) => {
          responseBody += chunk;
        });
        remoteRes.on('end', () => {
          resolve({
            statusCode: remoteRes.statusCode || 200,
            body: responseBody.trim()
          });
        });
      });

      remoteReq.on('timeout', () => {
        remoteReq.destroy();
        reject(new Error('Verification server timed out'));
      });

      remoteReq.on('error', (err) => {
        reject(err);
      });

      remoteReq.write(postData);
      remoteReq.end();
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    if (typeof res.status === 'function') {
      return res.status(apiResult.statusCode).send(apiResult.body);
    }
    res.statusCode = apiResult.statusCode;
    return res.end(apiResult.body);
  } catch (err) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const msg = 'Error: ' + (err.message || 'Verification service unreachable');
    if (typeof res.status === 'function') {
      return res.status(502).send(msg);
    }
    res.statusCode = 502;
    return res.end(msg);
  }
}
