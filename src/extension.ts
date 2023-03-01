import { commands, Uri, window } from 'vscode';

export function activate() {
    commands.registerCommand('vscode-view-component-toggle-files.quick-open-html-erb', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            const cursorPosition = editor.selection.active
            const currentLineText = editor.document.lineAt(cursorPosition.line).text
            let currentLineMatch = currentLineText.match(/render\s*(.*Component)/)
            let selectedText = ""

            if (currentLineMatch !== null) {
                selectedText = currentLineMatch[1].concat(".html.erb")
            } else {
                selectedText = editor.document.getText(editor.selection)
            }

            selectedText = selectedText.replace("::", "/");

            if (selectedText.toLowerCase().includes("\n")){
                selectedText = ""
            }

            commands.executeCommand(
                'workbench.action.quickOpen',
                selectedText
            );
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.quick-open-ruby', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            const cursorPosition = editor.selection.active
            const currentLineText = editor.document.lineAt(cursorPosition.line).text
            let currentLineMatch = currentLineText.match(/render\s*(.*Component)/)
            let selectedText = ""

            if (currentLineMatch !== null) {
                selectedText = currentLineMatch[1].concat(".rb")
            } else {
                selectedText = editor.document.getText(editor.selection)
            }

            selectedText = selectedText.replace("::", "/");

            if (selectedText.toLowerCase().includes("\n")){
                selectedText = ""
            }

            commands.executeCommand(
                'workbench.action.quickOpen',
                selectedText
            );
        }
    });
    
    commands.registerCommand('vscode-view-component-toggle-files.search-files-including-component', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName
            activeFileName = activeFileName.replace(/.*\/(app|spec)\/components\//, "")
            activeFileName = activeFileName.replace(/_component(\.html\.erb|\.rb|_spec\.rb)/, "_component")

            let changedFileName = activeFileName.split("/").map((part) => {
                                                    return part.split("_")
                                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                        .join("")
                                                }).join("::")
            
            commands.executeCommand(
                'workbench.action.findInFiles',
                {   
                    query: changedFileName,
                    triggerSearch: true
                }
            );
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-snap-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            const cursorPosition = editor.selection.active
            const currentLineText = editor.document.lineAt(cursorPosition.line).text
            let currentLineMatch = currentLineText.match(/match_snapshot\(\s*['|"](.*)['|"]\s*\)/)
            
            let activeFileName = editor.document.fileName
            let activeFolder = activeFileName.match(/(.*\/)[^\/]*$/)
            
            
            let selectedSnapshot = ""
            if (currentLineMatch !== null && activeFolder !== null ) {
                selectedSnapshot = activeFolder[1].concat("__snapshots__/").concat(currentLineMatch[1].concat(".snap"))
            } else {
                window.setStatusBarMessage('A suitable snapshot file couldn"t be found', 1000);
                return
            }

            commands.executeCommand(
                'vscode.open',
                Uri.file(selectedSnapshot)
            );
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-rb-file', () => {
        changeToFile("app", ".rb")  
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-rspec-file', () => {
        changeToFile("spec", "_spec.rb")  
    });
    
    commands.registerCommand('vscode-view-component-toggle-files.change-to-html-erb-file', () => {
        changeToFile("app", ".html.erb")  
    });
}


const changeToFile = (folder_name: String, file_extension: String) => {
    
    const editor = window.activeTextEditor;

    if (editor) {
        let active_file_name = editor.document.fileName
        active_file_name = active_file_name.replace(/\/(app|spec)\//, `/${folder_name}/`)

        const changed_file_name = active_file_name.replace(/_component(\.html\.erb|\.rb|_spec\.rb)/, `_component${file_extension}`)
        
        commands.executeCommand(
            'vscode.open',
            Uri.file(changed_file_name)
        );
    }
}
// this method is called when your extension is deactivated
export function deactivate() {}
