
export interface CartesiaVoice {
    mode: "id";
    id: string;
}

export interface CartesiaOutputFormat {
    container: "raw";
    encoding: "pcm_s16le" | "pcm_f32le" | "pcm_mulaw" | "pcm_alaw";
    sample_rate: number;
}


export interface CartesiaTTSRequest {
    model_id: string;
    transcript: string;
    voice: CartesiaVoice;
    output_format: CartesiaOutputFormat;
    context_id?: string;
    continue?: boolean;
    language?: string;
}

export interface CartesiaTTSResponse {
    status_code?: number;
    done?: boolean;
    context_id?: string;
    data?: string;
    error?: string;
    type?: "chunk" | "done" | "error";
}
