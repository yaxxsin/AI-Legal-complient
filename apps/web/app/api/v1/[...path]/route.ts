import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy Route
 * 
 * Proxies all /api/v1/* requests to internal NestJS backend.
 * This allows frontend to run on single port (3000) while backend
 * remains internal-only in Docker network.
 * 
 * Benefits:
 * - No CORS issues (same-origin)
 * - No cookie SameSite issues
 * - Single port exposure (3000)
 * - Backend stays internal
 */

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://api:3002/api/v1';

async function proxyRequest(request: NextRequest, method: string) {
  try {
    // Extract path segments
    const { searchParams } = new URL(request.url);
    const pathSegments = request.nextUrl.pathname.replace('/api/v1/', '');
    
    // Build target URL
    const queryString = searchParams.toString();
    const targetUrl = `${INTERNAL_API_URL}/${pathSegments}${queryString ? `?${queryString}` : ''}`;

    // Forward headers (exclude host, connection)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Forward cookies
    const cookies = request.cookies.getAll();
    if (cookies.length > 0) {
      headers.set('cookie', cookies.map(c => `${c.name}=${c.value}`).join('; '));
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        options.body = JSON.stringify(await request.json());
      } else if (contentType?.includes('multipart/form-data')) {
        options.body = await request.formData();
      } else {
        options.body = await request.text();
      }
    }

    // Make request to backend
    const response = await fetch(targetUrl, options);

    // Forward response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // Get response body
    const contentType = response.headers.get('content-type');
    let body;
    
    if (contentType?.includes('application/json')) {
      body = await response.json();
    } else if (contentType?.includes('text/')) {
      body = await response.text();
    } else {
      body = await response.arrayBuffer();
    }

    // Create response with same status
    const nextResponse = new NextResponse(
      typeof body === 'string' || body instanceof ArrayBuffer ? body : JSON.stringify(body),
      {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      }
    );

    // Forward Set-Cookie headers
    const setCookies = response.headers.getSetCookie?.() || [];
    setCookies.forEach(cookie => {
      nextResponse.headers.append('set-cookie', cookie);
    });

    return nextResponse;

  } catch (error) {
    console.error('[API Proxy Error]', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal proxy error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request, 'OPTIONS');
}
