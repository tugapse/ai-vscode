**AI-Powered Commit Message Suggestion Extension**
=====

A Visual Studio Code extension that provides AI-powered commit message suggestions to help you write better commit messages.

**Features**
------------

*   **AI-powered commit message suggestions**: Use artificial intelligence to suggest high-quality commit messages based on your code changes.
*   **Flexible handling options**: Choose between copying the suggested message directly to your clipboard or reviewing and editing it in a text input box.
*   **Error handling**: Catch and display any errors that occur during command execution or other operations.

**Installation**
---------------

1.  Open Visual Studio Code.
2.  Navigate to the Extensions view by clicking the Extensions icon in the left sidebar or pressing `Ctrl + Shift + X` (Windows/Linux) or `Cmd + Shift + X` (macOS).
3.  Search for "AI-Powered Commit Message Suggestion" in the Extensions Marketplace.
4.  Click on the extension's result to open its details page.
5.  Click the "Install" button to install the extension.

**Usage**
----------

1.  Open a workspace folder in Visual Studio Code.
2.  Trigger a custom commit action by clicking on the SCM button (usually located near your file tabs).
3.  Choose between copying the suggested message directly to your clipboard or reviewing and editing it in a text input box.

**Configuration**
-----------------

You can configure the extension's behavior by modifying its settings:

1.  Open Visual Studio Code's Settings view by clicking on `File` > `Preferences` > `Settings`.
2.  Navigate to the "ai-vscode" configuration section.
3.  Update the "aiCommitCommand" setting to use a different AI commit command.

**Note**: The AI commit command used by this extension is based on the [AI repository](https://github.com/tugapse/ai). If you'd like to use a different AI model, please update the `aiCommitCommand` setting accordingly.

**Requirements**
---------------

*   Visual Studio Code 1.63 or later
*   Node.js 14 or later

**Troubleshooting**
-------------------

If you encounter any issues with the extension, please check the following:

*   Ensure that you have installed the latest version of Visual Studio Code.
*   Verify that your workspace folder is open in Visual Studio Code.
*   Check the extension's settings for any configuration errors.

**Contributing**
---------------

We welcome contributions from the community! If you'd like to contribute code, please fork this repository and submit a pull request with your changes.

**License**
----------

This extension is released under the [MIT License](https://opensource.org/licenses/MIT).

**Acknowledgments**
------------------

*   This extension uses [Child Process](https://nodejs.org/api/child_process.html) for executing system commands.
*   It also utilizes [VS Code's API](https://code.visualstudio.com/docs/extensionAPI) for interacting with the VS Code environment.
