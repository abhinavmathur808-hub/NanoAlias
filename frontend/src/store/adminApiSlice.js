import { apiSlice } from "./apiSlice";

export const adminApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSystemUsers: builder.query({
            query: () => "/admin/users",
            providesTags: ["User"],
        }),
        getSystemUrls: builder.query({
            query: () => "/admin/urls",
            providesTags: ["Url"],
        }),
        toggleSystemUrlStatus: builder.mutation({
            query: (id) => ({
                url: `/admin/urls/${id}/status`,
                method: "PATCH",
            }),
            invalidatesTags: ["Url"],
        }),
    }),
});

export const {
    useGetSystemUsersQuery,
    useGetSystemUrlsQuery,
    useToggleSystemUrlStatusMutation,
} = adminApi;
