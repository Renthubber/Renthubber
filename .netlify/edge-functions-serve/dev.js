import { boot } from "https://v2-17-1--edge.netlify.com/bootstrap/index-combined.ts";

const functions = {}; const metadata = { functions: {} };


      try {
        const { default: func } = await import("file:///E:/2025%20RENTHUBBER/Renthubber_dopo_url/netlify/edge-functions/og-preview.ts");

        if (typeof func === "function") {
          functions["og-preview"] = func;
          metadata.functions["og-preview"] = {"url":"file:///E:/2025%20RENTHUBBER/Renthubber_dopo_url/netlify/edge-functions/og-preview.ts"}
        } else {
          console.log("\u001b[91m⬥\u001b[39m \u001b[31mFailed\u001b[39m to load Edge Function \u001b[33mog-preview\u001b[39m. The file does not seem to have a function as the default export.");
        }
      } catch (error) {
        console.log("\u001b[91m⬥\u001b[39m \u001b[31mFailed\u001b[39m to run Edge Function \u001b[33mog-preview\u001b[39m:");
        console.error(error);
      }
      

boot(() => Promise.resolve(functions));