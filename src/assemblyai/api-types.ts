

export type AssemblyAIEncoding = "pcm_s16le" | "pcm_mulaw";

export type AssemblyAISpeechModel =
    | "universal-streaming-english"
    | "universal-streaming-multi";

export type AssemblyAIRegion = "us" | "eu";

export interface AssemblyAIWord {
    text: string;
    word_is_final: string
    start: number;
    end: number;
    confidence: number
}
export interface AssemblyAITurnEvent {
    turn_order: number;
    turn_is_formatted: boolean;
    end_of_turn: boolean;
    transcript: string;
    end_of_turn_confidence: number;
    words: AssemblyAIWord[];
}

export namespace AssemblyAISTTMessage {
    export enum Type {
        Begin = "Begin",
        Turn = "Turn",
        Termination = "Termination",
        Error = "Error",
    }
    export interface Begin {
        type: Type.Begin;
        id: string;
        expires_at: number;
    }
    export interface Turn {
        type: Type.Turn;
        turn_order: number;
        turn_is_formatted: boolean;
        end_of_turn: boolean;
        transcript: string;
        end_of_turn_confidence: number;
        words: AssemblyAIWord[];
    }
    export interface Termination {
        type: Type.Termination;
        audio_duration_seconds: number;
        session_duration_seconds: number;
    }
    export interface Error {
        type: Type.Error;
        error: string;
    }
}

export type AssemblyAISTTMessage =
    | AssemblyAISTTMessage.Begin
    | AssemblyAISTTMessage.Turn
    | AssemblyAISTTMessage.Termination
    | AssemblyAISTTMessage.Error;