"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMockDataFromSwagger = generateMockDataFromSwagger;
const yaml = __importStar(require("js-yaml"));
// Parse the input OpenAPI/Swagger spec and generate mock data
async function generateMockDataFromSwagger(spec) {
    let parsedSpec;
    console.log('START Parsing Input Spec.');
    // console.log('Input Spec:: ' + spec);
    // Try to parse the spec as JSON or YAML
    try {
        if (spec.trim().startsWith('{')) {
            parsedSpec = JSON.parse(spec); // JSON spec
        }
        else {
            parsedSpec = yaml.load(spec); // YAML spec
        }
    }
    catch (error) {
        console.log('errors:: ' + error);
        throw new Error("Invalid Swagger/OpenAPI specification: " + error.message);
    }
    console.log('END Parsing.');
    // console.log('parsedSpec:: ' + JSON.stringify(parsedSpec));
    // console.log('parsedSpec.paths:: ' + JSON.stringify(parsedSpec.paths));
    try {
        return generateMockDataForPaths(parsedSpec.paths);
    }
    catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
        console.error(`Error: ${errorMessage}`);
        throw new Error(`Error parsing Swagger spec: ` + errorMessage);
    }
}
// Generate mock data for all API paths
function generateMockDataForPaths(paths) {
    let mockData = {};
    for (const [path, methods] of Object.entries(paths)) {
        // console.log('path:: ' + JSON.stringify(path));
        // console.log('methods:: ' + JSON.stringify(methods));
        mockData[path] = {};
        // Assert 'methods' as a Record<string, any> to ensure it works with Object.entries
        for (const [method, details] of Object.entries(methods)) {
            // console.log('details:: ' + JSON.stringify(details));
            const hasRequestBody = details.requestBody ? true : false;
            const hasResponses = details.responses ? true : false;
            let mockRequestScenarios = null;
            let mockResponseScenarios = null;
            if (hasRequestBody) {
                mockRequestScenarios = generateMockRequestScenarios(details.requestBody);
            }
            if (hasResponses) {
                mockResponseScenarios = generateMockResponseScenarios(details.responses);
            }
            mockData[path][method] = {
                scenario1: {
                    request: mockRequestScenarios ? mockRequestScenarios : null,
                    responses: mockResponseScenarios && mockResponseScenarios[0] ? mockResponseScenarios[0] : null,
                },
                scenario2: {
                    request: mockRequestScenarios ? mockRequestScenarios : null,
                    responses: mockResponseScenarios && mockResponseScenarios[1] ? mockResponseScenarios[1] : null,
                },
                scenario3: {
                    request: mockRequestScenarios ? mockRequestScenarios : null,
                    responses: mockResponseScenarios && mockResponseScenarios[2] ? mockResponseScenarios[2] : null,
                }
            };
        }
    }
    console.log('mockData:: ' + JSON.stringify(mockData));
    //return JSON.stringify(mockData);
    return mockData;
}
// Generate mock request data from the requestBody schema
function generateMockRequestScenarios(requestBody) {
    // console.log('requestBody.content:: ' + JSON.stringify(requestBody));
    if (requestBody && requestBody.content) {
        const contentTypes = Object.keys(requestBody.content);
        const jsonSchema = requestBody.content[contentTypes[0]].schema;
        var requestBodyMockData = generateMockData(jsonSchema);
        // console.log('requestBody MockData:: ' + JSON.stringify(requestBodyMockData));
        return requestBodyMockData;
    }
    return null;
}
function generateMockData(schema) {
    if (!schema || !schema.type) {
        return null;
    }
    ;
    switch (schema.type) {
        case 'string':
            return schema.example || "example string";
        case 'number':
            return schema.example || 42.0;
        case 'integer':
            return schema.example || 42;
        case 'boolean':
            return schema.example || false;
        case 'array':
            if (schema.items) {
                return [generateMockData(schema.items)];
            }
            return [];
        case 'object':
            const mockObject = {};
            if (schema.properties) {
                for (const key in schema.properties) {
                    if (schema.properties.hasOwnProperty(key)) {
                        mockObject[key] = generateMockData(schema.properties[key]);
                    }
                }
            }
            return mockObject;
        case 'null':
            return null;
        default:
            return "unknown type";
    }
}
// Generate mock response data for each response code
function generateMockResponseScenarios(responses) {
    const scenarios = [];
    for (const [statusCode, response] of Object.entries(responses || {})) {
        // Assert that 'response' is of type `any` so we can access properties without errors
        const content = response?.content?.['application/json']?.schema;
        // Generate a mock response based on content schema or fallback
        const mockResponse = content ? generateMockData(content) : { message: `Mock response for ${statusCode}` };
        // Push three scenarios for each response
        scenarios.push({
            status: statusCode,
            data: mockResponse,
            message: `Scenario for status ${statusCode}`
        });
    }
    // Return three copies of the mock responses for each response code
    return scenarios.length > 0 ? scenarios.slice(0, 3) : [{ status: "default", data: { message: "No responses available" } }];
}
//# sourceMappingURL=mockGenerator.js.map