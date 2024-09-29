import merge from "deepmerge";
import { JSONPath } from "jsonpath-plus";
import type { JSONPathOptions } from "jsonpath-plus";

export type Json =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray
  | undefined;
export interface JsonObject {
  [property: string]: Json;
}
export interface JsonArray extends Array<Json> {}

export type TransformContext = {
  source: Json;
  schema: string;
};
export type JsonSchemaValueNode = {
  "@path": string;
  "@default"?: JsonSchema;
  "@transform"?: (value: Json, target: Json, context: TransformContext) => Json;
};
export type JsonSchemaItemNode = {
  "@yield": {
    [property: string]: JsonSchemaValue | JsonSchemaYieldValueNode;
  };
  "@length"?: JsonSchema;
};
export type YieldPadding = "empty" | "edge" | "wrap" | "reflect";
export type JsonSchemaYieldValueNode = JsonSchemaValueNode & {
  "@padding"?: YieldPadding;
};
export interface JsonSchema {
  [property: string]: JsonSchemaValue;
}

type JsonSchemaValue =
  | Json
  | JsonSchema
  | JsonSchemaValueNode
  | JsonSchemaArray;
type JsonSchemaArrayElement = JsonSchemaValue | JsonSchemaItemNode;
interface JsonSchemaArray extends Array<JsonSchemaArrayElement> {}
type JsonSchemaObject = JsonObject | JsonSchema | JsonSchemaValueNode;

export interface MapperOptions {
  objectMergeMode?: "overwrite" | "preserve" | "replace";
  arrayMergeMode?: "replace" | "concat";
}

const DefaultOptions: MapperOptions = {
  objectMergeMode: "overwrite",
  arrayMergeMode: "replace",
};

const range = (from: number, to: number) =>
  [...Array(to - from)].map((_, i) => from + i);
const overwriteMerge = (_: Json[], source: Json[]) => source;
const preserveMerge = (target: Json[], _: Json[]) => target;
// const appendMerge = (target: Json[], source: Json[]) => target.concat(source);

function unescapeString(prop: string) {
  return prop.startsWith("`") ? prop.substring(1) : prop;
}

function isJsonPath(path: string): boolean {
  return path.startsWith("$.");
}

function isValueNode(schema: JsonSchemaValue): schema is JsonSchemaValueNode {
  return (
    !!schema &&
    typeof schema === "object" &&
    "@path" in schema &&
    typeof schema["@path"] === "string"
  );
}

function isItemNode(schema: JsonSchemaValue): schema is JsonSchemaItemNode {
  return (
    !!schema &&
    typeof schema === "object" &&
    "@yield" in schema &&
    !!schema["@yield"] &&
    typeof schema["@yield"] === "object"
  );
}

function getJsonValue(
  source: Json,
  target: Json,
  schema: JsonSchemaValue,
  options: MapperOptions,
): Json {
  let mappedValue = schema as Json;

  if (isValueNode(schema)) {
    mappedValue = getJsonValue(source, target, schema["@path"], options);

    if (schema["@default"] !== undefined) {
      mappedValue =
        mappedValue ?? mapToAny(source, target, schema["@default"], options);
    }

    if (schema["@transform"]) {
      const context = { source, schema: schema["@path"] };
      mappedValue = schema["@transform"](mappedValue, target, context);
    }
  } else if (typeof schema === "string") {
    if (isJsonPath(schema)) {
      let trimArray = true;
      let path = schema;
      if (schema.endsWith("[]")) {
        path = schema.substring(0, schema.length - 2);
        trimArray = false;
      }

      const result = JSONPath({ path, json: source } as JSONPathOptions);
      if (trimArray && Array.isArray(result) && result.length <= 1) {
        mappedValue = result[0];
      } else {
        mappedValue = result;
      }
    } else {
      mappedValue = unescapeString(schema);
    }
  }

  return mappedValue;
}

function mapToObject(
  source: Json,
  target: JsonObject,
  schema: JsonSchemaObject,
  options: MapperOptions,
): Json {
  let targetObject = target;
  if (!targetObject || typeof targetObject !== "object") {
    targetObject = {};
  }

  const mappedObject = Object.fromEntries(
    Object.entries(schema).map(([prop, propSchema]) => {
      const key = unescapeString(prop);
      return [key, mapToAny(source, targetObject[key], propSchema, options)];
    }),
  );

  let arrayMerge = undefined;
  switch (options.arrayMergeMode) {
    case "replace":
      arrayMerge = overwriteMerge;
      break;
    case "concat":
      switch (options.objectMergeMode) {
        case "overwrite":
          arrayMerge = overwriteMerge;
          break;
        case "preserve":
          arrayMerge = preserveMerge;
          break;
      }
      break;
  }

  let destination = targetObject;
  switch (options.objectMergeMode) {
    case "overwrite":
      destination = merge(targetObject, mappedObject, { arrayMerge });
      break;
    case "preserve":
      destination = merge(mappedObject, targetObject, { arrayMerge });
      break;
    case "replace":
      destination = mappedObject;
      break;
  }

  return destination;
}

function mapToArray(
  source: Json,
  target: JsonArray,
  schema: JsonSchemaArray,
  options: MapperOptions,
): JsonArray {
  let targetArray = target;
  if (!Array.isArray(target)) {
    targetArray = [];
  }

  const mappedItems = schema.flatMap((itemSchema, i) => {
    if (isItemNode(itemSchema)) {
      const yieldedProperties: Record<
        string,
        [Json, YieldPadding | undefined]
      > = {};

      for (const [prop, valueSchema] of Object.entries(itemSchema["@yield"])) {
        const padding = (valueSchema as JsonSchemaYieldValueNode)?.["@padding"];
        const items = mapToAny(source, targetArray[i], valueSchema, options);

        yieldedProperties[prop] = [items, padding];
      }

      let length = Math.max(
        ...Object.values(yieldedProperties).map(([items]) =>
          Array.isArray(items) ? items.length : 1,
        ),
      );

      if (itemSchema["@length"]) {
        const resolved = mapToAny(source, null, itemSchema["@length"], options);
        if (Number.isInteger(resolved)) {
          length = resolved as number;
        }
        if (Array.isArray(resolved)) {
          length = resolved.length;
        }
      }

      return range(0, length).map((j) => {
        return Object.fromEntries(
          Object.entries(yieldedProperties)
            .map(([prop, [items, padding]]) => {
              if (Array.isArray(items)) {
                switch (padding ?? "empty") {
                  case "empty":
                    return [prop, items[j]];
                  case "edge":
                    return [prop, items[j] ?? items.at(-1)];
                  case "reflect":
                    return [
                      prop,
                      items[
                        ((j / items.length) | 0) % 2 === 0
                          ? j % items.length
                          : items.length - 1 - (j % items.length)
                      ],
                    ];
                  case "wrap":
                    return [prop, items[j % items.length]];
                }
              }

              switch (padding ?? "edge") {
                case "empty":
                  return [prop, j === 0 ? items : undefined];
                default:
                  return [prop, items];
              }
            })
            .filter(([_, items]) => items !== undefined),
        );
      });
    }

    return [mapToAny(source, targetArray[i], itemSchema, options)];
  });

  let destination = targetArray;
  switch (options.arrayMergeMode) {
    case "replace":
      destination = mappedItems;
      break;
    case "concat":
      destination = [...targetArray, ...mappedItems];
      break;
  }

  return destination;
}

function mapToAny(
  source: Json,
  target: Json,
  schema: JsonSchemaValue,
  options: MapperOptions,
): Json {
  if (Array.isArray(schema)) {
    return mapToArray(
      source,
      target as JsonArray,
      schema as JsonSchemaArray,
      options,
    );
  }

  if (schema != null && typeof schema === "object" && !isValueNode(schema)) {
    return mapToObject(
      source,
      target as JsonObject,
      schema as JsonSchemaObject,
      options,
    );
  }

  return getJsonValue(source, target, schema, options);
}

export function map(
  source: Json,
  schema: JsonSchema,
  options?: Partial<MapperOptions>,
  target: Json = null,
): Json {
  const fixedOptions = Object.assign({}, DefaultOptions, options ?? {});
  return mapToAny(source, target, schema, fixedOptions);
}
