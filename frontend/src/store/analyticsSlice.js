import { apiSlice } from "./apiSlice";

export const analyticsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardStats: builder.query({
            query: () => "/analytics/dashboard",
            providesTags: ["Analytics"],
        }),
        getUrlAnalytics: builder.query({
            query: (id) => `/analytics/${id}`,
            providesTags: ["Analytics"],
        }),
        getAnalytics: builder.query({
            query: (urlId) => `/analytics/${urlId}`,
            providesTags: ["Analytics"],
        }),
        askAnalytics: builder.mutation({
            query: ({ id, question }) => ({
                url: `/analytics/${id}/ask`,
                method: "POST",
                body: { question },
            }),
        }),
    }),
});

export const {
    useGetDashboardStatsQuery,
    useGetUrlAnalyticsQuery,
    useGetAnalyticsQuery,
    useAskAnalyticsMutation,
} = analyticsApi;
