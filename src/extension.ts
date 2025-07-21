// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process'; // Import exec for running system commands
import { promisify } from 'util'; // Import promisify to use exec with async/await
import * as path from 'path'; // Import path module for resolving file paths
import * as fs from 'fs'; // Import fs for reading file content

const execPromise = promisify(exec); // Create a promise-based version of exec

// Function to handle the AI commit suggestion logic (remains the same)
async function handleAiCommitSuggestion() {
    // Ensure there's an open workspace folder
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open. Please open a folder to use this command.');
        return;
    }

    // Get the path of the first workspace folder (your project root)
    const workspaceRootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

    // Get the configured command from settings
    const config = vscode.workspace.getConfiguration('ai-vscode'); // 'ai-vscode' matches your extension name
    const systemCommand = config.get<string>('aiCommitCommand', 'ai-commit'); // Default to 'ai-commit' if not set

    // Show a progress notification while the command runs
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification, // Shows a notification in the bottom right
        title: "Generating AI Commit Suggestion...", // Title of the progress notification
        cancellable: false // User cannot cancel this specific progress
    }, async (progress) => {
        try {
            // Execute the command with the CWD set to the workspace root
            const { stdout, stderr } = await execPromise(systemCommand, { cwd: workspaceRootPath });

            if (stderr) {
                // If there's an error from the system command, show it to the user
                vscode.window.showErrorMessage(`Error from command: ${stderr}`);
                return;
            }

            const suggestedMessage = stdout.trim(); // Get the output and trim whitespace

            // Offer the user options: copy to clipboard or review in an input box
            const action = await vscode.window.showInformationMessage(
                `AI suggested: "${suggestedMessage}"`,
                'Copy to Clipboard', // Button 1
                'Review in Input Box' // Button 2
            );

            if (action === 'Copy to Clipboard') {
                // Copy the suggested message to the user's clipboard
                await vscode.env.clipboard.writeText(suggestedMessage);
                vscode.window.showInformationMessage('Suggested commit message copied to clipboard!');
            } else if (action === 'Review in Input Box') {
                // Show an input box where the user can review and edit the suggestion
                const userInput = await vscode.window.showInputBox({
                    prompt: 'Review and edit the suggested commit message:',
                    value: suggestedMessage,
                    valueSelection: [0, suggestedMessage.length] // Select all text for easy editing
                });
                if (userInput !== undefined) { // If user didn't cancel the input box
                    vscode.window.showInformationMessage('Finalized message: "' + userInput + '". You can now manually paste it into the commit box.');
                }
            }

        } catch (error: any) {
            // Catch any errors during command execution or other operations
            vscode.window.showErrorMessage(`Failed to generate commit message: ${error.message}. Check your 'AI Commit Extension Configuration' settings.`);
        }
    });
}


// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "ai-vscode" is now active!');
    console.log(`Initial context.subscriptions length: ${context.subscriptions.length}`);

    // Define the view ID here to ensure consistency
    const chatViewId = 'ai-vscode.chatView';
    console.log(`Registering Webview View Provider with ID: ${chatViewId}`);

    // Register the new "AI Commit: Suggest Message" command
    const aiCommitCommandDisposable = vscode.commands.registerCommand('ai-vscode.aiCommit', handleAiCommitSuggestion);

    // Register the custom commit action command (for the SCM button)
    const customCommitActionDisposable = vscode.commands.registerCommand('ai-vscode.customCommitAction', handleAiCommitSuggestion);

    try {
        // Instantiate the webview provider
        const chatProvider = new ChatWebviewProvider(context.extensionUri);

        // Register the Webview View Provider for our chat view
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                chatViewId, // Use the defined ID
                chatProvider // Pass the instantiated provider
            )
        );
        console.log('Webview View Provider registration initiated.');
        console.log(`Context.subscriptions length after webview registration: ${context.subscriptions.length}`);

    } catch (e: any) {
        console.error('Error during Webview View Provider registration:', e.message);
        vscode.window.showErrorMessage(`Failed to register AI Chat Assistant: ${e.message}`);
    }


    // Add all command disposables to the extension context
    context.subscriptions.push(aiCommitCommandDisposable, customCommitActionDisposable);
    console.log(`Final context.subscriptions length: ${context.subscriptions.length}`);
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('Your extension "ai-vscode" is now deactivated.');
}


// Class to manage the Webview View
class ChatWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ai-vscode.chatView'; // Matches view ID

    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
        console.log('ChatWebviewProvider constructor called.');
    }

    // This method is called when a webview is resolved (opened)
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        console.log('resolveWebviewView called for ChatWebviewProvider. This means the view is now visible.');

        // Enable scripts in the webview
        webviewView.webview.options = {
            enableScripts: true,
            // Restrict the webview to only load content from our extension's directory
            localResourceRoots: [this._extensionUri]
        };

        try {
            // Set the HTML content for the webview by loading from file
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
            console.log('Webview HTML content set successfully (from file).');
        } catch (e: any) {
            console.error('Error setting webview HTML content:', e.message);
            webviewView.webview.html = `<!DOCTYPE html><body><h1>Error loading chat interface.</h1><p>${e.message}</p></body></html>`;
        }


        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessageToAI':
                    // Call the Gemini API here
                    const userMessage = message.text;
                    const chatHistory = message.chatHistory; // Get the full chat history from the webview

                    try {
                        const apiKey = ""; // Leave this empty, Canvas provides it at runtime
                        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                        const payload = {
                            contents: chatHistory
                        };

                        const response = await fetch(apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        const result = await response.json();

                        if (result.candidates && result.candidates.length > 0 &&
                            result.candidates[0].content && result.candidates[0].content.parts &&
                            result.candidates[0].content.parts.length > 0) {
                            const aiText = result.candidates[0].content.parts[0].text;
                            // Send AI response back to the webview
                            webviewView.webview.postMessage({ command: 'aiResponse', text: aiText });
                        } else {
                            // Handle cases where the response structure is unexpected
                            const errorText = "Unexpected AI response structure.";
                            console.error(errorText, result);
                            webviewView.webview.postMessage({ command: 'aiError', text: errorText });
                        }
                    } catch (error: any) {
                        // Handle network errors or other API call issues
                        const errorText = `Failed to get AI response: ${error.message}`;
                        console.error(errorText, error);
                        webviewView.webview.postMessage({ command: 'aiError', text: errorText });
                    }
                    break;
            }
        });
    }

    // Helper to get the HTML content for the webview
    private _getHtmlForWebview(webview: vscode.Webview) {
        // Correctly get the file system path for the HTML file
        const htmlFilePath = path.join(this._extensionUri.fsPath, 'src', 'webview', 'index.html');
        console.log(`Attempting to load HTML from: ${htmlFilePath}`);

        // Ensure the file exists before trying to read it
        if (!fs.existsSync(htmlFilePath)) {
            console.error(`Webview HTML file not found at: ${htmlFilePath}`);
            return `<!DOCTYPE html><body><h1>Error: Webview HTML not found.</h1><p>Looked for: <code>${htmlFilePath}</code></p><p>Please ensure 'src/webview/index.html' exists in your extension's source directory.</p></body></html>`;
        }

        // Read the HTML file content
        let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

        // Get the URI for the compiled webview script
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'main.js'));
        console.log(`Webview script URI: ${scriptUri.toString()}`);

        // Replace the placeholder in the HTML with the actual script URI
        htmlContent = htmlContent.replace('{{webviewScriptUri}}', scriptUri.toString());

        return htmlContent;
    }
}
