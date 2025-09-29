import fetch from 'node-fetch';

const EVERFLOW_API_BASE = 'https://api.eflow.team/v1';

export async function getOfferDetails(offerId: string, apiKey: string) {
  const res = await fetch(`${EVERFLOW_API_BASE}/offers/${offerId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch offer ${offerId}: ${res.statusText}`);
  }
  return await res.json();
}

export async function getMultipleOffers(offerIds: string[], apiKey: string) {
  const results: Record<string, { name?: string; description?: string; payout?: number; currency?: string }> = {};
  
  await Promise.all(
    offerIds.map(async (offerId) => {
      try {
        const offer = await getOfferDetails(offerId, apiKey) as { data: { name?: string; description?: string; payout?: number; currency?: string } };
        results[offerId] = offer.data;
      } catch (error) {
        console.error(`Failed to fetch offer ${offerId}:`, error);
        results[offerId] = { name: `Offer ${offerId}`, description: 'Unknown Offer' };
      }
    })
  );
  
  return results;
}
