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

type ValueInJsonSchema =
  | Json
  | JsonSchema
  | JsonValueSchema
  | ArrayInJsonSchema;
interface ArrayInJsonSchema
  extends Array<ValueInJsonSchema | JsonElementSchema> {}
type ObjectInJsonSchema = JsonObject | JsonSchema;

export interface MapOptions {
  objectMergeMode?: "overwrite" | "preserve" | "replace";
  arrayMergeMode?: "replace" | "append" | "prepend";
}

const DefaultOptions: MapOptions = {
  objectMergeMode: "overwrite",
  arrayMergeMode: "replace",
};

const range = (from: number, to: number) =>
  [...Array(to - from)].map((_, i) => from + i);
const overwriteMerge = (_: Json[], source: Json[]) => source;
const preserveMerge = (target: Json[], _: Json[]) => target;

function unescapeString(prop: string) {
  return prop.startsWith("`") ? prop.substring(1) : prop;
}

function isJsonPath(path: string): boolean {
  return path.startsWith("$.");
}

function isValueSchema(schema: ValueInJsonSchema): schema is JsonValueSchema {
  return (
    !!schema &&
    typeof schema === "object" &&
    "@path" in schema &&
    typeof schema["@path"] === "string"
  );
}

function isElementSchema(
  schema: ValueInJsonSchema,
): schema is JsonElementSchema {
  return (
    !!schema &&
    typeof schema === "object" &&
    "@element" in schema &&
    !!schema["@element"] &&
    typeof schema["@element"] === "object"
  );
}

function getJsonValue(
  source: Json,
  target: Json,
  schema: ValueInJsonSchema,
  options: MapOptions,
): Json {
  let mappedValue = schema as Json;

  if (isValueSchema(schema)) {
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
  schema: ObjectInJsonSchema,
  options: MapOptions,
): Json {
  let targetObject = target;
  if (!targetObject || typeof targetObject !== "object") {
    targetObject = {};
  }

  const mappedObject = Object.fromEntries(
    Object.entries(schema)
      .map(([prop, propSchema]) => {
        const key = unescapeString(prop);
        return [key, mapToAny(source, targetObject[key], propSchema, options)];
      })
      .filter((p) => p[1] !== undefined),
  );

  let arrayMerge = undefined;
  switch (options.arrayMergeMode) {
    case "replace":
      arrayMerge = overwriteMerge;
      break;
    case "append":
    case "prepend":
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
  schema: ArrayInJsonSchema,
  options: MapOptions,
): JsonArray {
  let targetArray = target;
  if (!Array.isArray(target)) {
    targetArray = [];
  }

  const mappedItems = schema.flatMap((itemSchema, i) => {
    if (isElementSchema(itemSchema)) {
      const yieldedProperties: Record<
        string,
        [Json, ElementValuePadding | undefined]
      > = {};

      for (const [prop, valueSchema] of Object.entries(
        itemSchema["@element"],
      )) {
        const padding = (valueSchema as JsonElementValueSchema)?.["@padding"];
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

      return range(0, length)
        .map((j) => {
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
        })
        .filter((v) => v !== undefined);
    }

    return [mapToAny(source, targetArray[i], itemSchema, options)].filter(
      (v) => v !== undefined,
    );
  });

  let destination = targetArray;
  switch (options.arrayMergeMode) {
    case "replace":
      destination = mappedItems;
      break;
    case "append":
      destination = [...targetArray, ...mappedItems];
      break;
    case "prepend":
      destination = [...mappedItems, ...targetArray];
      break;
  }

  return destination;
}

function mapToAny(
  source: Json,
  target: Json,
  schema: ValueInJsonSchema,
  options: MapOptions,
): Json {
  if (Array.isArray(schema)) {
    return mapToArray(
      source,
      target as JsonArray,
      schema as ArrayInJsonSchema,
      options,
    );
  }

  if (schema != null && typeof schema === "object" && !isValueSchema(schema)) {
    return mapToObject(
      source,
      target as JsonObject,
      schema as ObjectInJsonSchema,
      options,
    );
  }

  return getJsonValue(source, target, schema, options);
}

export function map(
  source: Json,
  schema: JsonSchema,
  target: Json = null,
  options?: MapOptions,
): Json {
  const fixedOptions = Object.assign({}, DefaultOptions, options ?? {});
  return mapToAny(source, target, schema, fixedOptions);
}

export function value(source: Json, key: string | JsonValueSchema): Json {
  return getJsonValue(source, null, key, DefaultOptions);
}
