export type Json = string | number | boolean | null | JsonObject | JsonArray | undefined;
export interface JsonObject {
    [property: string]: Json;
}
export interface JsonArray extends Array<Json> {
}
export type TransformContext = {
    source: Json;
    schema: string;
};
export type JsonValueSchema = {
    "@path": string;
    "@default"?: ValueInJsonSchema;
    "@transform"?: (value: Json, target: Json, context: TransformContext) => Json;
};
export type JsonElementSchema = {
    "@element": {
        [property: string]: ValueInJsonSchema | JsonElementValueSchema;
    };
    "@length"?: JsonSchema;
};
export type ElementValuePadding = "empty" | "edge" | "wrap" | "reflect";
export type JsonElementValueSchema = JsonValueSchema & {
    "@padding"?: ElementValuePadding;
};
export interface JsonSchema {
    [property: string]: ValueInJsonSchema;
}
type ValueInJsonSchema = Json | JsonSchema | JsonValueSchema | ArrayInJsonSchema;
interface ArrayInJsonSchema extends Array<ValueInJsonSchema | JsonElementSchema> {
}
export interface MapOptions {
    objectMergeMode?: "overwrite" | "preserve" | "replace";
    arrayMergeMode?: "replace" | "append" | "prepend";
}
export declare function map(source: Json, schema: JsonSchema, target?: Json, options?: MapOptions): Json;
export declare function value(source: Json, key: string | JsonValueSchema): Json;
export {};
