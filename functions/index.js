import { Ai } from "cloudflare:ai";
import { DocumentStore } from "./documentStore";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ai = new Ai(env.AI);

    if (url.pathname === "/api/upload" && request.method === "POST") {
      try {
        const { text } = await request.json();
        if (!text) {
          return new Response(JSON.stringify({ error: "Text is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const id = env.DOCUMENT_STORE.newUniqueId();
        const idString = id.toString();
        const docStore = env.DOCUMENT_STORE.get(id);

        const aiResponse = await ai.run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            { role: "system", content: "You are a helpful assistant that summarizes documents clearly and concisely." },
            { role: "user", content: `Summarize the following document clearly and concisely:\n\n${text}` }
          ]
        });

        const summary = typeof aiResponse === "string" 
          ? aiResponse 
          : aiResponse?.response || aiResponse?.description || aiResponse?.text || JSON.stringify(aiResponse);

        await docStore.fetch("https://store/init", {
          method: "POST",
          body: JSON.stringify({ text, summary })
        });

        return new Response(JSON.stringify({ id: idString, summary }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    if (url.pathname === "/api/query" && request.method === "POST") {
      try {
        const { id: idString, question } = await request.json();
        if (!idString || !question) {
          return new Response(JSON.stringify({ error: "ID and question are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const id = env.DOCUMENT_STORE.idFromString(idString);
        const docStore = env.DOCUMENT_STORE.get(id);
        const storeResponse = await docStore.fetch("https://store/get");
        const { text, summary, history } = await storeResponse.json();

        if (!summary) {
          return new Response(JSON.stringify({ error: "Document not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }

        const aiResponse = await ai.run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            { 
              role: "system", 
              content: "You are a helpful AI assistant. Use only the document provided to answer questions. Do not make up information." 
            },
            {
              role: "user",
              content: `Document Summary: ${summary}\n\nUser Question: ${question}\n\n${history.length > 0 ? `Conversation History:\n${history.join("\n")}` : ""}\n\nAnswer the user's question accurately based only on the document above.`
            }
          ]
        });

        const answer = typeof aiResponse === "string" 
          ? aiResponse 
          : aiResponse?.response || aiResponse?.description || aiResponse?.text || JSON.stringify(aiResponse);

        await docStore.fetch("https://store/update", {
          method: "POST",
          body: JSON.stringify({ q: question, a: answer })
        });

        return new Response(JSON.stringify({ answer }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};

export { DocumentStore };