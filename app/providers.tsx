"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                {children}
            </LanguageProvider>
        </QueryClientProvider>
    );
}
