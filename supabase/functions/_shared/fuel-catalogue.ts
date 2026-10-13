// A partial cold-start fallback must not replace the richer retained catalogue.
export async function loadFuelCatalogue<Primary, Fallback>(
  previous: { source?: string } | undefined,
  primary: () => Promise<Primary>,
  fallback: () => Promise<Fallback>,
): Promise<Primary | Fallback> {
  try { return await primary(); }
  catch (error) {
    if (previous?.source === 'priceshub') throw error;
    return await fallback();
  }
}
