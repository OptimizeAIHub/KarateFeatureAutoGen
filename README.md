# Karate Feature Test Generator

## Description

The **Karate Feature Test Generator** is a Visual Studio Code extension designed to simplify API testing and automation. It takes OpenAPI/Swagger specifications (JSON or YAML format) as input and generates Karate feature files with predefined test scenarios. Ideal for developers and testers, this extension streamlines the creation of robust API test scripts, saving time and effort during the development and QA process.

**Authors**: Suresh Babu Nettur.

---

## Features

- **Input Flexibility**: Accepts OpenAPI/Swagger specifications in both JSON and YAML formats.
- **Automated Test Generation**: Creates Karate feature files with test scenarios for endpoints, including request and response validation.
- **Mock Data Support**: Generates mock request and response data based on the provided API schema.
- **Easy Export**: Allows you to export generated feature files for direct use in Karate-based testing frameworks.
- **User-Friendly Interface**: Features an intuitive UI for processing specifications, clearing input, viewing sample scenarios, and exporting test cases.

---

## Requirements

- **Visual Studio Code**: Version 1.36.1 or higher.
- **Node.js**: Version 14 or higher (for local development and extension customization).
- **Valid OpenAPI/Swagger Specifications**: JSON or YAML format supported.

---

## Installation

1. Open Visual Studio Code.
2. Go to the **Extensions** view by clicking on the Extensions icon in the Activity Bar.
3. Search for `Karate Feature Test Generator` in the Extensions Marketplace.
4. Click **Install**.
5. Once installed, activate the extension by opening the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) and selecting `Karate Feature Test Generator`.

---

## Usage

1. Open the extension in Visual Studio Code.
2. Paste a valid OpenAPI/Swagger specification in the input text area.
3. Click **Process** to generate mock data.
4. The generated mock data will appear in the "Karate Feature(s)" text area.
5. Click **Clear** to reset both the input and output areas.
6. Click **Sample Scenario** to input sample spec.
7. Click **Export** to save the result as a feature test file.

---

## Known Issues

- **Invalid Specifications**: The extension may not handle improperly formatted OpenAPI/Swagger specifications correctly.
- **Large Specs**: Processing very large specifications may result in slower performance or memory limitations.
- **YAML Edge Cases**: Complex YAML syntax may sometimes cause unexpected errors.

---

## License

This extension is licensed under the [MIT License](LICENSE).
See the LICENSE file for details.

---

## Disclaimer

- **Ethical Usage**: This tool is designed for ethical development and testing purposes only. Do not use it for any unethical or inappropriate activities.
- **PII/PHI Handling**: Avoid including personally identifiable information (PII) or protected health information (PHI) in the input spec. The developers are not responsible for any misuse of the extension.
- **Spec Validity**: Ensure the OpenAPI/Swagger specification provided is valid and correctly formatted for accurate mock data generation.

### Support

For issues or questions, visit the GitHub repository or contact us via the Visual Studio Code Marketplace.
