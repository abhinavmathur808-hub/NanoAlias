import { apiSlice } from "./apiSlice";

export const urlApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createUrl: builder.mutation({
            query: (body) => ({ url: "/urls", method: "POST", body }),
            invalidatesTags: ["Url"],
        }),
        getMyUrls: builder.query({
            query: () => "/urls/my",
            providesTags: ["Url"],
        }),
        updateUrl: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/urls/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Url"],
        }),
        deleteUrl: builder.mutation({
            query: (id) => ({ url: `/urls/${id}`, method: "DELETE" }),
            invalidatesTags: ["Url"],
        }),
    }),
});

export const {
    useCreateUrlMutation,
    useGetMyUrlsQuery,
    useUpdateUrlMutation,
    useDeleteUrlMutation,
} = urlApi;
