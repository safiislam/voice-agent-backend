import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { TavilySearch } from "@langchain/tavily";
import { config } from "../config/config.js";



const search = new TavilySearch({
    maxResults: 5,
    topic: "general",
    tavilyApiKey: config.TRAVILY_API_KEY
});

export const tavilySearchTool = tool(
    async ({ query }) => {
        const response = search.invoke({
            query
        })
        return response
    },
    {
        name: "tavily_internet_search",

        description:
            "Search the internet using Tavily to retrieve up-to-date information, news, travel details, general knowledge, businesses, locations, and factual data from reliable web sources.",

        schema: z.object({
            query: z
                .string()
                .describe(
                    "A clear and specific internet search query describing the information needed. Examples: 'best tourist places in Cox's Bazar', 'latest AI news 2026', 'top hotels in Dubai', 'history of artificial intelligence'."
                ),
        }),
    }
);