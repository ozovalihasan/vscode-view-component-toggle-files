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
            let active_file_name = editor.document.fileName

            if (active_file_name.includes(".snap")){
                let originalFileNameMatch = active_file_name.match(/(.*)[_-]/)
                if (originalFileNameMatch){
                    active_file_name = active_file_name.replace(/\/__snapshots__/, "")
                    active_file_name = active_file_name.replace(/\/[^/]*$/, "_spec.rb")
                }

                commands.executeCommand(
                    'vscode.open',
                    Uri.file(active_file_name)
                );
                
            } else {
                const cursorPosition = editor.selection.active
                const currentLineText = editor.document.lineAt(cursorPosition.line).text
                if (!currentLineText.match("match_custom_snapshot")) {
                    window.setStatusBarMessage('Pleasea select a line containing "match_custom_snapshot"', 1000);
                    return
                }
                let currentLineMatch = currentLineText.match(/match_custom_snapshot\(\s*['|"](.*)['|"]\s*\)/)
                let snapshotName = (currentLineMatch && currentLineMatch[1]) || "default"
                
                let activeFileName = editor.document.fileName
                let activeFileNameMatch = activeFileName.match(/(.*\/)([^\/]*)_spec.rb$/)

                let folderOfSnapshot = ""
                if (activeFileNameMatch){
                    folderOfSnapshot = activeFileNameMatch[1] + "__snapshots__/" + activeFileNameMatch[2] + "/"
                }
                
                let selectedSnapshot = ""
                if (snapshotName !== "" && folderOfSnapshot !== "" ) {
                    selectedSnapshot = folderOfSnapshot.concat(snapshotName).concat(".snap")
                } else {
                    window.setStatusBarMessage('A suitable snapshot file couldn"t be found', 1000);
                    return
                }

                commands.executeCommand(
                    'vscode.open',
                    Uri.file(selectedSnapshot)
                );
            }
            
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
