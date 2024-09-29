export type Json = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
    [property: string]: Json;
}
export interface JsonArray extends Array<Json> {
}
export type TransformContext = {
    source: Json;
    schema: string;
};
export type JsonSchemaValueNode = {
    "@path": string;
    "@default"?: JsonSchema;
    "@transform"?: (value: Json, destination: Json, context: TransformContext) => Json;
};
export type JsonSchemaItemNode = {
    "@yield": {
        [property: string]: JsonSchemaValue | JsonSchemaYieldValueNode;
    }[];
    "@length"?: JsonSchema;
};
export type YieldPaddingMode = "empty" | "edge" | "wrap" | "reflect";
export type JsonSchemaYieldValueNode = JsonSchemaValueNode & {
    "@padding"?: YieldPaddingMode;
};
export interface JsonSchema {
    [property: string]: JsonSchemaValue;
}
type JsonSchemaValue = Json | JsonSchema | JsonSchemaValueNode | JsonSchemaArray;
type JsonSchemaArrayElement = JsonSchemaValue | JsonSchemaItemNode;
interface JsonSchemaArray extends Array<JsonSchemaArrayElement> {
}
export interface MapperOptions {
    objectMergeMode: "overwrite" | "preserve" | "replace";
    arrayMergeMode: "replace" | "concat" | "combine";
}
export declare function map(source: Json, schema: JsonSchema, options?: Partial<MapperOptions>, target?: Json): Json;
export {};
