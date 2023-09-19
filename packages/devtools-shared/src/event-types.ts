import {
    Mutation,
    MutationKey,
    MutationStatus,
    QueryKey,
    QueryState,
    QueryStatus,
} from "@tanstack/react-query";
import { TraceType } from "./trace";

export enum DevtoolsEvent {
    RELOAD = "devtools:reload",
    DEVTOOLS_INIT = "devtools:init",
    DEVTOOLS_HANDSHAKE = "devtools:handshake",
    DEVTOOLS_ALREADY_CONNECTED = "devtools:already-connected",
    ACTIVITY = "devtools:send-activity",
    DEVTOOLS_ACTIVITY_UPDATE = "devtools:activity-update",
    DEVTOOLS_CONNECTED_APP = "devtools:connected-app",
    DEVTOOLS_DISCONNECTED_APP = "devtools:disconnected-app",
    DEVTOOLS_HIGHLIGHT_IN_MONITOR = "devtools:highlight-in-monitor",
    DEVTOOLS_HIGHLIGHT_IN_MONITOR_ACTION = "devtools:highlight-in-monitor-action",
    DEVTOOLS_LOGIN_SUCCESS = "devtools:login-success",
    DEVTOOLS_RELOAD_AFTER_LOGIN = "devtools:reload-after-login",
}

type Timestamps = {
    createdAt: number;
    updatedAt: number;
};

type ActivityPayload =
    | {
          type: "mutation";
          identifier: string;
          key?: MutationKey;
          status?: MutationStatus;
          trace?: TraceType[];
          state: Mutation<any, any, any, any>["state"];
          variables?: Mutation<any, any, any, any>["state"]["variables"];
          hookName: string;
          resourcePath: string | null;
          legacyKey: boolean;
      }
    | {
          type: "query";
          identifier: string;
          key?: QueryKey;
          status?: QueryStatus;
          trace?: TraceType[];
          state: QueryState<any, any>;
          hookName: string;
          resourcePath: string | null;
          legacyKey: boolean;
      };

export type DevtoolsEventPayloads = {
    [DevtoolsEvent.RELOAD]: {};
    [DevtoolsEvent.DEVTOOLS_INIT]: { url: string };
    [DevtoolsEvent.DEVTOOLS_HANDSHAKE]: { url: string };
    [DevtoolsEvent.DEVTOOLS_ALREADY_CONNECTED]: { url: string };
    [DevtoolsEvent.ACTIVITY]: ActivityPayload;
    [DevtoolsEvent.DEVTOOLS_ACTIVITY_UPDATE]: {
        updatedActivities: (ActivityPayload & Timestamps)[];
    };
    [DevtoolsEvent.DEVTOOLS_CONNECTED_APP]: { url: string | null };
    [DevtoolsEvent.DEVTOOLS_DISCONNECTED_APP]: {};
    [DevtoolsEvent.DEVTOOLS_HIGHLIGHT_IN_MONITOR]: { name: string };
    [DevtoolsEvent.DEVTOOLS_HIGHLIGHT_IN_MONITOR_ACTION]: { name: string };
    [DevtoolsEvent.DEVTOOLS_LOGIN_SUCCESS]: {};
    [DevtoolsEvent.DEVTOOLS_RELOAD_AFTER_LOGIN]: {};
};
