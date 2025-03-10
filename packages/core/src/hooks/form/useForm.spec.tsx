import React from "react";
import { renderHook, waitFor } from "@testing-library/react";

import {
    MockJSONServer,
    TestWrapper,
    act,
    mockLegacyRouterProvider,
} from "@test";

import {
    assertList,
    assertOne,
    renderUseList,
    renderUseMany,
    renderUseOne,
} from "@test/mutation-helpers";

import { useForm } from "./useForm";

import { posts } from "@test/dataMocks";
import { mockRouterBindings } from "@test";

const SimpleWrapper = TestWrapper({
    dataProvider: MockJSONServer,
});

const EditWrapper = TestWrapper({
    dataProvider: MockJSONServer,
    routerProvider: mockRouterBindings({
        resource: {
            name: "posts",
        },
        action: "edit",
        id: "1",
    }),
});

const CloneWrapper = TestWrapper({
    dataProvider: MockJSONServer,
    routerProvider: mockRouterBindings({
        resource: {
            name: "posts",
        },
        action: "clone",
        id: "1",
    }),
});

const EditWrapperWithRoute: React.FC<{
    children?: React.ReactNode;
}> = ({ children }) => <EditWrapper>{children}</EditWrapper>;

const CloneWrapperWithRoute: React.FC<{
    children?: React.ReactNode;
}> = ({ children }) => <CloneWrapper>{children}</CloneWrapper>;

describe("useForm Hook", () => {
    describe("warn messages", () => {
        const warnMock = jest.fn();
        beforeAll(() => {
            jest.spyOn(console, "warn").mockImplementation(warnMock);
        });
        beforeEach(() => {
            warnMock.mockClear();
        });

        it("should warn when `resource` is passed and `id` is not", async () => {
            renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "edit",
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: MockJSONServer,
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            await waitFor(() => {
                expect(warnMock).toBeCalled();
            });
        });

        it("should not warn when `resource` is passed and `id` is not, if `queryOption.enabled` is false", async () => {
            renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "edit",
                        queryOptions: {
                            enabled: false,
                        },
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: MockJSONServer,
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            await waitFor(() => {
                expect(warnMock).not.toBeCalled();
            });
        });
    });

    it("renders with form", async () => {
        const { result } = renderHook(() => useForm({ resource: "posts" }), {
            wrapper: SimpleWrapper,
        });

        await waitFor(() => {
            expect(result.current.formLoading).toBeDefined();
        });
    });

    it("fetches data and puts in the form", async () => {
        const { result } = renderHook(() => useForm({ resource: "posts" }), {
            wrapper: EditWrapperWithRoute,
        });

        await waitFor(() => {
            expect(!result.current.formLoading).toBeTruthy();
        });

        expect(result.current.queryResult?.data?.data.title).toEqual(
            posts[0].title,
        );
    });

    it("should use the correct meta values when fetching data", async () => {
        const getOneMock = jest.fn();

        const { result } = renderHook(
            () =>
                useForm({
                    resource: "posts",
                    action: "edit",
                    id: 1,
                    meta: { foo: "baz", bar: "tux" },
                    queryMeta: { foo: "bar", baz: "qux" },
                }),
            {
                wrapper: TestWrapper({
                    dataProvider: {
                        default: {
                            ...MockJSONServer.default,
                            getOne: getOneMock,
                        },
                    },
                    routerProvider: mockRouterBindings(),
                    resources: [{ name: "posts" }],
                }),
            },
        );

        await waitFor(() => {
            expect(!result.current.formLoading).toBeTruthy();
        });

        await waitFor(() => {
            expect(getOneMock).toBeCalled();
        });

        expect(getOneMock).toBeCalledWith(
            expect.objectContaining({
                resource: "posts",
                meta: expect.objectContaining({
                    foo: "bar",
                    baz: "qux",
                    bar: "tux",
                }),
            }),
        );
    });

    it("correctly render edit form from route", async () => {
        const { result } = renderHook(() => useForm(), {
            wrapper: EditWrapperWithRoute,
        });

        await waitFor(() => {
            expect(!result.current.formLoading).toBeTruthy();
        });

        expect(result.current.id).toEqual("1");
    });

    it("correctly return id value from route", async () => {
        const { result } = renderHook(
            () =>
                useForm({
                    resource: "posts",
                }),
            {
                wrapper: EditWrapperWithRoute,
            },
        );

        await waitFor(() => {
            expect(!result.current.formLoading).toBeTruthy();
        });

        expect(result.current.id).toEqual("1");
    });

    it("correctly return id value from props", async () => {
        const { result } = renderHook(
            () =>
                useForm({
                    resource: "posts",
                    id: 2,
                }),
            {
                wrapper: EditWrapperWithRoute,
            },
        );

        await waitFor(() => {
            expect(!result.current.formLoading).toBeTruthy();
        });

        expect(result.current.queryResult?.data?.data.title).toEqual(
            posts[0].title,
        );
        expect(result.current.id).toEqual(2);
    });

    it("correctly return id value from route with custom resource", async () => {
        const { result } = renderHook(
            () =>
                useForm({
                    resource: "categories",
                    action: "edit",
                    id: 2,
                }),
            {
                wrapper: EditWrapperWithRoute,
            },
        );

        await waitFor(() => {
            expect(!result.current.formLoading).toBeTruthy();
        });

        expect(result.current.queryResult?.data?.data.title).toEqual(
            posts[0].title,
        );

        expect(result.current.id).toEqual(2);
    });

    it("correctly return id value which was set with setId after it was set", async () => {
        const { result } = renderHook(
            () =>
                useForm({
                    resource: "posts",
                }),
            {
                wrapper: EditWrapperWithRoute,
            },
        );

        expect(result.current.id).toEqual("1");

        await act(async () => {
            result.current.setId?.("3");
        });

        expect(result.current.id).toEqual("3");
    });

    it("correctly return id value after its updated with a new value", async () => {
        const { result, rerender } = renderHook(
            ({ id }) =>
                useForm({
                    resource: "posts",
                    id,
                }),
            {
                wrapper: EditWrapperWithRoute,
                initialProps: {
                    id: "1",
                },
            },
        );

        await waitFor(() => expect(result.current.id).toEqual("1"));

        await act(async () => {
            rerender({ id: "2" });
        });

        await waitFor(() => expect(result.current.id).toEqual("2"));
    });

    it("correctly return id undefined when route and options is different", async () => {
        const { result } = renderHook(
            () =>
                useForm({
                    resource: "categories",
                }),
            {
                wrapper: EditWrapperWithRoute,
            },
        );

        expect(result.current.id).toEqual(undefined);
    });

    it("fetches data and puts in the form while cloning", async () => {
        const { result } = renderHook(() => useForm({ resource: "posts" }), {
            wrapper: CloneWrapperWithRoute,
        });

        await waitFor(() => {
            expect(!result.current.formLoading).toBeTruthy();
        });

        expect(result.current.queryResult?.data?.data.title).toEqual(
            posts[0].title,
        );
    });

    it("should pass meta from resource defination, hook parameter and query parameters to dataProvider", async () => {
        const getOneMock = jest.fn();

        renderHook(() => useForm({ resource: "posts", meta: { foo: "bar" } }), {
            wrapper: TestWrapper({
                dataProvider: {
                    default: {
                        ...MockJSONServer.default,
                        getOne: getOneMock,
                    },
                },
                routerProvider: mockRouterBindings({
                    action: "edit",
                    resource: { name: "posts" },
                    id: "1",
                    pathname: "/posts/edit/1",
                    params: { baz: "qux" },
                }),
                resources: [{ name: "posts", meta: { dip: "dop" } }],
            }),
        });

        await waitFor(() => {
            expect(getOneMock).toBeCalled();
        });

        expect(getOneMock).toBeCalledWith(
            expect.objectContaining({
                meta: expect.objectContaining({
                    foo: "bar",
                    baz: "qux",
                    dip: "dop",
                }),
            }),
        );
    });

    it("two resources with same name, should pass resource meta according to identifier", async () => {
        const getOneMock = jest.fn();

        renderHook(() => useForm({ resource: "recentPosts", id: "1" }), {
            wrapper: TestWrapper({
                dataProvider: {
                    default: {
                        ...MockJSONServer.default,
                        getOne: getOneMock,
                    },
                },
                routerProvider: mockRouterBindings({
                    action: "edit",
                    resource: { name: "posts" },
                    id: "1",
                    pathname: "/posts/edit/1",
                }),
                resources: [
                    {
                        name: "posts",
                        identifier: "recentPosts",
                        meta: {
                            startDate: "2021-01-01",
                        },
                    },
                    {
                        name: "posts",
                        identifier: "popularPosts",
                        meta: {
                            likes: 100,
                        },
                    },
                ],
            }),
        });

        await waitFor(() => {
            expect(getOneMock).toBeCalled();
        });

        expect(getOneMock).toBeCalledWith(
            expect.objectContaining({
                meta: expect.objectContaining({
                    startDate: "2021-01-01",
                }),
            }),
        );

        expect(getOneMock).not.toBeCalledWith(
            expect.objectContaining({
                meta: expect.objectContaining({
                    likes: 100,
                }),
            }),
        );
    });

    it("if id is not provided while using legacy router provider, it should infer id from route when resources are matched", async () => {
        const legacyRouterProvider = {
            ...mockLegacyRouterProvider(),
            useParams: () => ({
                resource: "posts",
                action: "edit",
                id: "1",
            }),
        } as any;

        const { result } = renderHook(
            () =>
                useForm({
                    resource: "posts",
                }),
            {
                wrapper: TestWrapper({
                    dataProvider: MockJSONServer,
                    legacyRouterProvider: legacyRouterProvider,
                    resources: [{ name: "posts" }],
                }),
            },
        );

        expect(result.current.id).toEqual("1");
    });

    it("legacy router provider should infer resource, action and id from route", async () => {
        const updateMock = jest.fn();
        const legacyRouterProvider = {
            ...mockLegacyRouterProvider(),
            useParams: () => ({
                resource: "posts",
                action: "edit",
                id: "1",
            }),
        } as any;

        const { result } = renderHook(() => useForm({}), {
            wrapper: TestWrapper({
                dataProvider: {
                    default: {
                        ...MockJSONServer.default,
                        update: updateMock,
                    },
                },
                legacyRouterProvider: legacyRouterProvider,
                resources: [
                    {
                        name: "posts",
                    },
                ],
            }),
        });

        result.current.onFinish({});

        await waitFor(() => {
            expect(updateMock).toBeCalled();
        });

        expect(updateMock).toBeCalledWith(
            expect.objectContaining({
                resource: "posts",
                id: "1",
            }),
        );
    });

    it("redirect method should redirect to correct path", () => {
        const goMock = jest.fn();

        const { result } = renderHook(
            () =>
                useForm({
                    resource: "posts",
                    action: "create",
                }),
            {
                wrapper: TestWrapper({
                    dataProvider: MockJSONServer,
                    routerProvider: mockRouterBindings({
                        fns: {
                            go: () => {
                                return ({ to, type, ...rest }) => {
                                    if (type === "path") return to;
                                    goMock({ to, type, ...rest });
                                    return undefined;
                                };
                            },
                        },
                    }),
                    resources: [
                        {
                            name: "posts",
                            list: "/posts",
                            edit: "/posts/edit/:id",
                        },
                    ],
                }),
            },
        );

        result.current.redirect("edit", 1);

        expect(goMock).toBeCalledWith({
            to: "/posts/edit/1",
            type: "push",
        });
    });

    it("redirect method should redirect to correct path with id", () => {
        const goMock = jest.fn();

        const { result } = renderHook(
            () =>
                useForm({
                    resource: "posts",
                    action: "create",
                    id: "123",
                }),
            {
                wrapper: TestWrapper({
                    dataProvider: MockJSONServer,
                    routerProvider: mockRouterBindings({
                        fns: {
                            go: () => {
                                return ({ to, type, ...rest }) => {
                                    if (type === "path") return to;
                                    goMock({ to, type, ...rest });
                                    return undefined;
                                };
                            },
                        },
                    }),
                    resources: [
                        {
                            name: "posts",
                            list: "/posts",
                            edit: "/posts/edit/:id",
                        },
                    ],
                }),
            },
        );

        result.current.redirect("edit");

        expect(goMock).toBeCalledWith({
            to: "/posts/edit/123",
            type: "push",
        });
    });

    it("works correctly with `interval` and `onInterval` params for query", async () => {
        const onInterval = jest.fn();
        const { result } = renderHook(
            () =>
                useForm({
                    resource: "posts",
                    action: "edit",
                    id: 1,
                    overtimeOptions: {
                        interval: 100,
                        onInterval,
                    },
                }),
            {
                wrapper: TestWrapper({
                    dataProvider: {
                        default: {
                            ...MockJSONServer.default,
                            getOne: () => {
                                return new Promise((res) => {
                                    setTimeout(() => res({} as any), 1000);
                                });
                            },
                        },
                    },

                    resources: [
                        {
                            name: "posts",
                            list: "/posts",
                            edit: "/posts/edit/:id",
                        },
                    ],
                }),
            },
        );

        await waitFor(() => {
            expect(result.current.queryResult?.isFetching).toBeTruthy();
            expect(result.current.overtime.elapsedTime).toBe(900);
            expect(onInterval).toBeCalled();
        });

        await waitFor(() => {
            expect(!result.current.queryResult?.isFetching).toBeTruthy();
            expect(result.current.overtime.elapsedTime).toBeUndefined();
        });
    });

    describe("action 'create'", () => {
        it("onFinish should trigger create dataProvider method", async () => {
            const createMock = jest.fn();

            const { result } = renderHook(
                () => useForm({ resource: "posts", action: "create" }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            default: {
                                ...MockJSONServer.default,
                                create: createMock,
                            },
                        },
                        routerProvider: mockRouterBindings(),
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            result.current.onFinish({
                title: "foo",
            });

            await waitFor(() => {
                expect(createMock).toBeCalled();
            });

            expect(createMock).toBeCalledWith(
                expect.objectContaining({
                    resource: "posts",
                    variables: {
                        title: "foo",
                    },
                }),
            );
        });

        it("should call the `create` method with correct meta values", async () => {
            const createMock = jest.fn();

            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "create",
                        meta: { method: "POST", foo: "bar" },
                        mutationMeta: { method: "PATCH", baz: "qux" },
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            default: {
                                ...MockJSONServer.default,
                                create: createMock,
                            },
                        },
                        routerProvider: mockRouterBindings(),
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            result.current.onFinish({});

            await waitFor(() => {
                expect(createMock).toBeCalled();
            });

            expect(createMock).toBeCalledWith(
                expect.objectContaining({
                    resource: "posts",
                    meta: expect.objectContaining({
                        method: "PATCH",
                        foo: "bar",
                        baz: "qux",
                    }),
                }),
            );
        });

        it("onFinish should not trigger create dataProvider method if resource not found", async () => {
            const createMock = jest.fn();

            const { result } = renderHook(() => useForm({ action: "create" }), {
                wrapper: TestWrapper({
                    dataProvider: {
                        default: {
                            ...MockJSONServer.default,
                            create: createMock,
                        },
                    },
                    routerProvider: mockRouterBindings(),
                    resources: [{ name: "posts" }],
                }),
            });

            result.current.onFinish({
                title: "foo",
            });

            await waitFor(() => {
                expect(createMock).not.toBeCalled();
            });
        });

        it("should call `onMutationSuccess` with correct parameters", async () => {
            const onMutationSuccessMock = jest.fn();

            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "create",
                        onMutationSuccess: onMutationSuccessMock,
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: MockJSONServer,
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            result.current.onFinish({ title: "foo" });

            await waitFor(() => {
                expect(result.current.mutationResult.isSuccess).toBeTruthy();
            });

            expect(onMutationSuccessMock).toBeCalledWith(
                { data: posts[0] },
                {
                    title: "foo",
                },
                undefined,
            );
        });

        it("should call `onMutationError` with correct parameters", async () => {
            const createMock = jest.fn().mockRejectedValue(new Error("Error"));
            const onMutationErrorMock = jest.fn();

            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "create",
                        onMutationError: onMutationErrorMock,
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            default: {
                                ...MockJSONServer.default,
                                create: createMock,
                            },
                        },
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            result.current.onFinish({ title: "foo" });

            await waitFor(() => {
                expect(result.current.mutationResult.isError).toBeTruthy();
            });

            expect(onMutationErrorMock).toBeCalledWith(
                new Error("Error"),
                {
                    title: "foo",
                },
                undefined,
            );
        });

        it("works correctly with `interval` and `onInterval` params for create mutation", async () => {
            const onInterval = jest.fn();
            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "create",
                        overtimeOptions: {
                            interval: 100,
                            onInterval,
                        },
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            default: {
                                ...MockJSONServer.default,
                                create: () => {
                                    return new Promise((res) => {
                                        setTimeout(() => res({} as any), 1000);
                                    });
                                },
                            },
                        },

                        resources: [
                            {
                                name: "posts",
                                list: "/posts",
                                edit: "/posts/edit/:id",
                            },
                        ],
                    }),
                },
            );

            result.current.onFinish({
                title: "foo",
            });

            await waitFor(() => {
                expect(result.current.mutationResult?.isLoading).toBeTruthy();
                expect(result.current.overtime.elapsedTime).toBe(900);
                expect(onInterval).toBeCalled();
            });

            await waitFor(() => {
                expect(!result.current.mutationResult?.isLoading).toBeTruthy();
                expect(result.current.overtime.elapsedTime).toBeUndefined();
            });
        });
    });

    describe("action 'edit'", () => {
        it("onFinish should trigger edit dataProvider method", async () => {
            const updateMock = jest.fn();

            const { result } = renderHook(
                () => useForm({ resource: "posts", action: "edit" }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            default: {
                                ...MockJSONServer.default,
                                update: updateMock,
                            },
                        },
                        routerProvider: mockRouterBindings(),
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            result.current.onFinish({
                title: "foo",
            });

            await waitFor(() => {
                expect(updateMock).toBeCalled();
            });

            expect(updateMock).toBeCalledWith(
                expect.objectContaining({
                    resource: "posts",
                    variables: {
                        title: "foo",
                    },
                }),
            );
        });

        it("should call edit dataProvider method with correct meta values", async () => {
            const updateMock = jest.fn();

            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "edit",
                        meta: { method: "POST", foo: "bar" },
                        queryMeta: { method: "GET" },
                        mutationMeta: { method: "PATCH", baz: "qux" },
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            default: {
                                ...MockJSONServer.default,
                                update: updateMock,
                            },
                        },
                        routerProvider: mockRouterBindings(),
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            result.current.onFinish({});

            await waitFor(() => {
                expect(updateMock).toBeCalled();
            });

            expect(updateMock).toBeCalledWith(
                expect.objectContaining({
                    resource: "posts",
                    meta: expect.objectContaining({
                        method: "PATCH",
                        foo: "bar",
                        baz: "qux",
                    }),
                }),
            );
        });

        it("onFinish should not trigger edit dataProvider method if resource not found", async () => {
            const updateMock = jest.fn();

            const { result } = renderHook(() => useForm({ action: "edit" }), {
                wrapper: TestWrapper({
                    dataProvider: {
                        default: {
                            ...MockJSONServer.default,
                            update: updateMock,
                        },
                    },
                    routerProvider: mockRouterBindings(),
                    resources: [{ name: "posts" }],
                }),
            });

            result.current.onFinish({
                title: "foo",
            });

            await waitFor(() => {
                expect(updateMock).not.toBeCalled();
            });
        });

        it("should call `onMutationSuccess` with correct parameters", async () => {
            const onMutationSuccessMock = jest.fn();

            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "edit",
                        onMutationSuccess: onMutationSuccessMock,
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: MockJSONServer,
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            result.current.onFinish({ title: "foo" });

            await waitFor(() => {
                expect(result.current.mutationResult.isSuccess).toBeTruthy();
            });

            expect(onMutationSuccessMock).toBeCalledWith(
                { data: posts[0] },
                {
                    title: "foo",
                },
                expect.anything(),
            );
        });

        it("should call `onMutationError` with correct parameters", async () => {
            const updateMock = jest.fn().mockRejectedValue(new Error("Error"));
            const onMutationErrorMock = jest.fn();

            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "edit",
                        onMutationError: onMutationErrorMock,
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            default: {
                                ...MockJSONServer.default,
                                update: updateMock,
                            },
                        },
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            result.current.onFinish({ title: "foo" });

            await waitFor(() => {
                expect(result.current.mutationResult.isError).toBeTruthy();
            });

            expect(onMutationErrorMock).toBeCalledWith(
                new Error("Error"),
                {
                    title: "foo",
                },
                expect.anything(),
            );
        });

        it("works correctly with `interval` and `onInterval` params for edit mutation", async () => {
            const onInterval = jest.fn();
            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "edit",
                        id: 1,
                        overtimeOptions: {
                            interval: 100,
                            onInterval,
                        },
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            default: {
                                ...MockJSONServer.default,
                                update: () => {
                                    return new Promise((res) => {
                                        setTimeout(() => res({} as any), 1000);
                                    });
                                },
                            },
                        },

                        resources: [
                            {
                                name: "posts",
                                list: "/posts",
                                edit: "/posts/edit/:id",
                            },
                        ],
                    }),
                },
            );

            result.current.onFinish({
                title: "foo",
            });

            await waitFor(() => {
                expect(result.current.mutationResult?.isLoading).toBeTruthy();
                expect(result.current.overtime.elapsedTime).toBe(900);
                expect(onInterval).toBeCalled();
            });

            await waitFor(() => {
                expect(!result.current.mutationResult?.isLoading).toBeTruthy();
                expect(result.current.overtime.elapsedTime).toBeUndefined();
            });
        });

        it("should work with optimistic update", async () => {
            const initialTitle =
                "Necessitatibus necessitatibus id et cupiditate provident est qui amet.";
            const updatedTitle = "optimistic test";

            const { result } = renderHook(
                () =>
                    useForm({
                        resource: "posts",
                        action: "edit",
                        id: "1",
                        mutationMode: "optimistic",
                    }),
                {
                    wrapper: TestWrapper({
                        dataProvider: {
                            ...MockJSONServer.default,
                            update: async () => {
                                return new Promise((res, rej) => {
                                    setTimeout(() => rej(), 500);
                                });
                            },
                        },
                        routerProvider: mockRouterBindings(),
                        resources: [{ name: "posts" }],
                    }),
                },
            );

            const useOneResult = renderUseOne();
            const useListResult = renderUseList();
            const useManyResult = renderUseMany();

            await assertOne(useOneResult, "title", initialTitle);

            await assertList(useListResult, "title", initialTitle);

            await assertList(useManyResult, "title", initialTitle);

            act(() => {
                result.current.onFinish({ title: updatedTitle });
            });

            await assertOne(useOneResult, "title", updatedTitle);

            await assertList(useListResult, "title", updatedTitle);

            await assertList(useManyResult, "title", updatedTitle);

            await waitFor(() => {
                expect(result.current.mutationResult.isError).toEqual(true);
            });

            await assertOne(useOneResult, "title", initialTitle);

            await assertList(useListResult, "title", initialTitle);

            await assertList(useManyResult, "title", initialTitle);
        });
    });
});
