import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get('amount'); // Amount in ETH

  if (!amount) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY;

  if (!CMC_API_KEY) {
    return NextResponse.json({ error: 'CoinMarketCap API key is missing' }, { status: 500 });
  }

  try {
    const url = new URL('https://pro-api.coinmarketcap.com/v2/tools/price-conversion');
    url.searchParams.append('amount', amount);
    url.searchParams.append('symbol', 'ETH');
    url.searchParams.append('convert', 'ZAR');

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const zarAmount = data.data[0].quote.ZAR.price;

    return NextResponse.json({ zarAmount });
  } catch (error) {
    console.error('Error fetching conversion:', error);
    return NextResponse.json({ error: 'Failed to fetch conversion' }, { status: 500 });
  }
}