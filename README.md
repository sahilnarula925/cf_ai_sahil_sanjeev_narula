# AI Document Summarizer & Q&A

An AI-powered web application that uses Cloudflare Workers to summarize documents and answer questions about them. Users can paste any document text, receive an AI-generated summary, and ask follow-up questions that are answered based on the document content with conversation history.

## Access the Application

**Deployed Application:** https://cf_ai_sahil_sanjeev_narula.sahilsnarula.workers.dev

## Architecture Components

- **LLM**: Uses Llama 3-8b-instruct model via Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`)
- **Workflow/Coordination**: Implemented using Cloudflare Workers for API endpoints and Durable Objects for document state management
- **User Input**: Web interface built with Cloudflare Pages for text-based document input and Q&A chat interface
- **Memory/State**: Persistent state management via Durable Objects that store document text, summaries, and conversation history

## How It Works

1. Users paste a document into the web interface
2. The document is sent to a Cloudflare Worker which uses Workers AI to generate a summary
3. The document and summary are stored in a Durable Object with a unique ID
4. Users can ask questions about the document, which are answered using the stored summary and conversation history
5. All Q&A interactions are persisted in the Durable Object for context-aware responses