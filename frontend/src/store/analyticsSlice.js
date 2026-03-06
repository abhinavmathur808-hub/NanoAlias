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
    }),
});

export const { useGetDashboardStatsQuery, useGetUrlAnalyticsQuery, useGetAnalyticsQuery } = analyticsApi;
