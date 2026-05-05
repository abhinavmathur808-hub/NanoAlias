import { apiSlice } from "./apiSlice";

export const urlApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createUrl: builder.mutation({
            query: (body) => ({ url: "/urls", method: "POST", body }),
            invalidatesTags: ["Url"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data: result } = await queryFulfilled;
                    dispatch(
                        urlApi.util.updateQueryData("getMyUrls", undefined, (draft) => {
                            if (result?.data) draft.data.unshift(result.data);
                        })
                    );
                } catch { /* cache update skipped on failure */ }
            },
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
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                const patch = dispatch(
                    urlApi.util.updateQueryData("getMyUrls", undefined, (draft) => {
                        draft.data = draft.data.filter((u) => u._id !== id);
                    })
                );
                try { await queryFulfilled; } catch { patch.undo(); }
            },
        }),
    }),
});

export const {
    useCreateUrlMutation,
    useGetMyUrlsQuery,
    useUpdateUrlMutation,
    useDeleteUrlMutation,
} = urlApi;
