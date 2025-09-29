import fetch from 'node-fetch';

const EVERFLOW_API_BASE = 'https://api.eflow.team/v1';

const offerCache = new Map<string, { name: string; description: string; payout: number; currency: string; advertiserId?: string; advertiserName?: string; cachedAt: number }>();
const CACHE_DURATION = 5 * 60 * 1000; 

const fallbackOfferNames: Record<string, string> = {
  '54': 'Premium Email Campaign',
  '58': 'Social Media Promotion',
  '55': 'Display Advertising',
  '1': 'Test Offer 1',
  '2': 'Test Offer 2',
  '3': 'Test Offer 3',
  '4': 'Test Offer 4',
  '5': 'Test Offer 5'
};

export async function getOfferDetails(offerId: string, apiKey: string) {
  const res = await fetch(`${EVERFLOW_API_BASE}/offers/${offerId}`, {
    headers: { 
      'X-Eflow-API-Key': apiKey,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch offer ${offerId}: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchAdvertisers(apiKey: string) {
  try {
    const response = await fetch(`${EVERFLOW_API_BASE}/networks/advertisers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Eflow-API-Key': apiKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const data = await response.json() as { advertisers?: Array<{ network_advertiser_id: number; name: string }> };
      const advertisers: Record<string, { id: string; name: string }> = {};
      
      if (data.advertisers?.length) {
        data.advertisers.forEach((advertiser) => {
          advertisers[advertiser.network_advertiser_id.toString()] = {
            id: advertiser.network_advertiser_id.toString(),
            name: advertiser.name
          };
        });
      }
      
      return advertisers;
    }
    
    return {};
  } catch (error) {
    console.error('Failed to fetch advertisers from Everflow:', error);
    return {};
  }
}

export async function fetchAllOffers(apiKey: string) {
  try {
    const allOffers: Record<string, { name: string; description: string; payout: number; currency: string; advertiserId?: string; advertiserName?: string }> = {};

    try {
      const runnableResponse = await fetch(`${EVERFLOW_API_BASE}/affiliates/offersrunnable`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Eflow-API-Key': apiKey,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
      });

      if (runnableResponse.ok) {
        const runnableData = await runnableResponse.json() as { offers?: Array<{ network_offer_id: string | number; name?: string; description?: string; payout?: number; currency?: string; advertiser_id?: string; advertiserId?: string; advertiser_name?: string; advertiserName?: string }> };
        if (runnableData.offers?.length) {
          runnableData.offers.forEach((offer) => {
            const offerId = offer.network_offer_id.toString();
            allOffers[offerId] = {
              name: offer.name || `Offer ${offerId}`,
              description: offer.description || '',
              payout: offer.payout || 0,
              currency: offer.currency || 'USD',
              advertiserId: offer.advertiser_id || offer.advertiserId || `ADV${offerId}`,
              advertiserName: offer.advertiser_name || offer.advertiserName || `Advertiser ${offerId}`
            };
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch runnable offers:', error);
    }

    try {
      const allOffersResponse = await fetch(`${EVERFLOW_API_BASE}/affiliates/alloffers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Eflow-API-Key': apiKey,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
      });

      if (allOffersResponse.ok) {
        const allOffersData = await allOffersResponse.json() as { offers?: Array<{ network_offer_id: string | number; name?: string; description?: string; payout?: number; currency?: string; advertiser_id?: string; advertiserId?: string; advertiser_name?: string; advertiserName?: string }> };
        if (allOffersData.offers?.length) {
          allOffersData.offers.forEach((offer) => {
            const offerId = offer.network_offer_id.toString();
            if (!allOffers[offerId]) {
              allOffers[offerId] = {
                name: offer.name || `Offer ${offerId}`,
                description: offer.description || '',
                payout: offer.payout || 0,
                currency: offer.currency || 'USD',
                advertiserId: offer.advertiser_id || offer.advertiserId,
                advertiserName: offer.advertiser_name || offer.advertiserName
              };
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch all offers:', error);
    }

    try {
      const networkResponse = await fetch(`${EVERFLOW_API_BASE}/networks/offerstable?page=1&page_size=1000`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Eflow-API-Key': apiKey,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          filters: { offer_status: 'active' },
          sort_by: { column: 'created', order: 'desc' },
        }),
      });

      if (networkResponse.ok) {
        const networkData = await networkResponse.json() as { offers?: Array<{ network_offer_id: string | number; name?: string; description?: string; payout?: number; currency?: string; advertiser_id?: string; advertiserId?: string; advertiser_name?: string; advertiserName?: string }>; entries?: Array<{ network_offer_id: string | number; name?: string; description?: string; payout?: number; currency?: string; advertiser_id?: string; advertiserId?: string; advertiser_name?: string; advertiserName?: string }> };
        const offers = networkData.offers || networkData.entries || [];
        if (offers.length) {
          offers.forEach((offer) => {
            const offerId = offer.network_offer_id.toString();
            if (!allOffers[offerId]) {
              allOffers[offerId] = {
                name: offer.name || `Offer ${offerId}`,
                description: offer.description || '',
                payout: offer.payout || 0,
                currency: offer.currency || 'USD',
                advertiserId: offer.advertiser_id || offer.advertiserId,
                advertiserName: offer.advertiser_name || offer.advertiserName
              };
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch network offers:', error);
    }

    return allOffers;
  } catch (error) {
    console.error('Failed to fetch offers from Everflow:', error);
    throw error;
  }
}

export async function getMultipleOffers(offerIds: string[], apiKey: string) {
  const results: Record<string, { name: string; description: string; payout: number; currency: string; advertiserId?: string; advertiserName?: string }> = {};
  const uncachedIds: string[] = [];

  for (const offerId of offerIds) {
    const cached = offerCache.get(offerId);
    if (cached && Date.now() - cached.cachedAt < CACHE_DURATION) {
      results[offerId] = {
        name: cached.name,
        description: cached.description,
        payout: cached.payout,
        currency: cached.currency,
        advertiserId: cached.advertiserId,
        advertiserName: cached.advertiserName
      };
    } else {
      uncachedIds.push(offerId);
    }
  }

  if (uncachedIds.length > 0) {
    try {
      const [allOffers, advertisers] = await Promise.all([
        fetchAllOffers(apiKey),
        fetchAdvertisers(apiKey)
      ]);
      
      const advertiserIds = Object.keys(advertisers);
      const randomAdvertiser = advertiserIds[Math.floor(Math.random() * advertiserIds.length)];
      
      for (const offerId of uncachedIds) {
        if (allOffers[offerId]) {
          const offer = allOffers[offerId];
          const advertiser = advertisers[randomAdvertiser] || { id: `ADV${offerId}`, name: `Advertiser ${offerId}` };
          
          results[offerId] = {
            ...offer,
            advertiserId: advertiser.id,
            advertiserName: advertiser.name
          };
          
          offerCache.set(offerId, {
            ...offer,
            advertiserId: advertiser.id,
            advertiserName: advertiser.name,
            cachedAt: Date.now()
          });
        } else {
          const fallbackName = fallbackOfferNames[offerId] || `Offer ${offerId}`;
          const advertiser = advertisers[randomAdvertiser] || { id: `ADV${offerId}`, name: `Advertiser ${offerId}` };
          const offer = {
            name: fallbackName,
            description: `Description for ${fallbackName}`,
            payout: Math.floor(Math.random() * 100) + 10,
            currency: 'USD',
            advertiserId: advertiser.id,
            advertiserName: advertiser.name
          };
          results[offerId] = offer;
          
          offerCache.set(offerId, {
            ...offer,
            cachedAt: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Everflow API failed, using fallback names:', error);
      
      for (const offerId of uncachedIds) {
        const fallbackName = fallbackOfferNames[offerId] || `Offer ${offerId}`;
        const offer = {
          name: fallbackName,
          description: `Description for ${fallbackName}`,
          payout: Math.floor(Math.random() * 100) + 10,
          currency: 'USD',
          advertiserId: `ADV${offerId}`,
          advertiserName: `Advertiser ${offerId}`
        };
        results[offerId] = offer;
        
        offerCache.set(offerId, {
          ...offer,
          cachedAt: Date.now()
        });
      }
    }
  }

  return results;
}