export class DocumentStore {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const data = (await this.state.storage.get("data")) || { text: "", summary: "", history: [] };

    if (url.pathname.endsWith("/init")) {
      const { text, summary } = await request.json();
      await this.state.storage.put("data", { text, summary, history: [] });
      return new Response("ok");
    }

    if (url.pathname.endsWith("/get")) {
      return new Response(JSON.stringify(data));
    }

    if (url.pathname.endsWith("/update")) {
      const { q, a } = await request.json();
      data.history.push(`Q: ${q}\nA: ${a}`);
      await this.state.storage.put("data", data);
      return new Response("ok");
    }

    return new Response("invalid", { status: 400 });
  }
}