
export class AutomationService {
  constructor(private webhookBase?: string) {}

  async emit(event: string, data: unknown): Promise<void> {
    if (!this.webhookBase) return;
    const url = `${this.webhookBase.replace(/\/$/, '')}/${event.replace(/\./g, '-')}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event, occurredAt: new Date().toISOString(), data }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) console.warn(`n8n responded ${res.status} for ${event} (${url})`);
    } catch (e) {
      console.warn(`Failed to send ${event} to n8n: ${(e as Error).message}`);
    }
  }
}
