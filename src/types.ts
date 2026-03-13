export namespace VoiceAgentEvent {

    interface BaseEvent {
        type: string;
        ts: number
    }
    export interface UserInput extends BaseEvent {
        readonly type: "user_input",
        audio: Uint8Array;
    }

    export interface STTChunk extends BaseEvent {
        readonly type: 'stt_chunk';
        transcript: string;
    }
    export interface STTOutput extends BaseEvent {
        readonly type: "stt_output";

        transcript: string;
    }
    export type STTEvent = STTChunk | STTOutput;
    export interface AgentChunk extends BaseEvent {
        readonly type: "agent_chunk";
        text: string;
    }
    export interface AgentEnd extends BaseEvent {
        readonly type: "agent_end";
    }
    export interface ToolCall extends BaseEvent {
        readonly type: "tool_call";
        id: string;
        name: string;
        args: Record<string, unknown>;
    }
    export interface ToolResult extends BaseEvent {
        readonly type: "tool_result";
        toolCallId: string;
        name: string;
        result: string;
    }
    export type AgentEvent = AgentChunk | AgentEnd | ToolCall | ToolResult;

    export interface TTSChunk extends BaseEvent {
        readonly type: "tts_chunk";
        audio: string;
    }

}
export type VoiceAgentEvent =
    | VoiceAgentEvent.UserInput
    | VoiceAgentEvent.STTEvent
    | VoiceAgentEvent.AgentEvent
    | VoiceAgentEvent.TTSChunk;