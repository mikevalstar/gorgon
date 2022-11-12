

// file concerts.ts
import Gorgon from '@mikevalstar/gorgon';

const concertsGet = async (artist: string) => {
  return Gorgon.get(`concerts/${artist}`, async ():Promise<Array<any>> => {
    return fetch(`https://example.com/concerts/${artist}`)
      .then(r => r.json());
  }, 1000 * 60 * 60) // 1 hour
};

const concertsAdd = async (artist: string, concerts: any[]) => {
  const concertDetails = await concertsGet(artist);
  concertDetails.push(...concerts);

  await fetch(`https://example.com/concerts/${artist}`, {
    method: 'POST',
    body: JSON.stringify(concertDetails),
  });

  Gorgon.clear(`concerts/${artist}`);
}

const concertsInvalidate = async (artist?: string) => {
  if (artist) {
    Gorgon.clear(`concerts/${artist}`);
  } else {
    Gorgon.clear(`concerts/*`);
  }
};

export { concertsGet, concertsAdd, concertsInvalidate };
