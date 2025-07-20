// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process'; // Import exec for running system commands
import { promisify } from 'util'; // Import promisify to use exec with async/await

const execPromise = promisify(exec); // Create a promise-based version of exec

// Function to handle the AI commit suggestion logic
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
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "ai-vscode" is now active!');


    // Register the custom commit action command (for the SCM button)
    const customCommitActionDisposable = vscode.commands.registerCommand('ai-vscode.customCommitAction', handleAiCommitSuggestion);

    // Add both command disposables to the extension context
    context.subscriptions.push(customCommitActionDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
