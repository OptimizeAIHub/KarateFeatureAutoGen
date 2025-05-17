import * as vscode from 'vscode';
import fs from 'fs';
import yaml from 'js-yaml';

export async function activate(context: vscode.ExtensionContext) {

	let newPanel: vscode.WebviewPanel | undefined = undefined;

	console.log('Extension is now active!');

	const processtest = vscode.commands.registerCommand('karatefeatureautogen.processTest', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello VS code from Suresh Nettur - PT!');

		// Create and show panel
		let currentPanel = vscode.window.createWebviewPanel(
			'processTests',
			'Karate Feature Auto Generator',
			vscode.ViewColumn.One,
			{ enableScripts: true, }
		);

		// And set its HTML content
		currentPanel.webview.html = getWebviewContent();

		// handle receiving messages from the webview
		currentPanel.webview.onDidReceiveMessage(async message => {
			if (!currentPanel) {
				return;
			}

			//vscode.window.showInformationMessage('Hello VS code from Suresh Nettur - PT!');

			switch (message.command) {
				case 'alert':
					//console.log('Input given:: ' + message.text);

					if (message.text.length === 0) {
						vscode.window.showErrorMessage(`Please enter data to process.`);
						return;
					}

					try {
						let scenario = generateKarateFeature(message.text, 'user_endpoint.feature');
						// console.log('new scenario1:: ' + scenario1);

						currentPanel.webview.postMessage({
							type: 'message', formattedJson: scenario
						});

					}
					catch (error: any) {
						console.error('Error processing generateKarateFeature:', error);
						vscode.window.showErrorMessage(`${error}`);
					}
					return;

				case 'export':
					const content = message.content;
					const firstLine = content.split('\n')[0].trim();

					// Extract filename from "Feature: <<filename>>" and append `.feature`
					let fileName = firstLine.startsWith("Feature:")
						? firstLine.replace("Feature:", "").trim()
						: "feature_file";
					fileName = fileName.replace(/[^a-zA-Z0-9]/g, "_"); // Replace invalid characters
					const defaultFileName = `${fileName}.feature`;

					// Show save dialog with `.feature` as the default file type
					const uri = await vscode.window.showSaveDialog({
						filters: { 'Feature Files': ['feature'] },
						saveLabel: 'Save Feature File',
						defaultUri: vscode.Uri.file(defaultFileName)
					});

					if (uri) {
						// Write the content to the selected file
						await vscode.workspace.fs.writeFile(
							uri,
							Buffer.from(content, 'utf8')
						);
						vscode.window.showInformationMessage('Feature file saved successfully!');
					}
					return;
			}

		}, undefined, context.subscriptions);

	});

	context.subscriptions.push(processtest);
}

// TypeScript function to generate a Karate feature file
function generateKarateFeature(swaggerSpec: string, outputPath: string): any {
	let parsedSpec: any;

	console.log('START Parsing Input Spec.');

	// Parse the spec as JSON or YAML
	try {
		if (swaggerSpec.trim().startsWith('{')) {
			parsedSpec = JSON.parse(swaggerSpec); // JSON spec
		} else {
			parsedSpec = yaml.load(swaggerSpec); // YAML spec
		}

		if (!parsedSpec.openapi) {
			throw new Error("Missing 'openapi' version declaration.");
		}
		if (!parsedSpec.info) {
			throw new Error("Missing 'info' object. It must include metadata about the API.");
		}
		if (!parsedSpec.info.title) {
			throw new Error("Missing 'title' in 'info' object. The API must have a title.");
		}
		if (!parsedSpec.info.version) {
			throw new Error("Missing 'version' in 'info' object. The API must have a version.");
		}
		if (!parsedSpec.paths || Object.keys(parsedSpec.paths).length === 0) {
			throw new Error("'paths' object must define at least one endpoint.");
		}

	} catch (error: any) {
		console.error('Parsing error: ', error);
		throw new Error("Invalid Swagger/OpenAPI specification: " + error.message);
	}

	console.log('END Parsing.');

	const featureTitle = parsedSpec.info?.title || 'Generated Karate Feature';
	let featureContent = `Feature: ${featureTitle}\n\n`;

	// Iterate over each path
	for (const path in parsedSpec.paths) {
		const methods = parsedSpec.paths[path];

		// Iterate over each HTTP method in the path
		for (const method in methods) {
			const endpointDetails = methods[method];
			const summary = endpointDetails.summary || `Testing ${method.toUpperCase()} ${path}`;
			const requestBody = endpointDetails.requestBody;
			const responses = endpointDetails.responses;

			// Generate request payload if available
			let requestPayload = '';
			if (requestBody?.content?.["application/json"]) {
				const exampleRequest = generateMockData(requestBody.content["application/json"].schema);
				requestPayload = `    And request ${JSON.stringify(exampleRequest, null, 2)}\n`;
			}

			// Create separate scenarios for each status code and response
			for (const statusCode in responses) {
				const response = responses[statusCode];
				const responseSummary = response.description || `Response ${statusCode}`;
				const responseContent = response.content?.["application/json"];
				let responseMock = '';

				if (responseContent) {
					const exampleResponse = generateMockData(responseContent.schema);
					responseMock = `    And match response == ${JSON.stringify(exampleResponse, null, 2)}\n`;
				}

				// Add scenario for the current status and response
				featureContent += `  Scenario: ${summary} - ${responseSummary}\n`;
				featureContent += `    Given url baseUrl + "${path}"\n`;
				featureContent += `    And method ${method.toUpperCase()}\n`;
				featureContent += requestPayload;
				featureContent += `    Then status ${statusCode}\n`;
				featureContent += responseMock;
				featureContent += `\n`; // Blank line between scenarios
			}
		}
	}

	return featureContent;
}

// Helper function to generate mock data based on schema
function generateMockData(schema: any): any {
	if (!schema || typeof schema !== 'object') {
		return {};
	}

	switch (schema.type) {
		case 'integer':
			return 0;
		case 'string':
			return 'example';
		case 'boolean':
			return false;
		case 'array':
			return [generateMockData(schema.items)];
		case 'object':
			return Object.fromEntries(
				Object.entries(schema.properties || {}).map(([key, subschema]) => [key, generateMockData(subschema)])
			);
		default:
			return null;
	}
}

function getWebviewContent() {
	return `<!DOCTYPE html>
  <html>
    <head>
        <style>

			table {
				width: 100%;
				display: flex;
				justify-content: center;
				align-items: flex-start;
			}

			table tr {
				display: flex;
				width: 100%;
				justify-content: space-between;
				gap: 20px; /* Space between cells */
			}

			.table-cell {
				flex: 1; /* Allow each cell to expand */
			}

		h1.fancy {
			font-family: 'Segoe UI', serif;
			font-size: 30px;
			font-weight: bold;
			text-align: center;
			background: linear-gradient(135deg, #36d1dc, #5b86e5);
			color: transparent;
			-webkit-background-clip: text;
			background-clip: text;
			margin-bottom: 0;
		}

		h4.fancy {
			font-family: 'Segoe UI', monospace;
			font-size: 16px;
			text-align: center;
			color: #708090;
			letter-spacing: 1px;
			transition: all 0.3s ease-in-out;
			margin-top: 0;
		}

			textarea {
				resize: none;
				padding: 15px;
				font-size: 16px;
				font-family: 'Segoe UI', sans-serif;
				color: white;
				background-color: #3a3a3a;
				border: none;
				overflow: auto;
				outline: none;
			}

			.button-container {
				display: flex;
				flex-direction: column;
				gap: 5px;
				align: center;
				justify-content: flex-start;
			}

			.fancy-button {
				padding: 12px 24px;
				font-size: 14px;
				font-family: 'Segoe UI', Tahoma, Geneva, sans-serif;
				color: white;
				height: 40px;
				background-color: #007acc;
				border: none;
				border-radius: 5px;
				outline: none;
				cursor: pointer;
				width: 100%;
			}

			.fancy-button:disabled {
				background-color: #cccccc;
				color: #666666;
				cursor: not-allowed;
				opacity: 0.7;
			}

			.fancy-label {
				font-family: 'Segoe UI', sans-serif;
				font-size: 16px;
				font-weight: bold;
				color: #708090;
				letter-spacing: 1px;
				text-align: left;
			}

		</style>
    </head>
	
	<body>

	<script type="text/javascript">

		const vscode = acquireVsCodeApi(); 

		function clearAll() {
			document.getElementById("txt").value = "Enter OpenAPI/Swagger Spec (JSON/ yaml) here.";
			document.getElementById("formattedJsonText").value = "";
			document.getElementById("exportBtn").disabled = true;
		}

		function displayOut() {
			vscode.postMessage({
				command: "alert", 
				text: document.getElementById("txt").value
			});
		}

        function sampleScenario() {
            const sampleText = \`
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
paths:
  /users:
    post:
      summary: Creates or retrieves a user by ID
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: integer
      responses:
        '200':
          description: A JSON object of the user with specified ID
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: integer
                  name:
                    type: string
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
            \`;
            document.getElementById("txt").value = sampleText.trim();
        }

		function exportContent() {
            const textareaContent = document.getElementById('formattedJsonText').value;
            vscode.postMessage({
                command: 'export',
                content: textareaContent
            });
        }
	
	    // Handle the message inside the webview
        window.addEventListener("message", event => {
			document.getElementById("formattedJsonText").value = event.data.formattedJson;
			document.getElementById("formattedJsonText").setSelectionRange(0, 0);
			document.getElementById("formattedJsonText").focus();
			document.getElementById("exportBtn").disabled = false;
        });

	</script>

<form>
	<table style="width: 100%;" align="center" border="0">
		<tr>
			<td class="table-cell">
				<h1 class="fancy">Karate Feature Auto Generator</h1>
				<h4 class="fancy">Automatically generate Karate Feature(s) from OpenAPI/Swagger spec/JSON/ YAML<h4>
			</td>
		</tr>
		<tr>
			<td class="table-cell" align="center">
      			<label class="fancy-label">Specification</label>
			</td>
			<td class="table-cell" align="center">&nbsp;</td>
			<td class="table-cell" align="center">
				<label class="fancy-label">Karate Feature(s)</label>
			</td>
		</tr>
  		<tr>
			<td class="table-cell" align="center">
      			<textarea id="txt" rows="30" cols="50">Enter OpenAPI/Swagger Spec (JSON/ yaml) here.</textarea>
    		</td>
			<td class="button-container">
				<input class="fancy-button" type="button" onclick="displayOut()" value="Process">
				<input class="fancy-button" type="button" onclick="clearAll()" value="Clear">
				<input class="fancy-button" type="button" onclick="sampleScenario()" value="Sample Scenario">
				<input class="fancy-button" type="button" id="exportBtn" onclick="exportContent()" value="Export" disabled>
			</td>
			<td class="table-cell" align="center">
				<textarea id="formattedJsonText" rows="30" cols="50" readonly="readonly"></textarea>
			</td>
  		</tr>
	</table>
</form>

</body>
</html>`;
}

// This method is called when your extension is deactivated
export function deactivate() { }
